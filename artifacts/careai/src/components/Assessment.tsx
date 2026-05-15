import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useToastCtx } from "../contexts/ToastContext";
import { apiCall } from "../utils/api";
import { RiskDashboard } from "./RiskDashboard";
import { HealthReport } from "./HealthReport";

const SYMPTOM_LIST = [
  "fever","headache","cough","soreThroat","chestPain","shortnessOfBreath",
  "nausea","vomiting","diarrhea","fatigue","dizziness","backPain",
  "abdominalPain","rash","swelling","weakness",
];

const SYMPTOM_KEYS: Record<string, string> = {
  fever:"Fever",headache:"Headache",cough:"Cough",soreThroat:"Sore Throat",
  chestPain:"Chest Pain",shortnessOfBreath:"Shortness of Breath",nausea:"Nausea",
  vomiting:"Vomiting",diarrhea:"Diarrhea",fatigue:"Fatigue",dizziness:"Dizziness",
  backPain:"Back Pain",abdominalPain:"Abdominal Pain",rash:"Rash",swelling:"Swelling",weakness:"Weakness",
};

export interface AssessmentResult {
  id: number;
  riskScore: number;
  riskLevel: "low" | "moderate" | "high" | "emergency";
  recommendations: string[];
  symptoms: string[];
  age: number;
  gender: string;
  painLevel: number;
  patientName?: string;
  additionalNotes?: string;
  language: string;
  createdAt: string;
}

export interface ReportResult {
  id: number;
  assessmentId: number;
  summary: string;
  diagnosis: string;
  recommendations: string[];
  assessment: AssessmentResult;
  createdAt: string;
}

interface AssessmentProps {
  sessionId: string | null;
  onSessionId: (id: string) => void;
  onAssessmentComplete: (result: AssessmentResult) => void;
}

export function Assessment({ sessionId, onSessionId, onAssessmentComplete }: AssessmentProps) {
  const { t, language } = useLanguage();
  const { accessToken } = useAuth();
  const { showToast } = useToastCtx();

  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!patientName.trim()) e["patientName"] = t("assessment.required");
    if (!age || parseInt(age) < 1 || parseInt(age) > 120) e["age"] = t("assessment.required");
    if (!gender) e["gender"] = t("assessment.required");
    if (selectedSymptoms.length === 0) e["symptoms"] = t("assessment.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleSymptom(key: string) {
    const val = SYMPTOM_KEYS[key];
    setSelectedSymptoms(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    );
    setErrors(prev => ({ ...prev, symptoms: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiCall<AssessmentResult & { sessionId?: string }>(
        "/assessment/submit",
        {
          method: "POST",
          body: JSON.stringify({
            patientName, age: parseInt(age), gender, symptoms: selectedSymptoms,
            painLevel, additionalNotes, language, sessionId,
          }),
        },
        accessToken
      );
      if (data.sessionId) onSessionId(data.sessionId);
      setResult(data);
      onAssessmentComplete(data);
      showToast(t("toast.assessmentComplete"), "success");
    } catch {
      showToast(t("toast.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!result) return;
    setGeneratingReport(true);
    try {
      const data = await apiCall<ReportResult>(
        "/report/generate",
        { method: "POST", body: JSON.stringify({ assessmentId: result.id, sessionId }) },
        accessToken
      );
      setReport(data);
      showToast(t("toast.reportGenerated"), "success");
    } catch {
      showToast(t("toast.error"), "error");
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <section id="assessment" aria-label="Symptom Assessment">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">📋 {t("nav.assessment")}</div>
          <h2 className="section-title">{t("assessment.title")}</h2>
          <p className="section-subtitle">{t("assessment.subtitle")}</p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Patient Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                    {t("assessment.patientName")} *
                  </label>
                  <input
                    className="input-field"
                    value={patientName}
                    onChange={e => { setPatientName(e.target.value); setErrors(p => ({ ...p, patientName: "" })); }}
                    placeholder={t("assessment.namePlaceholder")}
                    data-testid="input-patient-name"
                  />
                  {errors["patientName"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["patientName"]}</span>}
                </div>

                {/* Age */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                    {t("assessment.age")} *
                  </label>
                  <input
                    className="input-field" type="number" min={1} max={120}
                    value={age} onChange={e => { setAge(e.target.value); setErrors(p => ({ ...p, age: "" })); }}
                    placeholder={t("assessment.agePlaceholder")}
                    data-testid="input-age"
                  />
                  {errors["age"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["age"]}</span>}
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                    {t("assessment.gender")} *
                  </label>
                  <select
                    className="input-field"
                    value={gender}
                    onChange={e => { setGender(e.target.value); setErrors(p => ({ ...p, gender: "" })); }}
                    data-testid="select-gender"
                  >
                    <option value="">{t("assessment.selectGender")}</option>
                    <option value="Male">{t("assessment.male")}</option>
                    <option value="Female">{t("assessment.female")}</option>
                    <option value="Other">{t("assessment.other")}</option>
                  </select>
                  {errors["gender"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem" }}>{errors["gender"]}</span>}
                </div>

                {/* Symptoms */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.5rem" }}>
                    {t("assessment.symptoms")} * {selectedSymptoms.length > 0 && <span style={{ color: "var(--teal)" }}>({selectedSymptoms.length})</span>}
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {SYMPTOM_LIST.map(key => (
                      <button
                        type="button" key={key}
                        className={`symptom-tag${selectedSymptoms.includes(SYMPTOM_KEYS[key]) ? " selected" : ""}`}
                        onClick={() => toggleSymptom(key)}
                        data-testid={`symptom-${key}`}
                      >
                        {t(`symptoms.${key}`)}
                      </button>
                    ))}
                  </div>
                  {errors["symptoms"] && <span style={{ color: "var(--clr-red)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{errors["symptoms"]}</span>}
                </div>

                {/* Pain Level */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.5rem" }}>
                    {t("assessment.painLevel")}: <span style={{ color: painLevel > 7 ? "var(--risk-high)" : painLevel > 4 ? "var(--risk-moderate)" : "var(--green)" }}>{painLevel}/10</span>
                  </label>
                  <input
                    type="range" className="pain-slider"
                    min={0} max={10} value={painLevel}
                    onChange={e => setPainLevel(parseInt(e.target.value))}
                    data-testid="input-pain-level"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.25rem" }}>
                    <span>{t("assessment.painNone")}</span>
                    <span>{t("assessment.painSevere")}</span>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.375rem" }}>
                    {t("assessment.additionalNotes")}
                  </label>
                  <textarea
                    className="input-field"
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder={t("assessment.notesPlaceholder")}
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn-primary" style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", justifyContent: "center" }} disabled={loading} data-testid="btn-submit-assessment">
                    {loading ? <><span className="animate-spin">⏳</span> {t("assessment.analyzing")}</> : <><span>🔬</span> {t("assessment.submit")}</>}
                  </button>
                </div>
              </div>
            </form>

            {result && !report && (
              <RiskDashboard
                riskScore={result.riskScore}
                riskLevel={result.riskLevel as any}
                recommendations={result.recommendations}
                patientName={result.patientName}
                symptoms={result.symptoms}
                age={result.age}
                gender={result.gender}
                painLevel={result.painLevel}
                onGenerateReport={handleGenerateReport}
                isGenerating={generatingReport}
              />
            )}
          </div>

          {report && (
            <HealthReport report={report} />
          )}
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
