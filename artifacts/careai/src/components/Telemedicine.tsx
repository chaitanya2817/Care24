import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useToastCtx } from "../contexts/ToastContext";
import { apiCall } from "../utils/api";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
  available: boolean;
  avatarEmoji: string;
  nextSlot: string | null;
}

interface BookingResponse {
  id: number;
  doctorId: number;
  type: string;
  status: string;
  scheduledAt: string | null;
  doctor: Doctor;
}

interface TelemedicineProps {
  sessionId: string | null;
}

const FALLBACK_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Priya Sharma", specialty: "General Physician", experience: 12, rating: 4.8, reviewCount: 342, available: true, avatarEmoji: "👩‍⚕️", nextSlot: "Today, 3:00 PM" },
  { id: 2, name: "Dr. Arjun Mehta", specialty: "Cardiologist", experience: 18, rating: 4.9, reviewCount: 521, available: true, avatarEmoji: "👨‍⚕️", nextSlot: "Today, 4:30 PM" },
  { id: 3, name: "Dr. Kavitha Nair", specialty: "Pulmonologist", experience: 15, rating: 4.7, reviewCount: 289, available: false, avatarEmoji: "👩‍⚕️", nextSlot: "Tomorrow, 10:00 AM" },
  { id: 4, name: "Dr. Rajan Patel", specialty: "Neurologist", experience: 20, rating: 4.9, reviewCount: 612, available: true, avatarEmoji: "👨‍⚕️", nextSlot: "Today, 6:00 PM" },
  { id: 5, name: "Dr. Sunita Verma", specialty: "Dermatologist", experience: 10, rating: 4.6, reviewCount: 198, available: true, avatarEmoji: "👩‍⚕️", nextSlot: "Today, 5:00 PM" },
  { id: 6, name: "Dr. Vikram Singh", specialty: "Orthopedist", experience: 16, rating: 4.8, reviewCount: 445, available: false, avatarEmoji: "👨‍⚕️", nextSlot: "Tomorrow, 9:00 AM" },
];

export function Telemedicine({ sessionId }: TelemedicineProps) {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const { showToast } = useToastCtx();

  const [doctors, setDoctors] = useState<Doctor[]>(FALLBACK_DOCTORS);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<number | null>(null);
  const [booked, setBooked] = useState<Set<number>>(new Set());

  useEffect(() => {
    apiCall<Doctor[]>("/telemedicine/doctors", {}, accessToken)
      .then(data => { if (data.length > 0) setDoctors(data); })
      .catch(() => { /* use fallback */ });
  }, [accessToken]);

  async function handleBook(doctorId: number) {
    const type = bookingType[doctorId] ?? "video_call";
    setLoading(doctorId);
    try {
      const data = await apiCall<BookingResponse>(
        "/telemedicine/book",
        {
          method: "POST",
          body: JSON.stringify({ doctorId, type, sessionId }),
        },
        accessToken
      );
      setBooked(prev => new Set([...prev, doctorId]));
      setBookingId(data.id);
      showToast(`${t("telemedicine.booked")} — ${data.doctor.name}`, "success");
    } catch {
      showToast(t("toast.error"), "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="telemedicine" aria-label="Telemedicine">
      <div className="section">
        <div className="section-header">
          <div className="section-tag">🩺 {t("telemedicine.title")}</div>
          <h2 className="section-title">{t("telemedicine.subtitle")}</h2>
          <p className="section-subtitle">{t("telemedicine.description")}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {doctors.map(doc => (
            <div key={doc.id} className="doctor-card" data-testid={`doctor-card-${doc.id}`}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))",
                  border: "2px solid rgba(56,189,248,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem",
                }}>
                  {doc.avatarEmoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{doc.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 500 }}>{doc.specialty}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{doc.experience} yrs experience</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                  <span style={{ color: "var(--amber)", fontSize: "0.8rem" }}>⭐</span>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{doc.rating}</span>
                  <span style={{ color: "var(--text3)", fontSize: "0.7rem" }}>({doc.reviewCount})</span>
                </div>
              </div>

              {/* Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.625rem", borderRadius: "2rem",
                  background: doc.available ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                  color: doc.available ? "var(--green)" : "var(--text3)",
                  border: `1px solid ${doc.available ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)"}`,
                }}>
                  {doc.available ? "● " + t("telemedicine.available") : "○ " + t("telemedicine.busy")}
                </span>
                {doc.nextSlot && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text2)" }}>🕐 {doc.nextSlot}</span>
                )}
              </div>

              {/* Type selector */}
              <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.875rem" }}>
                {["video_call", "schedule"].map(type => (
                  <button
                    key={type}
                    className={bookingType[doc.id] === type || (!bookingType[doc.id] && type === "video_call") ? "btn-primary" : "btn-outline"}
                    style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.75rem", justifyContent: "center" }}
                    onClick={() => setBookingType(prev => ({ ...prev, [doc.id]: type }))}
                    data-testid={`type-${type}-${doc.id}`}
                  >
                    {type === "video_call" ? "📹 " + t("telemedicine.videoCall") : "📅 " + t("telemedicine.schedule")}
                  </button>
                ))}
              </div>

              {/* Book button */}
              {booked.has(doc.id) ? (
                <div style={{ textAlign: "center", color: "var(--green)", fontWeight: 600, fontSize: "0.875rem", padding: "0.5rem" }}>
                  ✓ {t("telemedicine.booked")}
                </div>
              ) : (
                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => handleBook(doc.id)}
                  disabled={loading === doc.id || !doc.available}
                  data-testid={`btn-book-${doc.id}`}
                >
                  {loading === doc.id
                    ? <><span className="animate-spin">⏳</span> {t("telemedicine.booking")}</>
                    : <><span>🩺</span> {t("telemedicine.bookAppointment")}</>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <hr className="section-divider" />
    </section>
  );
}
