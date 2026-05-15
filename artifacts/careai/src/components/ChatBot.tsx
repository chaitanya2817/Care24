import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useToastCtx } from "../contexts/ToastContext";
import { useVoice } from "../hooks/useVoice";
import { apiCall } from "../utils/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  riskLevel?: string;
  emergencyDetected?: boolean;
}

interface ChatResponse {
  message: string;
  riskScore: number;
  riskLevel: string;
  intent: string;
  sessionId: string;
  emergencyDetected: boolean;
  recommendations: string[];
}

interface ChatBotProps {
  sessionId: string | null;
  onSessionId: (id: string) => void;
  onEmergency: () => void;
}

export function ChatBot({ sessionId, onSessionId, onEmergency }: ChatBotProps) {
  const { t, language } = useLanguage();
  const { accessToken } = useAuth();
  const { showToast } = useToastCtx();

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: t("chat.welcome") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<string | null>(sessionId);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const { isListening, isSupported, toggleListening, error: voiceError } = useVoice(language, handleVoiceTranscript);

  useEffect(() => {
    if (voiceError) showToast(voiceError, "warning");
  }, [voiceError, showToast]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await apiCall<ChatResponse>(
        "/chat/message",
        {
          method: "POST",
          body: JSON.stringify({ message: msg, language, sessionId: sessionRef.current }),
        },
        accessToken
      );

      if (data.sessionId) {
        sessionRef.current = data.sessionId;
        onSessionId(data.sessionId);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        riskLevel: data.riskLevel,
        emergencyDetected: data.emergencyDetected,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.emergencyDetected) onEmergency();
    } catch {
      showToast(t("toast.networkError"), "error");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function clearHistory() {
    setMessages([{ id: "welcome", role: "assistant", content: t("chat.welcome") }]);
  }

  const riskColors: Record<string, string> = {
    low: "var(--risk-low)", moderate: "var(--risk-moderate)", high: "var(--risk-high)", emergency: "var(--risk-emergency)",
  };

  return (
    <section id="chat" aria-label="AI Symptom Chat">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">💬 {t("nav.symptomChat")}</div>
          <h2 className="section-title">{t("chat.title")}</h2>
          <p className="section-subtitle">{t("chat.subtitle")}</p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span style={{ fontSize: "1.25rem" }} className="animate-heartbeat">🤖</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>CareAI Assistant</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--green)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                    Online
                  </div>
                </div>
              </div>
              <button className="btn-outline" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }} onClick={clearHistory} data-testid="btn-clear-chat">
                {t("chat.clearHistory")}
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages" data-testid="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                  {msg.riskLevel && msg.riskLevel !== "low" && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <span
                        className={`risk-badge risk-badge-${msg.riskLevel}`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {msg.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble assistant">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["I have a fever", "Chest pain", "Headache and nausea"].map(prompt => (
                <button
                  key={prompt}
                  className="symptom-tag"
                  onClick={() => sendMessage(prompt)}
                  data-testid={`quick-prompt-${prompt.replace(/\s+/g,"-")}`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {isSupported && (
                <button
                  className={`voice-btn${isListening ? " active" : ""}`}
                  style={{ width: 40, height: 40, fontSize: "1rem", flexShrink: 0 }}
                  onClick={toggleListening}
                  aria-label={isListening ? t("voice.stopListening") : t("voice.startListening")}
                  data-testid="btn-voice-chat"
                >
                  {isListening ? "⏹" : "🎤"}
                </button>
              )}
              <input
                ref={inputRef}
                className="input-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                disabled={loading}
                aria-label="Chat input"
                data-testid="input-chat"
              />
              <button
                className="btn-primary"
                style={{ flexShrink: 0, padding: "0.625rem 1.25rem" }}
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                data-testid="btn-send-chat"
              >
                {loading ? <span className="animate-spin">⏳</span> : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
