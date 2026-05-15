import { useLanguage } from "../contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer style={{ borderTop: "1px solid var(--border2)", background: "rgba(10,15,30,0.9)", padding: "3rem 1.5rem 2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏥</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.25rem", background: "linear-gradient(135deg, var(--teal), var(--blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                CareAI
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text2)", lineHeight: 1.6, maxWidth: 240 }}>
              {t("footer.tagline")}
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Features</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {["AI Symptom Triage", "Health Assessment", "Telemedicine", "Voice Assistant", "Health Analytics"].map(f => (
                <li key={f} style={{ fontSize: "0.8rem", color: "var(--text2)" }}>› {f}</li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Languages</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {["English", "हिंदी (Hindi)", "ಕನ್ನಡ (Kannada)"].map(l => (
                <li key={l} style={{ fontSize: "0.8rem", color: "var(--text2)" }}>🌐 {l}</li>
              ))}
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--risk-emergency)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Emergency</h4>
            <div style={{ display: "flex", flex: "column", gap: "0.5rem" }}>
              <a href="tel:112" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.625rem", padding: "0.625rem 0.875rem", textDecoration: "none", color: "var(--risk-high)", fontSize: "0.875rem", fontWeight: 600 }}>
                📞 112 — Emergency
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid var(--border2)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
            ⚠️ {t("footer.disclaimer")}
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[t("footer.privacyPolicy"), t("footer.terms")].map(link => (
              <a key={link} href="#" style={{ fontSize: "0.75rem", color: "var(--text3)", textDecoration: "none" }}>{link}</a>
            ))}
            <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>© 2025 CareAI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
