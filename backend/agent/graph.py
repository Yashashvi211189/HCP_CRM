import json
import operator
import os
from datetime import date, datetime
from typing import Annotated, TypedDict
from urllib import request

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from agent.tools import ALL_TOOLS
from database import ChatMessage, HCP, Interaction

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system helping
field representatives log HCP interactions.

When a rep describes an interaction with a doctor, healthcare provider, clinic,
hospital, or other HCP, extract all relevant information from the full chat
context and call log_interaction.

Capture details such as HCP name, interaction type, date, time, attendees,
topics discussed, materials shared, samples distributed, sentiment, outcomes,
and follow-up actions. If useful details are missing but the message is clearly
about an HCP interaction, ask one short clarifying question instead of guessing.

IMPORTANT:
- Only call log_interaction for a real HCP visit, call, meeting, email, or
  professional engagement.
- Do not call any tool for greetings, random text, gibberish, unrelated
  questions, or casual conversation.
- For a greeting or non-HCP message, respond briefly and professionally. Say
  you can help log HCP interactions and ask the user to describe their meeting,
  call, visit, or provider engagement.
- Keep responses concise, practical, and CRM-focused."""


def trigger_n8n(event, payload):
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        return
    data = json.dumps({"event": event, "payload": payload}).encode("utf-8")
    req = request.Request(webhook_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        request.urlopen(req, timeout=5).read()
    except Exception:
        pass


class AgentState(TypedDict):
    messages: Annotated[list, operator.add]


def _model(model_name):
    return ChatGroq(model=model_name, temperature=0.3, max_tokens=1024).bind_tools(ALL_TOOLS)


def call_model(state: AgentState):
    messages = state["messages"]
    try:
        response = _model("gemma2-9b-it").invoke(messages)
    except Exception:
        response = _model("llama-3.3-70b-versatile").invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


hcp_workflow = StateGraph(AgentState)
hcp_workflow.add_node("agent", call_model)
hcp_workflow.add_node("tools", ToolNode(ALL_TOOLS))
hcp_workflow.set_entry_point("agent")
hcp_workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
hcp_workflow.add_edge("tools", "agent")
hcp_graph = hcp_workflow.compile()


def _history_messages(history):
    messages = []
    for item in history or []:
        role = item.get("role")
        content = item.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        if role == "assistant":
            messages.append(AIMessage(content=content))
    return messages


def _parse_tool_content(content):
    if isinstance(content, dict):
        return content
    try:
        return json.loads(content)
    except Exception:
        return {}


def _save_logged_interaction(data, raw_chat_input, db, user_id=None):
    hcp = None
    hcp_name = data.get("hcp_name") or ""
    if hcp_name:
        hcp = db.query(HCP).filter(HCP.name == hcp_name).first()
        if not hcp:
            hcp = HCP(name=hcp_name)
            db.add(hcp)
            db.flush()

    interaction = Interaction(
        user_id=user_id,
        hcp_id=hcp.id if hcp else None,
        hcp_name=hcp_name,
        interaction_type=data.get("interaction_type") or "Meeting",
        interaction_date=datetime.strptime(data.get("interaction_date") or date.today().isoformat(), "%Y-%m-%d").date(),
        interaction_time=datetime.strptime((data.get("interaction_time") or datetime.now().strftime("%H:%M"))[:5], "%H:%M").time(),
        attendees=data.get("attendees") or "",
        topics_discussed=data.get("topics_discussed") or "",
        materials_shared=data.get("materials_shared") or "",
        samples_distributed=data.get("samples_distributed") or "",
        sentiment=data.get("sentiment") or "Neutral",
        outcomes=data.get("outcomes") or "",
        followup_actions=data.get("followup_actions") or "",
        raw_chat_input=raw_chat_input,
    )
    db.add(interaction)
    db.flush()
    db.add(ChatMessage(interaction_id=interaction.id, role="user", content=raw_chat_input))
    data["id"] = interaction.id
    return interaction


def _fallback_extract(user_message):
    lowered = (user_message or "").lower()
    if not any(token in lowered for token in ["dr.", "doctor", "hcp", "met", "call", "meeting", "visit", "discussed"]):
        return None
    hcp_name = ""
    words = user_message.replace(",", " ").split()
    for index, word in enumerate(words):
        if word.lower().replace(".", "") in ["dr", "doctor"] and index + 1 < len(words):
            hcp_name = f"Dr. {words[index + 1].strip('.,')}"
            break
    if not hcp_name:
        return None
    topics = ""
    if "discussed" in lowered:
        topics = user_message.lower().split("discussed", 1)[1].split(",", 1)[0].strip()
    sentiment = "Neutral"
    if "positive" in lowered:
        sentiment = "Positive"
    if "negative" in lowered:
        sentiment = "Negative"
    return {
        "hcp_name": hcp_name,
        "interaction_type": "Call" if "call" in lowered else "Meeting",
        "interaction_date": date.today().isoformat(),
        "interaction_time": datetime.now().strftime("%H:%M"),
        "attendees": "",
        "topics_discussed": topics,
        "materials_shared": "Brochures" if "brochure" in lowered else "",
        "samples_distributed": "",
        "sentiment": sentiment,
        "outcomes": "",
        "followup_actions": "",
    }


def run_agent(user_message, history, db, user_id=None):
    messages = [SystemMessage(content=SYSTEM_PROMPT), *_history_messages(history), HumanMessage(content=user_message or "")]
    extracted_data = {}
    suggestions = []
    reply = ""

    try:
        result = hcp_graph.invoke({"messages": messages})
        result_messages = result["messages"]
    except Exception:
        result_messages = []

    for message in result_messages:
        if isinstance(message, AIMessage) and message.content:
            reply = message.content if isinstance(message.content, str) else str(message.content)
        if isinstance(message, ToolMessage):
            payload = _parse_tool_content(message.content)
            if payload.get("action") == "log_interaction" and payload.get("data"):
                extracted_data = payload["data"]
            if payload.get("action") == "suggest_followups":
                suggestions = payload.get("suggestions", [])

    if not extracted_data:
        extracted_data = _fallback_extract(user_message) or {}

    if extracted_data:
        if not suggestions:
            sentiment = extracted_data.get("sentiment") or "Neutral"
            hcp_name = extracted_data.get("hcp_name") or "the HCP"
            if sentiment == "Positive":
                suggestions = [
                    f"Schedule follow-up with {hcp_name}",
                    f"Send clinical data on {extracted_data.get('topics_discussed') or 'the discussed topic'}",
                    f"Add {hcp_name} to advisory board consideration",
                ]
            elif sentiment == "Negative":
                suggestions = ["Address concerns", "Escalate to MSL", "Schedule demo"]
            else:
                suggestions = ["Send summary email", "Schedule product demo", "Share materials"]
        extracted_data["ai_suggested_followups"] = suggestions
        if db is None:
            return {
                "reply": reply or "Interaction logged and follow-ups suggested.",
                "extracted_data": extracted_data,
                "suggestions": suggestions,
            }
        interaction = _save_logged_interaction(extracted_data, user_message or "", db, user_id)
        interaction.ai_suggested_followups = "\n".join(suggestions)
        db.add(ChatMessage(interaction_id=interaction.id, role="assistant", content=reply or "Interaction logged and follow-ups suggested."))
        db.commit()
        response = {"reply": reply or "Interaction logged and follow-ups suggested.", "extracted_data": extracted_data, "suggestions": suggestions}
        trigger_n8n("interaction_logged_from_chat", response)
        return response

    return {
        "reply": reply or "I can help you log and organize HCP interactions. Tell me about a meeting, call, visit, or provider engagement, and I will help sort it into a clean CRM record.",
        "extracted_data": {},
        "suggestions": [],
    }
