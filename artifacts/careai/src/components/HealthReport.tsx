import { useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useToastCtx } from "../contexts/ToastContext";
import type { ReportResult } from "./Assessment";

const RISK_CFG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  low:      { color: "var(--risk-low)",       bg: "rgba(34,197,94,0.1)",  icon: "✅", label: "LOW" },
  moderate: { color: "var(--risk-moderate)",  bg: "rgba(245,158,11,0.1)", icon: "⚠️", label: "MODERATE" },
  high:     { color: "var(--risk-high)",      bg: "rgba(239,68,68,0.1)",  icon: "🔴", label: "HIGH" },
  emergency:{ color: "var(--risk-emergency)", bg: "rgba(220,38,38,0.15)", icon: "🚨", label: "EMERGENCY" },
};

export function HealthReport({ report }: { report: ReportResult }) {
  const { t } = useLanguage();
  const { showToast } = useToastCtx();
  const reportRef = useRef<HTMLDivElement>(null);

  const cfg = RISK_CFG[report.assessment.riskLevel] ?? RISK_CFG["low"];
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" });

  function handlePrint() { window.print(); }

  function handleShare() {
    const text = `CareAI Health Report — ${report.assessment.patientName ?? "Patient"}\nRisk: ${cfg.label}\nScore: ${report.assessment.riskScore}/100\n${report.summary}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast(t("toast.copied"), "success"));
    }
  }

  return (
    <div className="report-card animate-fade-in" ref={reportRef} style={{ marginTop: "1.5rem" }} data-testid="health-report">
      {/* Header */}
      <div className="report-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏥</span>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}>CareAI</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text3)" }}>{t("report.aiGenerated")}</div>
              </div>
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{t("report.title")}</h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", marginTop: "0.25rem" }}>Generated: {dateStr}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn-outline" style={{ padding: "0.375rem 0.875rem", fontSize: "0.75rem" }} onClick={handleShare} data-testid="btn-share-report">
              📋 {t("report.share")}
            </button>
            <button className="btn-outline" style={{ padding: "0.375rem 0.875rem", fontSize: "0.75rem" }} onClick={handlePrint} data-testid="btn-print-report">
              🖨️ {t("report.print")}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Patient info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: t("report.patient"), value: report.assessment.patientName ?? "—" },
            { label: t("report.ageGender"), value: `${report.assessment.age}y / ${report.assessment.gender}` },
            { label: t("report.primarySymptom"), value: report.assessment.symptoms[0] ?? "—" },
            { label: t("report.painLevel"), value: `${report.assessment.painLevel}/10` },
          ].map(row => (
            <div key={row.label} style={{ background: "rgba(10,15,30,0.5)", borderRadius: "0.75rem", padding: "0.875rem" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{row.value}</div>
            </div>
          ))}
        </div>

        {/* Risk */}
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{cfg.icon}</span>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("report.aiRiskAssessment")}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem", fontWeight: 800, color: cfg.color }}>
                {cfg.label} RISK — {report.assessment.riskScore}/100
              </div>
            </div>
          </div>
          {/* Score bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${report.assessment.riskScore}%`, background: `linear-gradient(90deg, var(--green), ${cfg.color})` }} />
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--teal)" }}>Clinical Summary</h4>
          <p style={{ color: "var(--text2)", fontSize: "0.875rem", lineHeight: 1.7 }}>{report.summary}</p>
        </div>

        {/* Diagnosis */}
        {report.diagnosis && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--indigo)" }}>AI Diagnostic Notes</h4>
            <p style={{ color: "var(--text2)", fontSize: "0.875rem", lineHeight: 1.7 }}>{report.diagnosis}</p>
          </div>
        )}

        {/* Recommendations */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--teal)" }}>{t("report.aiRecommendations")}</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {report.recommendations.map((rec, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text2)" }}>
                <span style={{ color: cfg.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "0.75rem", padding: "0.875rem 1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text3)", margin: 0, lineHeight: 1.6 }}>
            ⚠️ {t("report.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
