import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useToastCtx } from "../contexts/ToastContext";
import { useVoice } from "../hooks/useVoice";
import { apiCall } from "../utils/api";

interface VoiceResponse {
  id: number;
  transcript: string;
  aiResponse: string;
  intent: string;
  language: string;
}

export function VoiceAssistant() {
  const { t, language } = useLanguage();
  const { accessToken } = useAuth();
  const { showToast } = useToastCtx();

  const [lastTranscript, setLastTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [intent, setIntent] = useState("");
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sessionId] = useState<string | null>(null);

  async function handleTranscript(text: string) {
    setLastTranscript(text);
    if (!text.trim()) return;
    setSending(true);
    try {
      const data = await apiCall<VoiceResponse>(
        "/voice/transcript",
        {
          method: "POST",
          body: JSON.stringify({ transcript: text, language, sessionId }),
        },
        accessToken
      );
      setAiResponse(data.aiResponse);
      setIntent(data.intent);
      showToast(t("toast.voiceSaved"), "success");
      if (!muted) {
        voice.speak(data.aiResponse);
      }
    } catch {
      showToast(t("toast.networkError"), "error");
    } finally {
      setSending(false);
    }
  }

  const voice = useVoice(language, handleTranscript);

  useEffect(() => {
    if (voice.error) showToast(voice.error, "warning");
  }, [voice.error, showToast]);

  const intentLabels: Record<string, string> = {
    general: "General Query",
    symptom_check: "Symptom Check",
    book_appointment: "Book Appointment",
    view_report: "View Report",
    emergency: "Emergency",
    medication_query: "Medication Query",
  };

  const examples = [t("voice.example1"), t("voice.example2"), t("voice.example3")];

  return (
    <section id="voice" aria-label="Voice Assistant">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">🎤 {t("voice.title")}</div>
          <h2 className="section-title">{t("voice.title")}</h2>
          <p className="section-subtitle">{t("voice.subtitle")}</p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            {/* Voice control */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
              {!voice.isSupported ? (
                <div style={{ color: "var(--amber)", textAlign: "center", padding: "1rem" }}>
                  ⚠️ {t("voice.notSupported")}
                </div>
              ) : (
                <>
                  {/* Main mic button */}
                  <div style={{ position: "relative" }}>
                    <button
                      className={`voice-btn${voice.isListening ? " active" : ""}`}
                      style={{ width: 100, height: 100, fontSize: "2.25rem" }}
                      onClick={voice.toggleListening}
                      disabled={sending}
                      aria-label={voice.isListening ? t("voice.stopListening") : t("voice.startListening")}
                      data-testid="btn-voice-main"
                    >
                      {sending ? <span className="animate-spin" style={{ fontSize: "1.5rem" }}>⏳</span> : voice.isListening ? "⏹" : "🎤"}
                    </button>
                    {voice.isSpeaking && (
                      <div style={{ position: "absolute", bottom: -8, right: -8, background: "var(--teal2)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                        🔊
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: voice.isListening ? "var(--teal)" : "var(--text2)" }}>
                      {voice.isListening ? t("voice.listening") : sending ? t("voice.processing") : t("voice.tapToSpeak")}
                    </div>
                    {voice.transcript && (
                      <div style={{ fontSize: "0.875rem", color: "var(--text2)", marginTop: "0.375rem", fontStyle: "italic" }}>
                        "{voice.transcript}"
                      </div>
                    )}
                  </div>

                  {/* Mute toggle */}
                  <button
                    className="btn-outline"
                    style={{ padding: "0.375rem 1rem", fontSize: "0.8rem" }}
                    onClick={() => { setMuted(!muted); if (!muted) voice.stopSpeaking(); }}
                    data-testid="btn-mute"
                  >
                    {muted ? "🔇 " + t("voice.unmute") : "🔊 " + t("voice.mute")}
                  </button>
                </>
              )}
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem", animation: "fadeInUp 0.4s ease" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🤖</span>
                  <div>
                    {intent && (
                      <span style={{ fontSize: "0.7rem", color: "var(--teal)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem" }}>
                        {intentLabels[intent] ?? intent}
                      </span>
                    )}
                    <p style={{ margin: 0, color: "var(--text)", fontSize: "0.875rem", lineHeight: 1.6 }}>{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Example commands */}
            <div>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                {t("voice.commands")}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {examples.map((ex, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", background: "rgba(15,23,42,0.5)", borderRadius: "0.625rem", border: "1px solid var(--border2)", cursor: "pointer" }}
                    onClick={() => { if (voice.isSupported && !voice.isListening) handleTranscript(ex); }}
                    data-testid={`voice-example-${i}`}
                  >
                    <span style={{ fontSize: "0.875rem" }}>🎙️</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic" }}>"{ex}"</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
