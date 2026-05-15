import { useLanguage } from "../contexts/LanguageContext";

interface RiskDashboardProps {
  riskScore: number;
  riskLevel: "low" | "moderate" | "high" | "emergency";
  recommendations: string[];
  patientName?: string;
  symptoms: string[];
  age: number;
  gender: string;
  painLevel: number;
  onGenerateReport: () => void;
  isGenerating: boolean;
}

const RISK_CONFIG = {
  low:       { color: "var(--risk-low)",       bg: "rgba(34,197,94,0.1)",   stroke: "#22c55e", label: "LOW",       icon: "✅", care: "Home Care" },
  moderate:  { color: "var(--risk-moderate)",  bg: "rgba(245,158,11,0.1)",  stroke: "#f59e0b", label: "MODERATE",  icon: "⚠️", care: "Clinic Visit" },
  high:      { color: "var(--risk-high)",      bg: "rgba(239,68,68,0.1)",   stroke: "#ef4444", label: "HIGH",      icon: "🔴", care: "Urgent Care" },
  emergency: { color: "var(--risk-emergency)", bg: "rgba(220,38,38,0.15)",  stroke: "#dc2626", label: "EMERGENCY", icon: "🚨", care: "Emergency Room" },
};

function RiskGauge({ score, level }: { score: number; level: keyof typeof RISK_CONFIG }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cfg = RISK_CONFIG[level];

  return (
    <div className="risk-ring" style={{ width: 150, height: 150, position: "relative" }}>
      <svg width={150} height={150} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={75} cy={75} r={r} fill="none" stroke="rgba(99,179,237,0.1)" strokeWidth={10} />
        <circle
          cx={75} cy={75} r={r} fill="none"
          stroke={cfg.stroke} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.9rem" }}>{cfg.icon}</span>
        <span style={{ fontSize: "1.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.65rem", color: "var(--text2)", marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

export function RiskDashboard({ riskScore, riskLevel, recommendations, patientName, symptoms, age, gender, painLevel, onGenerateReport, isGenerating }: RiskDashboardProps) {
  const { t } = useLanguage();
  const cfg = RISK_CONFIG[riskLevel];

  return (
    <div className="glass-card animate-fade-in" style={{ padding: "1.75rem", marginTop: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Gauge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <RiskGauge score={riskScore} level={riskLevel} />
          <span className={`risk-badge risk-badge-${riskLevel}`}>{cfg.label}</span>
          <div style={{ fontSize: "0.75rem", color: "var(--text2)", textAlign: "center" }}>{t("risk.riskScore")}</div>
        </div>

        {/* Details */}
        <div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
            {t("risk.title")}
          </h3>

          {/* Patient info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { label: "Patient", value: patientName || "—" },
              { label: "Age / Gender", value: `${age}y / ${gender}` },
              { label: "Symptoms", value: symptoms.slice(0, 3).join(", ") + (symptoms.length > 3 ? "…" : "") },
              { label: "Pain Level", value: `${painLevel}/10` },
            ].map(row => (
              <div key={row.label} style={{ background: "rgba(10,15,30,0.5)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.125rem" }}>{row.label}</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Care recommendation */}
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.stroke}30`, borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.25rem" }}>{cfg.icon}</span>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text2)" }}>{t("risk.careRecommendation")}</div>
              <div style={{ fontWeight: 700, color: cfg.color }}>{cfg.care}</div>
            </div>
          </div>

          <button className="btn-primary" onClick={onGenerateReport} disabled={isGenerating} data-testid="btn-generate-report" style={{ width: "100%" }}>
            {isGenerating ? <><span className="animate-spin">⏳</span> Generating…</> : "📄 Generate Health Report"}
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>{t("recommendations.title")}</h4>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {recommendations.map((rec, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text2)" }}>
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: "0.1rem" }}>›</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
