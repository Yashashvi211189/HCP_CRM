import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { saveInteraction, sendChatMessage, trackActivity } from "../hooks/api";
import { addMessage, setError, setLoading } from "../store/chatSlice";
import { populateFromAI, resetForm, setField, setNotificationStatus, setSavedId, setSaveError, setSaving, setSuggestions } from "../store/interactionSlice";

function FormCard({ title, description, children }) {
  return (
    <div className="form-card">
      <div className="form-card-header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function LogInteractionForm({ selectedHcp }) {
  const dispatch = useDispatch();
  const form = useSelector((state) => state.interaction);
  const { messages, isLoading } = useSelector((state) => state.chat);
  const [listening, setListening] = useState(false);

  const update = (field, value) => dispatch(setField({ field, value }));

  const handleSave = async () => {
    dispatch(setSaving(true));
    try {
      const response = await saveInteraction(form);
      trackActivity("crm_save_button", "/crm").catch(() => {});
      dispatch(setSavedId(response.data.id));
      dispatch(setNotificationStatus(response.data.notification?.message || "Provider notification triggered."));
    } catch (error) {
      dispatch(setSaveError("Could not save interaction"));
      dispatch(setNotificationStatus(""));
    } finally {
      dispatch(setSaving(false));
    }
  };

  const submitVoiceNote = async (content) => {
    dispatch(addMessage({ role: "user", content }));
    dispatch(setError(null));
    dispatch(setLoading(true));
    try {
      const history = messages.filter((item) => item.role !== "system");
      const response = await sendChatMessage(content, history);
      dispatch(populateFromAI(response.data.extracted_data));
      dispatch(setSuggestions(response.data.suggestions || []));
      dispatch(addMessage({ role: "assistant", content: response.data.reply }));
    } catch (error) {
      dispatch(setError("Could not connect to backend"));
      dispatch(addMessage({ role: "assistant", content: "Could not connect to backend" }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleVoiceNote = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || listening || isLoading) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    let finalTranscript = "";

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      update("topics_discussed", `${finalTranscript}${interimTranscript}`.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      const content = finalTranscript.trim();
      if (content) submitVoiceNote(content);
    };
    recognition.start();
  };

  return (
    <section className="panel form-panel">
      <div className="form-hero">
        <div>
          <p className="eyebrow">HCP CRM workspace</p>
          <h1>Log HCP Interaction</h1>
          {selectedHcp && <p className="selected-context">Workspace: {selectedHcp.name} | {selectedHcp.specialty}</p>}
        </div>
        <div className="form-hero-actions">
          <span className="record-required-pill">CRM record</span>
          <div className={`ai-state-pill ${isLoading ? "thinking" : ""}`}>{isLoading ? "AI extracting" : "Ready"}</div>
        </div>
      </div>

      <div className="interaction-focus-banner">
        <div>
          <span>1</span>
          <strong>Review the interaction details here before saving</strong>
        </div>
        <p>AI can populate this CRM record, but this section is the final source of truth for saved HCP interactions.</p>
      </div>

      <FormCard title="Interaction Details" description="Core CRM fields used for routing, history, compliance, and follow-up.">
        <div className="two-column">
          <label>
            HCP Name
            <input value={form.hcp_name} onChange={(event) => update("hcp_name", event.target.value)} placeholder="Search or select HCP..." />
          </label>
          <label>
            Interaction Type
            <select value={form.interaction_type} onChange={(event) => update("interaction_type", event.target.value)}>
              <option>Meeting</option>
              <option>Call</option>
              <option>Email</option>
              <option>Conference</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <details className="details-block">
          <summary>Date, time, and attendees</summary>
          <div className="two-column">
            <label>
              Date
              <input type="date" value={form.interaction_date} onChange={(event) => update("interaction_date", event.target.value)} />
            </label>
            <label>
              Time
              <input type="time" value={form.interaction_time} onChange={(event) => update("interaction_time", event.target.value)} />
            </label>
          </div>
          <label>
            Attendees
            <input value={form.attendees} onChange={(event) => update("attendees", event.target.value)} placeholder="Enter names or search..." />
          </label>
        </details>
      </FormCard>

      <FormCard title="Discussion Summary" description="Capture the clinically relevant context from the HCP engagement.">
        <label>
          Topics Discussed
          <div className="textarea-with-icon">
            <textarea
              value={form.topics_discussed}
              onChange={(event) => update("topics_discussed", event.target.value)}
              placeholder="Enter key discussion points..."
            />
            <span aria-label="microphone" className="mic-icon">Mic</span>
          </div>
        </label>
        <button className="secondary-button" type="button" onClick={handleVoiceNote} disabled={listening || isLoading}>
          {listening ? "Listening..." : "Summarize from Voice Note (Requires Consent)"}
        </button>
      </FormCard>

      <FormCard title="Materials & Samples">
        <div className="inline-row">
          <label>
            Materials Shared
            <input value={form.materials_shared} onChange={(event) => update("materials_shared", event.target.value)} />
          </label>
          <button type="button">Search/Add</button>
        </div>
        <div className="inline-row">
          <label>
            Samples Distributed
            <input value={form.samples_distributed} onChange={(event) => update("samples_distributed", event.target.value)} />
          </label>
          <button type="button">Add Sample</button>
        </div>
      </FormCard>

      <FormCard title="Sentiment Analysis">
        <div className="sentiment-row">
          {["Positive", "Neutral", "Negative"].map((sentiment) => (
            <label key={sentiment} className={`sentiment-option ${sentiment.toLowerCase()} ${form.sentiment === sentiment ? "active" : ""}`}>
              <input type="radio" name="sentiment" checked={form.sentiment === sentiment} onChange={() => update("sentiment", sentiment)} />
              {sentiment}
            </label>
          ))}
        </div>
      </FormCard>

      <FormCard title="Outcomes">
        <label>
          Outcomes
          <textarea value={form.outcomes} onChange={(event) => update("outcomes", event.target.value)} placeholder="Key outcomes or agreements..." />
        </label>
      </FormCard>

      <FormCard title="Follow-Up Actions" description="Accept an AI suggestion or write the next step manually.">
        <label>
          Follow-up Actions
          <textarea value={form.followup_actions} onChange={(event) => update("followup_actions", event.target.value)} placeholder="Enter next steps or tasks..." />
        </label>
        <div className="suggestion-card-list">
          {(form.ai_suggested_followups || []).map((suggestion, index) => (
            <button className="followup-mini-card" type="button" key={suggestion} onClick={() => update("followup_actions", suggestion)}>
              <span>{index === 0 ? "High" : index === 1 ? "Medium" : "Low"} Priority</span>
              {suggestion}
            </button>
          ))}
        </div>
      </FormCard>

      <div className="form-actions">
        <div className="form-status">{form.saveError || (form.savedId ? `Saved ${form.savedId}. ${form.notificationStatus}` : "")}</div>
        <button type="button" onClick={() => dispatch(resetForm())}>Reset</button>
        <button className="save-button" type="button" onClick={handleSave} disabled={form.isSaving}>
          {form.isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </section>
  );
}

export default LogInteractionForm;
