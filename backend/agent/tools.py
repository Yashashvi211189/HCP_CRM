from datetime import date, datetime

from langchain_core.tools import tool


def _is_empty_or_gibberish(text):
    value = (text or "").strip()
    if not value:
        return True
    letters = [char for char in value if char.isalpha()]
    return len(letters) < 3


@tool
def log_interaction(
    hcp_name: str = "",
    interaction_type: str = "Meeting",
    interaction_date: str = "",
    interaction_time: str = "",
    attendees: str = "",
    topics_discussed: str = "",
    materials_shared: str = "",
    samples_distributed: str = "",
    sentiment: str = "Neutral",
    outcomes: str = "",
    followup_actions: str = "",
):
    """Extract and log an HCP interaction."""
    if _is_empty_or_gibberish(hcp_name):
        return {"action": "log_interaction", "error": True, "message": "Please describe a real HCP interaction and try again."}

    data = {
        "hcp_name": hcp_name,
        "interaction_type": interaction_type or "Meeting",
        "interaction_date": interaction_date or date.today().isoformat(),
        "interaction_time": (interaction_time or datetime.now().strftime("%H:%M"))[:5],
        "attendees": attendees or "",
        "topics_discussed": topics_discussed or "",
        "materials_shared": materials_shared or "",
        "samples_distributed": samples_distributed or "",
        "sentiment": sentiment or "Neutral",
        "outcomes": outcomes or "",
        "followup_actions": followup_actions or "",
    }
    return {"action": "log_interaction", "data": data, "message": f"✅ Interaction logged for {hcp_name}!"}


@tool
def edit_interaction(interaction_id: int, field: str, new_value: str):
    """Modify one supported field on an interaction."""
    allowed = {
        "hcp_name",
        "interaction_type",
        "interaction_date",
        "interaction_time",
        "attendees",
        "topics_discussed",
        "materials_shared",
        "samples_distributed",
        "sentiment",
        "outcomes",
        "followup_actions",
    }
    if field not in allowed:
        return {"action": "edit_interaction", "error": True, "message": "Unsupported field"}
    return {
        "action": "edit_interaction",
        "interaction_id": interaction_id,
        "field": field,
        "new_value": new_value,
        "message": f"✅ Updated {field}",
    }


@tool
def get_hcp_profile(hcp_name: str):
    """Fetch an HCP profile."""
    return {"action": "get_hcp_profile", "hcp_name": hcp_name, "message": f"Fetching profile for {hcp_name}"}


@tool
def suggest_followups(hcp_name: str, topics_discussed: str, sentiment: str):
    """Generate three follow-up suggestions for an HCP interaction."""
    sentiment_value = (sentiment or "Neutral").lower()
    if sentiment_value == "positive":
        suggestions = [
            f"Schedule follow-up with {hcp_name}",
            f"Send clinical data on {topics_discussed or 'the discussed topic'}",
            f"Add {hcp_name} to advisory board consideration",
        ]
    elif sentiment_value == "negative":
        suggestions = [
            f"Address concerns raised by {hcp_name}",
            "Escalate discussion to MSL",
            "Schedule demo to clarify clinical value",
        ]
    else:
        suggestions = [
            f"Send summary email to {hcp_name}",
            "Schedule product demo",
            "Share relevant materials",
        ]
    return {"action": "suggest_followups", "suggestions": suggestions, "message": "Suggestions generated"}


@tool
def analyze_sentiment(text: str):
    """Classify text as Positive, Neutral, or Negative."""
    lowered = (text or "").lower()
    positive_score = sum(word in lowered for word in ["positive", "interested", "agreed", "good", "strong", "liked"])
    negative_score = sum(word in lowered for word in ["negative", "concern", "concerned", "poor", "declined", "issue"])
    sentiment = "Neutral"
    if positive_score > negative_score:
        sentiment = "Positive"
    if negative_score > positive_score:
        sentiment = "Negative"
    return {"action": "analyze_sentiment", "sentiment": sentiment, "message": f"Detected: {sentiment}"}


ALL_TOOLS = [log_interaction, edit_interaction, get_hcp_profile, suggest_followups, analyze_sentiment]
