/**
 * 共通ユーティリティ関数
 * api.ts, speech.ts, ReaderScreen.tsx 等に散在していた関数を集約
 */

/** HTMLタグを除去してプレーンテキストを返す */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/** HTMLタグを除去し、エンティティも復元してプレーンテキストを返す */
export function stripHtml(html: string): string {
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

/** 特殊文字を HTML エスケープ */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 数値を人間に読みやすい形式に変換 (1K, 1.2M) */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/** 文字数を「万字」形式に変換 */
export function formatLength(length: number): string {
  if (length >= 10_000) return `${(length / 10_000).toFixed(1)}万字`;
  return `${length.toLocaleString()}字`;
}

/** API日付文字列を Y/M/D に整形 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr.split(" ")[0];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** タイトル先頭の【...】や《...》や[...]のタグ情報を除去 */
export function cleanTitle(title: string): string {
  return title
    .replace(/^(\s*(【[^】]*】|《[^》]*》|\[[^\]]*\])\s*)+/, "")
    .trim();
}

/** 段落先頭の全角スペース・半角スペースを除去 */
export function stripLeadingSpaces(html: string): string {
  return html.replace(/(>)\s*[　\s]+/g, "$1");
}

/**
 * 縦中横 (Tate-Chu-Yoko) 変換
 * - 1~2桁の半角数字 → <span class="tcy">
 * - !? 等の2文字連続 → <span class="tcy">
 */
export function transformForVertical(html: string): string {
  return html.split(/(<[^>]*>)/).map(segment => {
    if (segment.startsWith("<")) return segment;
    let result = segment.replace(
      /(?<![0-9a-zA-Z])([0-9]{1,2})(?![0-9a-zA-Z])/g,
      '<span class="tcy">$1</span>'
    );
    result = result.replace(
      /([!?！？]{2})/g,
      '<span class="tcy">$1</span>'
    );
    return result;
  }).join("");
}
