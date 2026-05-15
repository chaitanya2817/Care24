import { useState, useEffect } from "react";
import { useLanguage, type Language } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

interface NavbarProps {
  onLoginClick: () => void;
  onSectionClick: (id: string) => void;
}

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "kn", label: "ಕ" },
];

export function Navbar({ onLoginClick, onSectionClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { key: "nav.symptomChat", id: "chat" },
    { key: "nav.assessment", id: "assessment" },
    { key: "nav.analytics", id: "analytics" },
    { key: "nav.doctors", id: "telemedicine" },
    { key: "nav.wearables", id: "wearables" },
  ];

  function scrollTo(id: string) {
    onSectionClick(id);
    setMobileOpen(false);
  }

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`} role="navigation" aria-label="main navigation">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <button
            className="nav-link"
            onClick={() => scrollTo("top")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: 0, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.25rem" }}
            data-testid="nav-logo"
          >
            <span style={{ fontSize: "1.5rem" }}>🏥</span>
            <span style={{ background: "linear-gradient(135deg, var(--teal), var(--blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              CareAI
            </span>
          </button>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="hidden md:flex">
            {navItems.map(item => (
              <button key={item.id} className="nav-link" onClick={() => scrollTo(item.id)} data-testid={`nav-${item.id}`}>
                {t(item.key)}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Language switcher */}
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {LANGS.map(l => (
                <button
                  key={l.code}
                  className={`lang-btn${language === l.code ? " active" : ""}`}
                  onClick={() => setLanguage(l.code)}
                  aria-label={`Switch to ${l.code}`}
                  data-testid={`lang-${l.code}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--text2)", fontSize: "0.8rem" }}>👤 {user?.name?.split(" ")[0]}</span>
                <button className="btn-outline" style={{ padding: "0.375rem 0.875rem", fontSize: "0.75rem" }} onClick={logout} data-testid="btn-logout">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <button className="btn-primary" style={{ padding: "0.375rem 1rem", fontSize: "0.8rem" }} onClick={onLoginClick} data-testid="btn-login">
                {t("nav.login")}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ borderTop: "1px solid var(--border-color)", padding: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navItems.map(item => (
              <button key={item.id} className="nav-link" onClick={() => scrollTo(item.id)} style={{ textAlign: "left" }}>
                {t(item.key)}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
