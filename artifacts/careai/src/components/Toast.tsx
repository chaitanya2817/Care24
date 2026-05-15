import { useToastCtx } from "../contexts/ToastContext";

const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };

export function ToastContainer() {
  const { toasts, removeToast } = useToastCtx();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} data-testid={`toast-${t.id}`}>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>{icons[t.type]}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "1rem", padding: "0 0.25rem" }}
            aria-label="dismiss"
          >✕</button>
        </div>
      ))}
    </div>
  );
}
