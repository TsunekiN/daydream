/**
 * TTS (Text-to-Speech) ユーティリティ
 */

/**
 * HTMLタグを除去してプレーンテキストを返す
 */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

/**
 * テキストのバイト長（UTF-8想定）を概算
 */
export function byteLength(text: string): number {
  return new Blob([text]).size;
}

/**
 * テキストを読み上げ可能なチャンクに分割する
 * Web Speech API は長文だと途中で止まるため、適切な長さに分割する。
 */
export function splitIntoChunks(text: string, maxChars: number = 200): string[] {
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
