import { useLanguage } from "../contexts/LanguageContext";

interface HeroProps {
  onChatClick: () => void;
  onAssessClick: () => void;
}

export function Hero({ onChatClick, onAssessClick }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section className="hero-section gradient-bg" id="top" aria-label="Hero">
      {/* Grid overlay */}
      <div className="hero-grid-overlay" aria-hidden />

      {/* Orbs */}
      <div className="hero-orb" style={{ width: 500, height: 500, top: "-10%", left: "50%", transform: "translateX(-50%)", background: "rgba(56,189,248,0.06)" }} aria-hidden />
      <div className="hero-orb" style={{ width: 300, height: 300, bottom: "5%", right: "-5%", background: "rgba(99,102,241,0.07)" }} aria-hidden />
      <div className="hero-orb" style={{ width: 200, height: 200, top: "30%", left: "-5%", background: "rgba(168,85,247,0.05)" }} aria-hidden />

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          {/* Tag */}
          <div className="section-tag" style={{ margin: "0 auto 1.5rem" }}>
            <span>⚕️</span>
            <span>{t("hero.tag")}</span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "1.5rem",
          }}>
            <span className="gradient-text">{t("hero.title").split(".")[0]}.</span>
            <br />
            <span style={{ color: "var(--text)" }}>{t("hero.title").split(".")[1] || ""}</span>
          </h1>

          {/* Subtitle */}
          <p style={{ color: "var(--text2)", fontSize: "clamp(1rem, 2vw, 1.125rem)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 600, margin: "0 auto 2.5rem" }}>
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }} onClick={onChatClick} data-testid="btn-chat">
              <span>💬</span> {t("hero.chatBtn")}
            </button>
            <button className="btn-outline" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }} onClick={onAssessClick} data-testid="btn-assess">
              <span>📋</span> {t("hero.assessBtn")}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "4rem", flexWrap: "wrap" }}>
            {[
              { value: "94.7%", label: t("hero.triageAccuracy"), icon: "🎯" },
              { value: "< 2 min", label: t("hero.assessmentTime"), icon: "⚡" },
              { value: "50K+", label: t("hero.patientsTriaged"), icon: "👥" },
            ].map((stat) => (
              <div key={stat.label} className="glass" style={{ padding: "1.25rem 2rem", textAlign: "center", minWidth: 140 }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>{stat.icon}</div>
                <div className="stat-number gradient-text">{stat.value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text2)", marginTop: "0.25rem", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
