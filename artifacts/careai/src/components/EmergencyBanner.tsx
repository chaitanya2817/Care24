import { useLanguage } from "../contexts/LanguageContext";

interface EmergencyBannerProps {
  onDismiss: () => void;
}

export function EmergencyBanner({ onDismiss }: EmergencyBannerProps) {
  const { t } = useLanguage();
  return (
    <div style={{ position: "fixed", top: 72, left: 0, right: 0, zIndex: 150, padding: "0 1.5rem" }}>
      <div className="emergency-banner" style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>{t("emergency.alert")}</div>
            <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>{t("emergency.message")}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
          <a href="tel:112">
            <button className="btn-emergency" style={{ animation: "pulse-emergency 1s infinite", padding: "0.625rem 1.25rem", fontSize: "0.875rem" }} data-testid="btn-call-112">
              📞 {t("emergency.call112")}
            </button>
          </a>
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}
            data-testid="btn-dismiss-emergency"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
