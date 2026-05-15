import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useToastCtx } from "../contexts/ToastContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const { showToast } = useToastCtx();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (mode === "signup" && !name.trim()) e["name"] = t("auth.nameRequired");
    if (!isValidEmail(email)) e["email"] = t("auth.invalidEmail");
    if (password.length < 6) e["password"] = t("auth.passwordTooShort");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        showToast(t("auth.welcomeBack"), "success");
      } else {
        await register(name, email, password);
        showToast(t("auth.accountCreated"), "success");
      }
      onClose();
    } catch (err) {
      const e = err as Error & { status?: number; data?: { error?: string } };
      if (e.status === 409) showToast(t("auth.emailExists"), "error");
      else if (e.status === 401) showToast(t("auth.loginError"), "error");
      else showToast(mode === "login" ? t("auth.loginError") : t("auth.signupError"), "error");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === "login" ? "signup" : "login");
    setErrors({});
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal aria-label="Auth">
      <div className="modal-content">
        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🏥</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, background: "linear-gradient(135deg, var(--teal), var(--blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CareAI</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
              {mode === "login" ? t("auth.login") : t("auth.signup")}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}
            aria-label="Close"
            data-testid="btn-close-modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                  {t("auth.name")}
                </label>
                <input
                  className="input-field"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                  placeholder={t("auth.namePlaceholder")}
                  autoComplete="name"
                  data-testid="input-name"
                />
                {errors["name"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["name"]}</span>}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                {t("auth.email")}
              </label>
              <input
                className="input-field" type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete={mode === "login" ? "email" : "new-email"}
                data-testid="input-email"
              />
              {errors["email"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["email"]}</span>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                {t("auth.password")}
              </label>
              <input
                className="input-field" type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                data-testid="input-password"
              />
              {errors["password"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["password"]}</span>}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.9375rem" }}
              disabled={loading}
              data-testid="btn-auth-submit"
            >
              {loading
                ? <><span className="animate-spin">⏳</span> {mode === "login" ? t("auth.loggingIn") : t("auth.signingUp")}</>
                : mode === "login" ? t("auth.loginBtn") : t("auth.signupBtn")
              }
            </button>

            <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text2)" }}>
              {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
              {" "}
              <button
                type="button"
                onClick={switchMode}
                style={{ background: "none", border: "none", color: "var(--teal)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", padding: 0 }}
                data-testid="btn-switch-mode"
              >
                {mode === "login" ? t("auth.signup") : t("auth.login")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
