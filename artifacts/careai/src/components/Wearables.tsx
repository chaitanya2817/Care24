import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

function useLiveVital(base: number, variance: number, interval = 2000) {
  const [value, setValue] = useState(base);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setValue(base + (Math.random() - 0.5) * variance * 2);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [base, variance, interval]);
  return value;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${i * w},${40 - ((v - min) / range) * 35}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" style={{ width: "100%", height: 40 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * w} cy={40 - ((data[data.length - 1] - min) / range) * 35} r="3" fill={color} />
    </svg>
  );
}

export function Wearables() {
  const { t } = useLanguage();

  const hr = useLiveVital(72, 5, 1800);
  const spo2 = useLiveVital(98, 1.5, 3000);
  const steps = useLiveVital(8432, 50, 5000);
  const temp = useLiveVital(36.6, 0.3, 4000);
  const bp = useLiveVital(120, 4, 2500);

  const [hrHistory] = useState(() => Array.from({ length: 12 }, () => 72 + (Math.random() - 0.5) * 10));
  const [spo2History] = useState(() => Array.from({ length: 12 }, () => 98 + (Math.random() - 0.5) * 3));

  const vitals = [
    { key: "heartRate",    icon: "❤️",  label: t("wearables.heartRate"),  value: Math.round(hr),    unit: "bpm",  color: "#ef4444", normal: hr >= 60 && hr <= 100, history: hrHistory },
    { key: "spo2",         icon: "🫀",  label: t("wearables.spo2"),       value: spo2.toFixed(1),   unit: "%",    color: "#38bdf8", normal: parseFloat(spo2.toFixed(1)) >= 95, history: spo2History },
    { key: "steps",        icon: "🏃",  label: t("wearables.steps"),      value: Math.round(steps), unit: "steps",color: "#22c55e", normal: true, history: null },
    { key: "temperature",  icon: "🌡️", label: t("wearables.temperature"),value: temp.toFixed(1),   unit: "°C",   color: "#f59e0b", normal: parseFloat(temp.toFixed(1)) >= 36 && parseFloat(temp.toFixed(1)) <= 37.5, history: null },
    { key: "bloodPressure",icon: "💉",  label: "Blood Pressure",          value: `${Math.round(bp)}/${Math.round(bp * 0.65)}`, unit: "mmHg", color: "#818cf8", normal: true, history: null },
  ];

  const devices = [
    { name: "Apple Watch Series 9", status: "connected", battery: 87, icon: "⌚" },
    { name: "Garmin HRM Pro",       status: "connected", battery: 64, icon: "📡" },
    { name: "Withings BP Monitor",  status: "syncing",   battery: 91, icon: "🩺" },
  ];

  return (
    <section id="wearables" aria-label="Health Wearables">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">⌚ {t("wearables.title")}</div>
          <h2 className="section-title">{t("wearables.title")}</h2>
          <p className="section-subtitle">{t("wearables.subtitle")}</p>
        </div>

        {/* Live vitals */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {vitals.map(v => (
            <div key={v.key} className="vital-card" data-testid={`vital-${v.key}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>{v.icon}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{v.label}</span>
                </div>
                <span style={{ fontSize: "0.65rem", marginLeft: "auto", padding: "0.15rem 0.5rem", borderRadius: "2rem", background: v.normal ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: v.normal ? "var(--green)" : "var(--risk-high)", border: `1px solid ${v.normal ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  {v.normal ? "Normal" : "⚠ Check"}
                </span>
              </div>
              <div className="vital-value" style={{ color: v.color }}>
                {v.value}<span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text2)" }}> {v.unit}</span>
              </div>
              {v.history && (
                <div style={{ marginTop: "0.25rem" }}>
                  <MiniSparkline data={v.history} color={v.color} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Connected devices */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--teal)" }}>Connected Devices</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {devices.map(dev => (
              <div key={dev.name} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: "rgba(10,15,30,0.5)", borderRadius: "0.75rem", border: "1px solid var(--border2)" }}>
                <span style={{ fontSize: "1.25rem" }}>{dev.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{dev.name}</div>
                  <div style={{ fontSize: "0.7rem", color: dev.status === "connected" ? "var(--green)" : "var(--amber)" }}>
                    {dev.status === "connected" ? "● " + t("wearables.connected") : "⟳ " + t("wearables.syncing")}
                  </div>
                </div>
                {/* Battery */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text2)" }}>
                  <span>🔋</span>
                  <span>{dev.battery}%</span>
                  <div style={{ width: 32, height: 8, borderRadius: 4, background: "rgba(99,179,237,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${dev.battery}%`, borderRadius: 4, background: dev.battery > 50 ? "var(--green)" : dev.battery > 20 ? "var(--amber)" : "var(--risk-high)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
