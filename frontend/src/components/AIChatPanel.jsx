import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { sendChatMessage } from "../hooks/api";
import { addMessage, setError, setLoading } from "../store/chatSlice";
import { populateFromAI, setSuggestions } from "../store/interactionSlice";

function AIChatPanel() {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state) => state.chat);
  const [message, setMessage] = useState("");

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
    } catch (error) {
      dispatch(setError("Could not connect to backend"));
      dispatch(addMessage({ role: "assistant", content: "Could not connect to backend" }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <section className="panel chat-panel">
      <header>
        <h2>AI Assistant</h2>
        <p>Log Interaction details here via chat</p>
      </header>

      <div className="chat-history">
        <div className="message system">
          Example: Today I met with Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochures.
        </div>
        {messages.map((item, index) => (
          <div className={`message ${item.role}`} key={`${item.role}-${index}`}>
            {item.content}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe interaction..." />
        <button type="button" onClick={handleSend}>
          Log
        </button>
      </div>
    </section>
  );
}

export default AIChatPanel;
