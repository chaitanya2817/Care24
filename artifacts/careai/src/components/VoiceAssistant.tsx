import { useState, useEffect, useRef, useCallback } from "react";
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
  const [sessionId] = useState(() => crypto.randomUUID());

  // Use a ref for muted so the handleTranscript callback never has a stale value
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Use a ref to hold the latest speak function so handleTranscript never closes
  // over a stale version (voice is declared below, this ref bridges the gap)
  const speakRef = useRef<(text: string) => void>(() => {});

  const handleTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLastTranscript(text);
    setSending(true);
    try {
      const data = await apiCall<VoiceResponse>(
        "/voice/transcript",
        {
          method: "POST",
          body: JSON.stringify({ transcript: text, language, sessionId }),
        },
        accessToken ?? undefined
      );
      setAiResponse(data.aiResponse);
      setIntent(data.intent);
      showToast("Voice response received", "success");
      // Use the ref so we always call the current speak function
      if (!mutedRef.current) {
        speakRef.current(data.aiResponse);
      }
    } catch {
      showToast(t("toast.networkError"), "error");
    } finally {
      setSending(false);
    }
  }, [language, sessionId, accessToken, showToast, t]);

  const voice = useVoice(language, handleTranscript);

  // Keep speakRef in sync with the latest voice.speak
  useEffect(() => {
    speakRef.current = voice.speak;
  }, [voice.speak]);

  // Surface voice errors as toasts
  useEffect(() => {
    if (voice.error) showToast(voice.error, "warning");
  }, [voice.error, showToast]);

  const intentLabels: Record<string, string> = {
    general: "General Query",
    symptom_check: "Symptom Check",
    book_appointment: "Book Appointment",
    view_report: "View Report",
    emergency: "🚨 Emergency",
    medication_query: "Medication Query",
  };

  const examples = [
    t("voice.example1"),
    t("voice.example2"),
    t("voice.example3"),
  ];

  const handleMuteToggle = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      if (next) voice.stopSpeaking();
      return next;
    });
  }, [voice]);

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

            {/* ── Not supported banner ── */}
            {!voice.isSupported ? (
              <div style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                color: "var(--amber)",
                textAlign: "center",
                marginBottom: "1.5rem",
              }}>
                ⚠️ {t("voice.notSupported")}
                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.8 }}>
                  Please use Chrome, Edge, or Safari for voice features.
                </div>
              </div>
            ) : (
              <>
                {/* ── Main mic button area ── */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}>
                  {/* Animated ring + button */}
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {voice.isListening && (
                      <>
                        <span style={{
                          position: "absolute",
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          border: "2px solid var(--teal)",
                          animation: "pulse 1.2s ease-out infinite",
                          opacity: 0.6,
                        }} />
                        <span style={{
                          position: "absolute",
                          width: 140,
                          height: 140,
                          borderRadius: "50%",
                          border: "2px solid var(--teal)",
                          animation: "pulse 1.2s ease-out infinite 0.4s",
                          opacity: 0.3,
                        }} />
                      </>
                    )}
                    <button
                      className={`voice-btn${voice.isListening ? " active" : ""}`}
                      style={{
                        width: 100,
                        height: 100,
                        fontSize: "2.25rem",
                        transition: "all 0.2s ease",
                        transform: voice.isListening ? "scale(1.08)" : "scale(1)",
                        boxShadow: voice.isListening
                          ? "0 0 32px rgba(14,165,233,0.5)"
                          : "0 4px 20px rgba(0,0,0,0.3)",
                      }}
                      onClick={voice.toggleListening}
                      disabled={sending}
                      aria-label={voice.isListening ? t("voice.stopListening") : t("voice.startListening")}
                    >
                      {sending
                        ? <span style={{ fontSize: "1.5rem", display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                        : voice.isListening
                        ? "⏹"
                        : "🎤"}
                    </button>

                    {/* Speaking indicator badge */}
                    {voice.isSpeaking && !muted && (
                      <div style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        background: "var(--teal2)",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        boxShadow: "0 0 12px rgba(14,165,233,0.4)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}>
                        🔊
                      </div>
                    )}
                  </div>

                  {/* Status text */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: voice.isListening
                        ? "var(--teal)"
                        : sending
                        ? "var(--amber)"
                        : voice.isSpeaking && !muted
                        ? "var(--teal2)"
                        : "var(--text2)",
                    }}>
                      {voice.isListening
                        ? t("voice.listening")
                        : sending
                        ? t("voice.processing")
                        : voice.isSpeaking && !muted
                        ? "Speaking..."
                        : t("voice.tapToSpeak")}
                    </div>
                    {/* Live transcript */}
                    {voice.transcript && (
                      <div style={{
                        fontSize: "0.875rem",
                        color: "var(--text2)",
                        marginTop: "0.375rem",
                        fontStyle: "italic",
                        maxWidth: 480,
                        lineHeight: 1.5,
                      }}>
                        "{voice.transcript}"
                      </div>
                    )}
                  </div>

                  {/* Mute / Stop speaking */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      className="btn-outline"
                      style={{ padding: "0.375rem 1rem", fontSize: "0.8rem" }}
                      onClick={handleMuteToggle}
                    >
                      {muted ? "🔇 " + t("voice.unmute") : "🔊 " + t("voice.mute")}
                    </button>
                    {voice.isSpeaking && !muted && (
                      <button
                        className="btn-outline"
                        style={{ padding: "0.375rem 1rem", fontSize: "0.8rem", borderColor: "rgba(239,68,68,0.3)", color: "var(--risk-high)" }}
                        onClick={voice.stopSpeaking}
                      >
                        ⏹ Stop
                      </button>
                    )}
                  </div>
                </div>

                {/* ── AI Response panel ── */}
                {aiResponse && (
                  <div style={{
                    background: "rgba(14,165,233,0.07)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    marginBottom: "1.5rem",
                    animation: "fadeInUp 0.4s ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: 2 }}>🤖</span>
                      <div style={{ flex: 1 }}>
                        {intent && (
                          <span style={{
                            fontSize: "0.7rem",
                            color: "var(--teal)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            display: "block",
                            marginBottom: "0.35rem",
                          }}>
                            {intentLabels[intent] ?? intent}
                          </span>
                        )}
                        {lastTranscript && (
                          <div style={{
                            fontSize: "0.75rem",
                            color: "var(--text3)",
                            marginBottom: "0.5rem",
                            fontStyle: "italic",
                          }}>
                            You: "{lastTranscript}"
                          </div>
                        )}
                        <p style={{ margin: 0, color: "var(--text)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                          {aiResponse}
                        </p>
                        {/* Replay button */}
                        {!muted && (
                          <button
                            style={{
                              marginTop: "0.75rem",
                              background: "none",
                              border: "1px solid rgba(56,189,248,0.2)",
                              color: "var(--teal2)",
                              borderRadius: "0.5rem",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                            onClick={() => voice.speak(aiResponse)}
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Example commands ── */}
                <div>
                  <h4 style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.75rem",
                  }}>
                    {t("voice.commands")}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {examples.map((ex, i) => (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.625rem 0.875rem",
                          background: "rgba(15,23,42,0.5)",
                          borderRadius: "0.625rem",
                          border: "1px solid var(--border2)",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                        onClick={() => {
                          if (!voice.isListening && !sending) {
                            handleTranscript(ex);
                          }
                        }}
                        onKeyDown={e => e.key === "Enter" && !voice.isListening && !sending && handleTranscript(ex)}
                      >
                        <span style={{ fontSize: "0.875rem", flexShrink: 0 }}>🎙️</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic" }}>
                          "{ex}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
