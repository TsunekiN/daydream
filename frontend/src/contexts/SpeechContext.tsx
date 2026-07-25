import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { splitIntoChunks, stripHtml } from "@/lib/speech-utils";
import { DEFAULT_RATE, DEFAULT_PITCH, DEFAULT_VOLUME, JA_VOICE_PATTERNS } from "@/constants/tts";

export type SpeechStatus = "idle" | "playing" | "paused";

interface SpeechContextValue {
  status: SpeechStatus;
  currentChunkIndex: number;
  totalChunks: number;
  rate: number;
  speak: (html: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
}

function findJaVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  for (const pattern of JA_VOICE_PATTERNS) {
    const found = voices.find((v) => v.name.includes(pattern) || v.lang.startsWith("ja"));
    if (found) return found;
  }
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [rate, setRateState] = useState(DEFAULT_RATE);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      voiceRef.current = findJaVoice();
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const speakChunk = useCallback((index: number) => {
    if (index >= chunksRef.current.length) {
      setStatus("idle");
      setCurrentChunkIndex(0);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
    utterance.lang = "ja-JP";
    utterance.rate = rate;
    utterance.pitch = DEFAULT_PITCH;
    utterance.volume = DEFAULT_VOLUME;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onend = () => {
      const next = indexRef.current + 1;
      indexRef.current = next;
      setCurrentChunkIndex(next);
      speakChunk(next);
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("Speech error:", e.error);
      }
      // Try next chunk on error
      const next = indexRef.current + 1;
      indexRef.current = next;
      setCurrentChunkIndex(next);
      if (next < chunksRef.current.length) {
        speakChunk(next);
      } else {
        setStatus("idle");
      }
    };

    speechSynthesis.speak(utterance);
  }, [rate]);

  const speak = useCallback((html: string) => {
    speechSynthesis.cancel();
    const text = stripHtml(html);
    const chunks = splitIntoChunks(text);
    chunksRef.current = chunks;
    indexRef.current = 0;
    setTotalChunks(chunks.length);
    setCurrentChunkIndex(0);
    setStatus("playing");
    speakChunk(0);
  }, [speakChunk]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setStatus("playing");
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    chunksRef.current = [];
    indexRef.current = 0;
    setStatus("idle");
    setCurrentChunkIndex(0);
    setTotalChunks(0);
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
  }, []);

  return (
    <SpeechContext.Provider
      value={{ status, currentChunkIndex, totalChunks, rate, speak, pause, resume, stop, setRate }}
    >
      {children}
    </SpeechContext.Provider>
  );
}
