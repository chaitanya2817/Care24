import { useState, useCallback } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/Toast";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ChatBot } from "./components/ChatBot";
import { Assessment } from "./components/Assessment";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { Analytics } from "./components/Analytics";
import { Telemedicine } from "./components/Telemedicine";
import { Wearables } from "./components/Wearables";
import { AuthModal } from "./components/AuthModal";
import { EmergencyBanner } from "./components/EmergencyBanner";
import { Footer } from "./components/Footer";
import type { AssessmentResult } from "./components/Assessment";

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [lastAssessmentId, setLastAssessmentId] = useState<number | undefined>(undefined);

  const scrollToSection = useCallback((id: string) => {
    if (id === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function handleAssessmentComplete(result: AssessmentResult) {
    setLastAssessmentId(result.id);
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <div id="top" style={{ background: "var(--bg)", minHeight: "100vh" }}>
            <Navbar
              onLoginClick={() => setAuthOpen(true)}
              onSectionClick={scrollToSection}
            />

            {emergencyVisible && (
              <EmergencyBanner onDismiss={() => setEmergencyVisible(false)} />
            )}

            <main style={{ paddingTop: 0 }}>
              <Hero
                onChatClick={() => scrollToSection("chat")}
                onAssessClick={() => scrollToSection("assessment")}
              />

              <ChatBot
                sessionId={sessionId}
                onSessionId={setSessionId}
                onEmergency={() => setEmergencyVisible(true)}
              />

              <Assessment
                sessionId={sessionId}
                onSessionId={setSessionId}
                onAssessmentComplete={handleAssessmentComplete}
              />

              <VoiceAssistant />

              <Analytics
                sessionId={sessionId}
                lastAssessmentId={lastAssessmentId}
              />

              <Telemedicine sessionId={sessionId} />

              <Wearables />
            </main>

            <Footer />

            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
