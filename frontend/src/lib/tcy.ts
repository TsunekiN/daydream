/**
 * 縦中横 (Tate-Chu-Yoko) 変換
 * 縦書き中で半角数字・記号を横並びにするためのHTML変換。
 */

/**
 * テキスト中の半角数字（1~2桁）を縦中横spanで囲む
 */
export function applyTcy(html: string): string {
  // 1~2桁の半角数字を縦中横化
  return html.replace(
    /(?<![0-9a-zA-Z])([0-9]{1,2})(?![0-9a-zA-Z])/g,
    '<span class="tcy">$1</span>'
  );
}

/**
 * 半角記号(!? など)の連続を縦中横化
 */
export function applyTcyMarks(html: string): string {
  return html.replace(
    /([!?！？]{2})/g,
    '<span class="tcy">$1</span>'
  );
}

/**
 * 縦書き用にHTMLを変換する
 */
export function transformForVertical(html: string): string {
  let result = html;
  result = applyTcy(result);
  result = applyTcyMarks(result);
  return result;
}
