import { useState, useRef, useEffect } from "react";
import { fetchChat } from "../api";

export default function ComplianceCopilot({ medicineName }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your Compliance Copilot. Ask me any regulatory or dispensing questions about **${medicineName}**.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);

  // Initialize Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN"; // Supports English + Hinglish well natively
  }

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    // Reset chat when medicine changes
    setMessages([
      {
        role: "assistant",
        content: `Hello! I'm your Compliance Copilot. Ask me any regulatory or dispensing questions about **${medicineName}**.`,
      },
    ]);
    setInput("");
  }, [medicineName]);

  const handleSend = async (textStr) => {
    const text = textStr || input;
    if (!text.trim() || loading) return;

    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetchChat(medicineName, text);
      setMessages([...newMsgs, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages([
        ...newMsgs,
        { role: "assistant", content: "⚠️ Error connecting to Copilot: " + e.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (!recognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => handleSend(transcript), 300);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  };

  return (
    <div className="card copilot-card">
      <div className="card-header">
        <h3>💬 Compliance Copilot</h3>
        <span className="badge badge-ai">Gemini AI</span>
      </div>

      <div className="chat-window" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.role === "assistant" && <span className="chat-avatar">🤖</span>}
            <div className="chat-text" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <span className="chat-avatar">🤖</span>
            <div className="chat-text typing">Thinking...</div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Ask e.g., Can I sell this without a prescription?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button 
          className={`mic-btn ${isListening ? "listening" : ""}`} 
          onClick={toggleMic}
          title="Voice Input (Hindi/English)"
        >
          {isListening ? "🎙️" : "🎤"}
        </button>
        <button className="send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}
