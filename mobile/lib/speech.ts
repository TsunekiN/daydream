/**
 * TTS (Text-to-Speech) — expo-speech ベース
 * Web版 SpeechContext の仕様を再現
 */

import * as Speech from "expo-speech";

export type SpeechStatus = "idle" | "playing" | "paused";

/** HTMLタグを除去してプレーンテキストを返す */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** テキストを読み上げ可能なチャンクに分割（Web版と同じ: 200文字区切り、文末で分割） */
function splitIntoChunks(text: string, maxChars: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[。！？\n])/);

  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

export type SpeechListener = (state: {
  status: SpeechStatus;
  currentChunkIndex: number;
  totalChunks: number;
}) => void;

class SpeechEngine {
  private chunks: string[] = [];
  private currentIndex = 0;
  private _status: SpeechStatus = "idle";
  private _rate = 1.0;
  private listeners = new Set<SpeechListener>();

  get status() { return this._status; }
  get currentChunkIndex() { return this.currentIndex; }
  get totalChunks() { return this.chunks.length; }
  get rate() { return this._rate; }

  subscribe(listener: SpeechListener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const state = { status: this._status, currentChunkIndex: this.currentIndex, totalChunks: this.chunks.length };
    this.listeners.forEach(l => l(state));
  }

  speak(html: string) {
    Speech.stop();
    const text = stripHtml(html);
    this.chunks = splitIntoChunks(text);
    this.currentIndex = 0;
    this._status = "playing";
    this.notify();
    this.speakChunk(0);
  }

  private speakChunk(index: number) {
    if (index >= this.chunks.length) {
      this._status = "idle";
      this.currentIndex = 0;
      this.notify();
      return;
    }

    Speech.speak(this.chunks[index], {
      language: "ja-JP",
      rate: this._rate,
      pitch: 1.0,
      onDone: () => {
        this.currentIndex = index + 1;
        this.notify();
        if (this._status === "playing") {
          this.speakChunk(index + 1);
        }
      },
      onError: () => {
        this.currentIndex = index + 1;
        this.notify();
        if (index + 1 < this.chunks.length && this._status === "playing") {
          this.speakChunk(index + 1);
        } else {
          this._status = "idle";
          this.notify();
        }
      },
    });
  }

  pause() {
    Speech.pause();
    this._status = "paused";
    this.notify();
  }

  resume() {
    Speech.resume();
    this._status = "playing";
    this.notify();
  }

  stop() {
    Speech.stop();
    this.chunks = [];
    this.currentIndex = 0;
    this._status = "idle";
    this.notify();
  }

  setRate(rate: number) {
    this._rate = rate;
  }
}

// Singleton
export const speechEngine = new SpeechEngine();
