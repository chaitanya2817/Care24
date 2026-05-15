export type RiskLevel = "low" | "moderate" | "high" | "emergency";

const SYMPTOM_SCORES: Record<string, number> = {
  "chest pain": 35,
  "shortness of breath": 30,
  "difficulty breathing": 30,
  "severe chest pressure": 40,
  "heart attack": 45,
  "stroke": 45,
  "unconscious": 45,
  "seizure": 40,
  "severe allergic reaction": 38,
  "anaphylaxis": 45,
  "severe bleeding": 35,
  "head injury": 30,
  "high fever": 20,
  "fever": 15,
  "headache": 10,
  "severe headache": 20,
  "migraine": 12,
  "nausea": 8,
  "vomiting": 10,
  "diarrhea": 8,
  "abdominal pain": 12,
  "severe abdominal pain": 22,
  "back pain": 10,
  "sore throat": 8,
  "cough": 8,
  "cold": 5,
  "fatigue": 8,
  "dizziness": 12,
  "fainting": 25,
  "rash": 10,
  "swelling": 12,
  "joint pain": 8,
  "muscle pain": 8,
  "weakness": 15,
  "numbness": 18,
  "vision problems": 22,
  "hearing loss": 15,
  "ear pain": 8,
};

export function calculateRiskScore(symptoms: string[], painLevel: number, age: number): number {
  let score = 0;

  for (const symptom of symptoms) {
    const lower = symptom.toLowerCase();
    for (const [key, val] of Object.entries(SYMPTOM_SCORES)) {
      if (lower.includes(key)) {
        score += val;
        break;
      }
    }
  }

  score += Math.round(painLevel * 3.5);

  if (age > 65) score += 10;
  if (age > 75) score += 10;
  if (age < 5) score += 15;

  return Math.min(100, score);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "emergency";
  if (score >= 55) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

export function getRecommendations(riskLevel: RiskLevel, symptoms: string[], language: string): string[] {
  const recs: Record<RiskLevel, Record<string, string[]>> = {
    low: {
      en: [
        "Rest and monitor your symptoms",
        "Stay hydrated with fluids",
        "Take OTC pain relievers if needed",
        "Contact a doctor if symptoms worsen",
        "Get adequate sleep",
      ],
      hi: [
        "आराम करें और लक्षणों पर नजर रखें",
        "तरल पदार्थ पियें",
        "यदि आवश्यक हो तो OTC दर्द निवारक लें",
        "लक्षण बिगड़ने पर डॉक्टर से संपर्क करें",
        "पर्याप्त नींद लें",
      ],
      kn: [
        "ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿ",
        "ದ್ರವಗಳನ್ನು ಸೇವಿಸಿ",
        "ಅಗತ್ಯವಿದ್ದರೆ OTC ನೋವು ನಿವಾರಕಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ",
        "ಲಕ್ಷಣಗಳು ಹದಗೆಟ್ಟರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ",
        "ಸಾಕಷ್ಟು ನಿದ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ",
      ],
    },
    moderate: {
      en: [
        "Schedule a clinic appointment within 24 hours",
        "Monitor vital signs regularly",
        "Bring a list of all medications",
        "Consider telemedicine consultation",
        "Blood panel may be recommended",
        "Avoid strenuous activity",
      ],
      hi: [
        "24 घंटे के भीतर क्लिनिक अपॉइंटमेंट बुक करें",
        "नियमित रूप से महत्वपूर्ण संकेतों की निगरानी करें",
        "सभी दवाओं की सूची लाएं",
        "टेलीमेडिसिन परामर्श पर विचार करें",
        "ब्लड पैनल की सिफारिश हो सकती है",
        "कठिन गतिविधि से बचें",
      ],
      kn: [
        "24 ಗಂಟೆಗಳಲ್ಲಿ ಕ್ಲಿನಿಕ್ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿಪಡಿಸಿ",
        "ನಿಯಮಿತವಾಗಿ ವೈಟಲ್ ಸೈನ್ಸ್ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ",
        "ಎಲ್ಲಾ ಔಷಧಿಗಳ ಪಟ್ಟಿ ತನ್ನಿ",
        "ಟೆಲಿಮೆಡಿಸಿನ್ ಸಮಾಲೋಚನೆ ಪರಿಗಣಿಸಿ",
        "ರಕ್ತ ಪರೀಕ್ಷೆ ಶಿಫಾರಸು ಮಾಡಬಹುದು",
        "ಕಠಿಣ ಚಟುವಟಿಕೆ ತಪ್ಪಿಸಿ",
      ],
    },
    high: {
      en: [
        "Seek urgent medical care today",
        "Do not delay treatment beyond a few hours",
        "Call ahead to your clinic or urgent care",
        "Have someone accompany you",
        "Monitor symptoms continuously",
        "Telemedicine available for faster triage",
      ],
      hi: [
        "आज तत्काल चिकित्सा सहायता लें",
        "कुछ घंटों से अधिक उपचार में देरी न करें",
        "अपने क्लिनिक या अर्जेंट केयर को पहले कॉल करें",
        "किसी को अपने साथ ले जाएं",
        "लक्षणों की लगातार निगरानी करें",
        "तेज़ ट्राइएज के लिए टेलीमेडिसिन उपलब्ध है",
      ],
      kn: [
        "ಇಂದು ತುರ್ತು ವೈದ್ಯಕೀಯ ಆರೈಕೆ ಪಡೆಯಿರಿ",
        "ಕೆಲ ಗಂಟೆಗಳಿಗಿಂತ ಹೆಚ್ಚು ಚಿಕಿತ್ಸೆ ವಿಳಂಬ ಮಾಡಬೇಡಿ",
        "ನಿಮ್ಮ ಕ್ಲಿನಿಕ್‌ಗೆ ಮೊದಲು ಕರೆ ಮಾಡಿ",
        "ಯಾರಾದರೂ ನಿಮ್ಮೊಂದಿಗೆ ಬರಲಿ",
        "ಲಕ್ಷಣಗಳನ್ನು ನಿರಂತರವಾಗಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ",
        "ತ್ವರಿತ ಟ್ರಯಾಜ್‌ಗಾಗಿ ಟೆಲಿಮೆಡಿಸಿನ್ ಲಭ್ಯವಿದೆ",
      ],
    },
    emergency: {
      en: [
        "CALL 112 or go to the Emergency Room IMMEDIATELY",
        "Do not eat or drink anything",
        "Bring your ID and insurance card",
        "Inform a family member or caregiver",
        "Do not drive yourself — call an ambulance",
        "This is a life-threatening situation",
      ],
      hi: [
        "तुरंत 112 पर कॉल करें या इमरजेंसी रूम जाएं",
        "कुछ भी न खाएं या पिएं",
        "अपना आईडी और बीमा कार्ड लाएं",
        "परिवार के किसी सदस्य को सूचित करें",
        "खुद गाड़ी न चलाएं — एम्बुलेंस बुलाएं",
        "यह जानलेवा स्थिति है",
      ],
      kn: [
        "ತಕ್ಷಣ 112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ತುರ್ತು ಕೋಣೆಗೆ ಹೋಗಿ",
        "ಏನೂ ತಿನ್ನಬೇಡಿ ಅಥವಾ ಕುಡಿಯಬೇಡಿ",
        "ನಿಮ್ಮ ID ಮತ್ತು ವಿಮಾ ಕಾರ್ಡ್ ತನ್ನಿ",
        "ಕುಟುಂಬ ಸದಸ್ಯರಿಗೆ ತಿಳಿಸಿ",
        "ನೀವೇ ವಾಹನ ಚಲಾಯಿಸಬೇಡಿ — ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆಯಿರಿ",
        "ಇದು ಜೀವ-ಬೆದರಿಕೆಯ ಪರಿಸ್ಥಿತಿ",
      ],
    },
  };

  const lang = ["en", "hi", "kn"].includes(language) ? language : "en";
  return recs[riskLevel][lang] || recs[riskLevel]["en"];
}

export function detectEmergency(symptoms: string[]): boolean {
  const emergencyKeywords = [
    "chest pain", "heart attack", "can't breathe", "cannot breathe",
    "shortness of breath", "stroke", "unconscious", "seizure",
    "severe bleeding", "anaphylaxis", "allergic reaction",
  ];
  const text = symptoms.join(" ").toLowerCase();
  return emergencyKeywords.some(k => text.includes(k));
}

export function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("book") || lower.includes("appointment") || lower.includes("doctor")) return "book_appointment";
  if (lower.includes("report") || lower.includes("history")) return "view_report";
  if (lower.includes("emergency") || lower.includes("call 112") || lower.includes("ambulance")) return "emergency";
  if (lower.includes("symptom") || lower.includes("pain") || lower.includes("fever") || lower.includes("headache") || lower.includes("cough")) return "symptom_check";
  if (lower.includes("medicine") || lower.includes("medication") || lower.includes("drug")) return "medication_query";
  return "general";
}

