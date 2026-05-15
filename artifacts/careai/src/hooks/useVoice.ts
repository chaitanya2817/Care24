import { useState, useRef, useCallback, useEffect } from "react";
import type { Language } from "../contexts/LanguageContext";

const LANG_CODES: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRecognition = any;

export interface VoiceHookResult {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  toggleListening: () => void;
}

function getRecognitionAPI(): (new () => AnyRecognition) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] as (new () => AnyRecognition)) ||
         (w["webkitSpeechRecognition"] as (new () => AnyRecognition));
}

/** Load voices — Chrome loads them async, Safari sync */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
    // Fallback after 1s if voiceschanged never fires
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  // Try exact match first, then language prefix
  return voices.find(v => v.lang === lang) ||
         voices.find(v => v.lang.startsWith(lang.split("-")[0])) ||
         voices.find(v => v.lang.startsWith("en")) ||
         null;
}

export function useVoice(
  language: Language,
  onTranscript?: (text: string) => void
): VoiceHookResult {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Always-current callback ref — avoids stale closures in async recognition handlers
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const recognitionRef = useRef<AnyRecognition>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const isSupported =
    typeof window !== "undefined" &&
    !!getRecognitionAPI() &&
    !!window.speechSynthesis;

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = undefined;
    }
    setIsSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const API = getRecognitionAPI();
    if (!API) {
      setError("Speech recognition not supported in this browser");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setError(null);
    setTranscript("");

    const rec = new API();
    rec.lang = LANG_CODES[language];
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      const display = finalText || interimText;
      setTranscript(display);
      if (finalText) {
        // Call the latest version of the callback via ref — never stale
        onTranscriptRef.current?.(finalText.trim());
      }
    };

    rec.onerror = (event: any) => {
      const code: string = event.error ?? "";
      if (code === "aborted") { setIsListening(false); return; }
      const msg =
        code === "not-allowed" ? "Microphone permission denied. Please allow microphone access." :
        code === "no-speech"   ? "No speech detected. Try speaking clearly." :
        code === "network"     ? "Network error during voice recognition." :
        code === "audio-capture" ? "No microphone detected." :
        `Voice error: ${code}`;
      setError(msg);
      setIsListening(false);
      recognitionRef.current = null;
    };

    rec.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      rec.start();
    } catch (err: any) {
      setError("Could not start voice recognition: " + (err?.message ?? "unknown error"));
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [language]); // language is the only real dep now (onTranscript goes through ref)

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const speak = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = undefined;
    }

    const voices = await waitForVoices();
    const langCode = LANG_CODES[language];
    const voice = pickVoice(voices, langCode);

    const utter = new SpeechSynthesisUtterance(text);
    if (voice) utter.voice = voice;
    utter.lang = langCode;
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;

    utter.onstart = () => {
      setIsSpeaking(true);
      // Chrome bug: long utterances get cut off — keep it alive
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = undefined;
        }
      }, 10000);
    };

    utter.onend = () => {
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = undefined;
      }
    };

    utter.onerror = (e: any) => {
      // 'interrupted' is normal when cancel() is called — not an error
      if (e?.error !== "interrupted" && e?.error !== "canceled") {
        setError("Text-to-speech error: " + (e?.error ?? "unknown"));
      }
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = undefined;
      }
    };

    window.speechSynthesis.speak(utter);
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleListening,
  };
}
