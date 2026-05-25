import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { sendChatMessage } from "../hooks/api";
import { addMessage, setError, setLoading } from "../store/chatSlice";
import { populateFromAI, setField, setSuggestions } from "../store/interactionSlice";

const productPattern = /\bProduct\s+[A-Z0-9]+\b/gi;

function extractProducts(text) {
  const matches = (text || "").match(productPattern) || [];
  return [...new Set(matches)];
}

function confidence(value, base) {
  return value ? base : 0;
}

function AIChatPanel({ selectedHcp }) {
  const dispatch = useDispatch();
  const { messages, isLoading, error } = useSelector((state) => state.chat);
  const form = useSelector((state) => state.interaction);
  const [message, setMessage] = useState("");

  const products = useMemo(() => extractProducts(`${form.topics_discussed} ${form.raw_chat_input || ""}`), [form.topics_discussed, form.raw_chat_input]);
  const hcpContext = {
    name: form.hcp_name || selectedHcp?.name || "",
    specialty: selectedHcp?.specialty || "Not available",
    organization: selectedHcp?.organization || "Not available",
    previousInteractions: selectedHcp?.previousInteractions || "Not available",
    lastInteraction: selectedHcp?.lastInteraction || "Not available",
  };
  const hasExtraction = Boolean(form.hcp_name || form.topics_discussed || form.materials_shared || form.outcomes || form.ai_suggested_followups.length);

  const extractedItems = [
    ["Doctor", form.hcp_name],
    ["Interaction", form.interaction_type],
    ["Product", products.join(", ")],
    ["Sentiment", form.sentiment],
    ["Material", form.materials_shared],
    ["Samples", form.samples_distributed],
    ["Outcome", form.outcomes],
  ];

  const confidenceItems = [
    ["HCP Name", confidence(form.hcp_name, 98)],
    ["Topic", confidence(form.topics_discussed, 94)],
    ["Sentiment", confidence(form.sentiment, 91)],
    ["Materials", confidence(form.materials_shared, 86)],
  ];

  const handleSend = async () => {
    const content = message.trim();
    if (!content || isLoading) return;

    const userMessage = { role: "user", content };
    dispatch(addMessage(userMessage));
    dispatch(setError(null));
    setMessage("");
    dispatch(setLoading(true));

    try {
      const history = messages.filter((item) => item.role !== "system");
      const response = await sendChatMessage(content, history);
      dispatch(populateFromAI(response.data.extracted_data));
      dispatch(setSuggestions(response.data.suggestions || []));
      dispatch(addMessage({ role: "assistant", content: response.data.reply }));
    } catch (err) {
      dispatch(setError("Could not connect to backend"));
      dispatch(addMessage({ role: "assistant", content: "Could not connect to backend" }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <section className="panel chat-panel">
      <header className="ai-header">
        <div>
          <p className="eyebrow">AI workspace</p>
          <h2>HCP CRM AI Assistant</h2>
          <p>Log interaction details, extract CRM fields, and suggest follow-ups.</p>
        </div>
        <div className={`processing-dot ${isLoading ? "active" : ""}`} aria-label={isLoading ? "AI processing" : "AI idle"} />
      </header>

      <div className="ai-workspace">
        <div className="chat-history compact">
          <div className="message system">Example: Today I met with Dr. Smith, discussed Product X efficacy, positive sentiment, and shared brochures.</div>
          {messages.map((item, index) => (
            <div className={`message ${item.role}`} key={`${item.role}-${index}`}>{item.content}</div>
          ))}
          {error && <div className="ai-alert">{error}</div>}
        </div>

        <div className="ai-card">
          <div className="ai-card-title">
            <h3>AI Extracted Summary</h3>
            <span>{hasExtraction ? "Populated" : "Waiting for note"}</span>
          </div>
          <div className="summary-grid">
            {extractedItems.map(([label, value]) => (
              <div className="summary-item" key={label}>
                <span>{label}</span>
                <strong>{value || "Not detected"}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-card">
          <div className="ai-card-title">
            <h3>Confidence Indicators</h3>
            <span>{isLoading ? "Analyzing" : "Ready"}</span>
          </div>
          <div className="confidence-list">
            {confidenceItems.map(([label, score]) => (
              <div className="confidence-row" key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{score ? `${score}%` : "--"}</strong>
                </div>
                <div className="confidence-bar"><span style={{ width: `${score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-card">
          <div className="ai-card-title">
            <h3>Recommended Follow-ups</h3>
            <span>{form.ai_suggested_followups.length} actions</span>
          </div>
          <div className="followup-action-list">
            {(form.ai_suggested_followups || []).map((suggestion, index) => (
              <div className="followup-action-card" key={suggestion}>
                <div>
                  <span className={`priority ${index === 0 ? "high" : index === 1 ? "medium" : "low"}`}>
                    {index === 0 ? "High" : index === 1 ? "Medium" : "Low"}
                  </span>
                  <strong>{suggestion}</strong>
                  <p>Suggested due date: {index === 0 ? "48 hours" : index === 1 ? "7 days" : "14 days"}</p>
                </div>
                <button type="button" onClick={() => dispatch(setField({ field: "followup_actions", value: suggestion }))}>Accept</button>
              </div>
            ))}
            {!form.ai_suggested_followups.length && <p className="muted">AI recommendations will appear after an interaction note is processed.</p>}
          </div>
        </div>

        <div className="ai-card">
          <div className="ai-card-title">
            <h3>Doctor Context</h3>
            <span>CRM profile</span>
          </div>
          <div className="doctor-card">
            <div className="doctor-avatar">{hcpContext.name ? hcpContext.name.slice(0, 2).toUpperCase() : "DR"}</div>
            <div>
              <strong>{hcpContext.name || "No HCP selected"}</strong>
              <p>Specialty: {hcpContext.specialty}</p>
              <p>Organization: {hcpContext.organization}</p>
              <p>Previous interactions: {hcpContext.previousInteractions}</p>
              <p>Last interaction: {hcpContext.lastInteraction}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-input">
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message AI assistant..." />
        <button type="button" onClick={handleSend} disabled={isLoading}>{isLoading ? "Sending" : "Send"}</button>
      </div>
    </section>
  );
}

export default AIChatPanel;