export function generateAIResponse(
  message: string,
  riskLevel: RiskLevel,
  intent: string,
  language: string,
  recommendations: string[]
): string {
  const lang = ["en", "hi", "kn"].includes(language) ? language : "en";

  const responses: Record<string, Record<string, string>> = {
    emergency: {
      en: `🚨 EMERGENCY DETECTED — Please call 112 or go to the nearest Emergency Room IMMEDIATELY. Do not delay. ${recommendations[0] || ""}`,
      hi: `🚨 आपातकाल — तुरंत 112 पर कॉल करें या नजदीकी इमरजेंसी रूम जाएं। देरी न करें। ${recommendations[0] || ""}`,
      kn: `🚨 ತುರ್ತು — ತಕ್ಷಣ 112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಕೋಣೆಗೆ ಹೋಗಿ. ವಿಳಂಬ ಮಾಡಬೇಡಿ. ${recommendations[0] || ""}`,
    },
    high: {
      en: `⚠️ Your symptoms suggest a HIGH risk situation. Please seek urgent medical care today. I recommend: ${recommendations.slice(0, 2).join(". ")}.`,
      hi: `⚠️ आपके लक्षण उच्च जोखिम की स्थिति का संकेत देते हैं। कृपया आज ही तत्काल चिकित्सा सहायता लें। ${recommendations.slice(0, 2).join(". ")}`,
      kn: `⚠️ ನಿಮ್ಮ ಲಕ್ಷಣಗಳು ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸ್ಥಿತಿಯನ್ನು ಸೂಚಿಸುತ್ತವೆ. ಇಂದು ತುರ್ತು ವೈದ್ಯಕೀಯ ಆರೈಕೆ ಪಡೆಯಿರಿ. ${recommendations.slice(0, 2).join(". ")}`,
    },
    moderate: {
      en: `📋 Based on your symptoms, I recommend scheduling a clinic visit within 24 hours. ${recommendations.slice(0, 2).join(". ")}.`,
      hi: `📋 आपके लक्षणों के आधार पर, मैं 24 घंटे के भीतर क्लिनिक जाने की सलाह देता हूं। ${recommendations.slice(0, 2).join(". ")}`,
      kn: `📋 ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಆಧಾರದ ಮೇಲೆ, 24 ಗಂಟೆಗಳಲ್ಲಿ ಕ್ಲಿನಿಕ್ ಭೇಟಿ ನಿಗದಿಪಡಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ. ${recommendations.slice(0, 2).join(". ")}`,
    },
    low: {
      en: `✅ Your symptoms appear to be LOW risk. ${recommendations.slice(0, 2).join(". ")}. Monitor your condition and contact a doctor if symptoms worsen.`,
      hi: `✅ आपके लक्षण कम जोखिम वाले प्रतीत होते हैं। ${recommendations.slice(0, 2).join(". ")}। यदि लक्षण बिगड़ें तो डॉक्टर से संपर्क करें।`,
      kn: `✅ ನಿಮ್ಮ ಲಕ್ಷಣಗಳು ಕಡಿಮೆ ಅಪಾಯದ ಸ್ಥಿತಿ ತೋರಿಸುತ್ತವೆ. ${recommendations.slice(0, 2).join(". ")}. ಲಕ್ಷಣಗಳು ಹದಗೆಟ್ಟರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
    },
  };

  if (intent === "book_appointment") {
    const apptRec: Record<string, string> = {
      en: "I can help you book an appointment. Please scroll down to the Telemedicine section to connect with our available doctors.",
      hi: "मैं आपको अपॉइंटमेंट बुक करने में मदद कर सकता हूं। हमारे उपलब्ध डॉक्टरों से जुड़ने के लिए टेलीमेडिसिन सेक्शन तक स्क्रॉल करें।",
      kn: "ನಾನು ನಿಮಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಲಭ್ಯವಿರುವ ವೈದ್ಯರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಟೆಲಿಮೆಡಿಸಿನ್ ವಿಭಾಗಕ್ಕೆ ಸ್ಕ್ರೋಲ್ ಮಾಡಿ.",
    };
    return apptRec[lang] || apptRec["en"];
  }

  if (intent === "view_report") {
    const reportRec: Record<string, string> = {
      en: "Your health report is available after completing an assessment. Please fill out the symptom assessment form to generate a detailed report.",
      hi: "आपकी स्वास्थ्य रिपोर्ट मूल्यांकन पूरा करने के बाद उपलब्ध है। विस्तृत रिपोर्ट के लिए लक्षण मूल्यांकन फॉर्म भरें।",
      kn: "ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಳಿಸಿದ ನಂತರ ನಿಮ್ಮ ಆರೋಗ್ಯ ವರದಿ ಲಭ್ಯವಿರುತ್ತದೆ. ವಿವರವಾದ ವರದಿಗಾಗಿ ಲಕ್ಷಣ ಮೌಲ್ಯಮಾಪನ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ.",
    };
    return reportRec[lang] || reportRec["en"];
  }

  return responses[riskLevel][lang] || responses[riskLevel]["en"];
}
