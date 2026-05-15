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
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] as (new () => AnyRecognition)) ||
         (w["webkitSpeechRecognition"] as (new () => AnyRecognition));
}

export function useVoice(language: Language, onTranscript?: (text: string) => void): VoiceHookResult {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<AnyRecognition>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const SpeechRecognitionAPI = getRecognitionAPI();
  const isSupported = !!SpeechRecognitionAPI && !!window.speechSynthesis;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const API = getRecognitionAPI();
    if (!API) {
      setError("Speech recognition not supported");
      return;
    }
    setError(null);
    setTranscript("");

    const recognition = new API();
    recognition.lang = LANG_CODES[language];
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      const text = final || interim;
      setTranscript(text);
      if (final && onTranscript) onTranscript(final.trim());
    };

    recognition.onerror = (event: any) => {
      const code: string = event.error ?? "";
      const msg = code === "not-allowed"
        ? "Microphone permission denied"
        : code === "no-speech"
        ? "No speech detected"
        : `Voice error: ${code}`;
      setError(msg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setError("Could not start voice recognition");
      setIsListening(false);
    }
  }, [language, onTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_CODES[language];
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current = window.speechSynthesis;
    window.speechSynthesis.speak(utter);
  }, [language]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    isListening, isSpeaking, transcript, error, isSupported,
    startListening, stopListening, speak, stopSpeaking, toggleListening,
  };
}
