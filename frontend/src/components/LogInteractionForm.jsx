import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { saveInteraction, sendChatMessage, trackActivity } from "../hooks/api";
import { addMessage, setError, setLoading } from "../store/chatSlice";
import { populateFromAI, resetForm, setField, setSavedId, setSaveError, setSaving, setSuggestions } from "../store/interactionSlice";

function LogInteractionForm() {
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
    } catch (error) {
      dispatch(setSaveError("Could not save interaction"));
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
        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
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
      <h1>Log HCP Interaction</h1>
      <div className="section-title">Interaction Details</div>

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

      <label>
        Topics Discussed
        <div className="textarea-with-icon">
          <textarea
            value={form.topics_discussed}
            onChange={(event) => update("topics_discussed", event.target.value)}
            placeholder="Enter key discussion points..."
          />
          <span aria-label="mic" className="mic-icon">
            🎙️
          </span>
        </div>
      </label>

      <button className="secondary-button" type="button" onClick={handleVoiceNote} disabled={listening || isLoading}>
        Summarize from Voice Note (Requires Consent)
      </button>

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

      <div className="field-label">Observed/Inferred HCP Sentiment</div>
      <div className="sentiment-row">
        <label className={`sentiment-option positive ${form.sentiment === "Positive" ? "active" : ""}`}>
          <input type="radio" name="sentiment" checked={form.sentiment === "Positive"} onChange={() => update("sentiment", "Positive")} />
          😊 Positive
        </label>
        <label className={`sentiment-option neutral ${form.sentiment === "Neutral" ? "active" : ""}`}>
          <input type="radio" name="sentiment" checked={form.sentiment === "Neutral"} onChange={() => update("sentiment", "Neutral")} />
          😐 Neutral
        </label>
        <label className={`sentiment-option negative ${form.sentiment === "Negative" ? "active" : ""}`}>
          <input type="radio" name="sentiment" checked={form.sentiment === "Negative"} onChange={() => update("sentiment", "Negative")} />
          😟 Negative
        </label>
      </div>

      <label>
        Outcomes
        <textarea value={form.outcomes} onChange={(event) => update("outcomes", event.target.value)} placeholder="Key outcomes or agreements..." />
      </label>

      <label>
        Follow-up Actions
        <textarea value={form.followup_actions} onChange={(event) => update("followup_actions", event.target.value)} placeholder="Enter next steps or tasks..." />
      </label>

      <div className="suggestions">
        <div className="section-title">AI Suggested Follow-ups</div>
        <ul>
          {(form.ai_suggested_followups || []).map((suggestion) => (
            <li key={suggestion}>
              <button type="button" onClick={() => update("followup_actions", suggestion)}>
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="form-actions">
        <div className="form-status">{form.saveError || (form.savedId ? `Saved ${form.savedId}` : "")}</div>
        <button type="button" onClick={() => dispatch(resetForm())}>
          Reset
        </button>
        <button className="save-button" type="button" onClick={handleSave} disabled={form.isSaving}>
          Save
        </button>
      </div>
    </section>
  );
}

export default LogInteractionForm;
