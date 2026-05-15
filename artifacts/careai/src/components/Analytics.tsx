import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { apiCall } from "../utils/api";

interface AnalyticsSummary {
  totalAssessments: number;
  avgRiskScore: number;
  riskDistribution: { low: number; moderate: number; high: number; emergency: number };
  recentAssessments: AssessmentRow[];
  symptomTrend: { date: string; count: number }[];
}

interface AssessmentRow {
  id: number;
  riskScore: number;
  riskLevel: string;
  symptoms: string[];
  age: number;
  gender: string;
  patientName?: string;
  createdAt: string;
}

interface BarChartProps {
  data: { label: string; value: number; max: number; color: string }[];
}

function BarChart({ data }: BarChartProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      {data.map(d => (
        <div key={d.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text2)", marginBottom: "0.25rem" }}>
            <span>{d.label}</span>
            <span style={{ color: d.color }}>{d.value}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: d.max ? `${(d.value / d.max) * 100}%` : "0%", background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: "0.875rem" }}>No data yet</div>;

  const max = Math.max(...data.map(d => d.count), 1);
  const w = 100 / (data.length - 1 || 1);
  const points = data.map((d, i) => `${i * w},${100 - (d.count / max) * 80}`).join(" ");

  return (
    <div style={{ height: 100, position: "relative" }}>
      <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ width: "100%", height: 80 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--teal2)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        {data.length > 1 && (
          <polyline
            points={points}
            fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {data.map((d, i) => (
          <circle key={i} cx={i * w} cy={100 - (d.count / max) * 80} r="3" fill="var(--teal)" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--text3)" }}>
        {data.map((d, i) => (
          <span key={i}>{new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
        ))}
      </div>
    </div>
  );
}

function RiskDonut({ dist }: { dist: AnalyticsSummary["riskDistribution"] }) {
  const total = dist.low + dist.moderate + dist.high + dist.emergency || 1;
  const segments = [
    { key: "low",      color: "var(--risk-low)",       label: "Low" },
    { key: "moderate", color: "var(--risk-moderate)",  label: "Moderate" },
    { key: "high",     color: "var(--risk-high)",       label: "High" },
    { key: "emergency",color: "var(--risk-emergency)", label: "Emergency" },
  ] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
      <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
        {(() => {
          let offset = 25;
          return segments.map(seg => {
            const val = dist[seg.key];
            const pct = (val / total) * 100;
            const el = (
              <circle
                key={seg.key} cx={18} cy={18} r={15.9}
                fill="none" stroke={seg.color} strokeWidth={3.8}
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
                opacity={pct > 0 ? 1 : 0.1}
              />
            );
            offset -= pct;
            return el;
          });
        })()}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {segments.map(seg => (
          <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: "var(--text2)" }}>{seg.label}:</span>
            <span style={{ color: seg.color, fontWeight: 700 }}>{dist[seg.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AnalyticsProps {
  sessionId: string | null;
  lastAssessmentId?: number;
}

export function Analytics({ sessionId, lastAssessmentId }: AnalyticsProps) {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSummary() {
    setLoading(true);
    try {
      const params = sessionId ? `?sessionId=${sessionId}` : "";
      const data = await apiCall<AnalyticsSummary>(`/analytics/summary${params}`, {}, accessToken);
      setSummary(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSummary(); }, [sessionId, lastAssessmentId, accessToken]);

  const vitals = [
    { icon: "❤️", label: t("wearables.heartRate"), value: 72, unit: "bpm", color: "var(--clr-red)", pulse: true },
    { icon: "🫀", label: t("wearables.spo2"), value: 98, unit: "%", color: "var(--teal)", pulse: false },
    { icon: "🏃", label: t("wearables.steps"), value: 8432, unit: "", color: "var(--green)", pulse: false },
    { icon: "🌡️", label: t("wearables.temperature"), value: 36.6, unit: "°C", color: "var(--amber)", pulse: false },
  ];

  return (
    <section id="analytics" aria-label="Health Analytics">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">📊 {t("nav.analytics")}</div>
          <h2 className="section-title">{t("analytics.title")}</h2>
          <p className="section-subtitle">{t("analytics.subtitle")}</p>
        </div>

        {/* Vital stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {vitals.map(v => (
            <div key={v.label} className="vital-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.25rem" }} className={v.pulse ? "animate-heartbeat" : ""}>{v.icon}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{v.label}</span>
              </div>
              <div className="vital-value" style={{ color: v.color }}>
                {v.value}<span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text2)" }}>{v.unit}</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--green)" }}>● {t("wearables.connected")}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text2)" }}>
            <span className="animate-spin" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>⏳</span>
            Loading analytics…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Summary stats */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--teal)" }}>Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: t("analytics.totalAssessments"), value: summary?.totalAssessments ?? 0, icon: "📋" },
                  { label: "Avg Risk Score", value: summary ? `${summary.avgRiskScore}/100` : "—", icon: "📊" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(10,15,30,0.6)", borderRadius: "0.75rem", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>{s.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text2)", marginTop: "0.125rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text3)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Distribution</h4>
              {summary ? <RiskDonut dist={summary.riskDistribution} /> : <div style={{ color: "var(--text3)", fontSize: "0.875rem" }}>No assessments yet</div>}
            </div>

            {/* Trend */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--teal)" }}>{t("analytics.symptomHistory")}</h3>
              {summary ? <MiniLineChart data={summary.symptomTrend} /> : <div style={{ color: "var(--text3)", fontSize: "0.875rem" }}>No trend data</div>}

              {summary && summary.riskDistribution && (
                <>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text3)", margin: "1.25rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Breakdown</h4>
                  <BarChart data={[
                    { label: "Low", value: summary.riskDistribution.low, max: summary.totalAssessments || 1, color: "var(--risk-low)" },
                    { label: "Moderate", value: summary.riskDistribution.moderate, max: summary.totalAssessments || 1, color: "var(--risk-moderate)" },
                    { label: "High", value: summary.riskDistribution.high, max: summary.totalAssessments || 1, color: "var(--risk-high)" },
                    { label: "Emergency", value: summary.riskDistribution.emergency, max: summary.totalAssessments || 1, color: "var(--risk-emergency)" },
                  ]} />
                </>
              )}
            </div>

            {/* Recent assessments table */}
            {summary && summary.recentAssessments.length > 0 && (
              <div className="glass-card" style={{ padding: "1.5rem", gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--teal)" }}>{t("analytics.recentAssessments")}</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border2)" }}>
                        {[t("analytics.date"), t("analytics.symptom"), t("analytics.riskScore"), t("analytics.level")].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text3)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentAssessments.map(a => (
                        <tr key={a.id} style={{ borderBottom: "1px solid var(--border2)" }} data-testid={`assessment-row-${a.id}`}>
                          <td style={{ padding: "0.625rem 0.75rem", color: "var(--text2)" }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                          <td style={{ padding: "0.625rem 0.75rem", color: "var(--text)" }}>{Array.isArray(a.symptoms) ? a.symptoms.slice(0, 2).join(", ") : "—"}</td>
                          <td style={{ padding: "0.625rem 0.75rem", color: "var(--teal)", fontWeight: 700 }}>{a.riskScore}</td>
                          <td style={{ padding: "0.625rem 0.75rem" }}>
                            <span className={`risk-badge risk-badge-${a.riskLevel}`}>{a.riskLevel.toUpperCase()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <hr className="section-divider" />
    </section>
  );
}
