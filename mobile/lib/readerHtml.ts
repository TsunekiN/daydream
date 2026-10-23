/**
 * リーダー画面用 HTML 生成
 * ReaderScreen.tsx から抽出した generateHtml ロジック
 */

import { escapeHtml, stripLeadingSpaces, transformForVertical } from "./utils";
import { FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, type ReaderSettings } from "./settings";

export interface ReaderHtmlParams {
  subtitle: string;
  bodyHtml: string;
  reader: ReaderSettings;
  isDark: boolean;
}

export function generateReaderHtml({ subtitle, bodyHtml, reader, isDark }: ReaderHtmlParams): string {
  const { layout, fontFamily, fontSize, lineHeight, letterSpacing } = reader;
  const isVertical = layout === "vertical";
  const fontCss = FONT_FAMILY_OPTIONS[fontFamily].css;
  const fontPx = FONT_SIZE_OPTIONS[fontSize].px;
  const processedBody = isVertical
    ? transformForVertical(stripLeadingSpaces(bodyHtml))
    : stripLeadingSpaces(bodyHtml);

  const bg = isDark ? "#1A1A1D" : "#FAFAFA";
  const textColor = isDark ? "#E5E5E5" : "#1C1C1E";
  const titleColor = isDark ? "#F0F0F0" : "#111113";

  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  background: ${bg};
  -webkit-text-size-adjust: 100%;
}
.reader {
  ${isVertical ? `writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; text-orientation: mixed;` : ""}
  width: 100%;
  height: 100%;
  ${isVertical ? "overflow-x: auto; overflow-y: hidden;" : "overflow-x: hidden; overflow-y: auto;"}
  -webkit-overflow-scrolling: touch;
  padding: ${isVertical ? "20px 12px" : "24px 16px"};
  font-family: ${fontCss};
  font-size: ${fontPx}px;
  line-height: ${lineHeight};
  letter-spacing: ${letterSpacing}em;
  color: ${textColor};
}
.subtitle {
  font-size: 1.2em;
  font-weight: 700;
  color: ${titleColor};
  ${isVertical ? "margin-left: 1.5em;" : "margin-bottom: 1.2em;"}
  line-height: 1.8;
}
.body p {
  ${isVertical ? "margin-left: 0.3em;" : "margin-bottom: 0.3em;"}
}
.body br {
  content: "";
  display: block;
  ${isVertical ? "margin-left: 0.3em;" : "margin-top: 0.3em;"}
}
.tcy {
  text-combine-upright: all;
  -webkit-text-combine: horizontal;
}
</style></head><body>
<div class="reader">
  ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
  <div class="body">${processedBody}</div>
</div>
<script>
${READER_SCRIPT}
</script>
</body></html>`;
}

/**
 * WebView 内のスクロール監視 + スワイプ前後話検出スクリプト
 * 画面全体を引っ張るラバーバンド + スライドアウトアニメーション付き
 */
const READER_SCRIPT = `(function() {
  var el = document.querySelector('.reader');
  if (!el) return;
  var isV = getComputedStyle(el).writingMode.indexOf('vertical') >= 0;
  var sent = false;

  // ── スクロール監視 ──────────────────────────────────────────
  el.addEventListener('scroll', function() {
    var pos = isV ? Math.abs(el.scrollLeft) : el.scrollTop;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', position: pos }));
    if (!sent) {
      var atEnd = isV
        ? (Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 20)
        : (el.scrollTop + el.clientHeight >= el.scrollHeight - 20);
      if (atEnd) {
        sent = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reachedEnd' }));
      }
    }
  });

  // ── ラバーバンド + スライドアウトナビゲーション ───────────────
  var THRESHOLD = 110;       // 遷移確定の引っ張り量 (px)
  var RESISTANCE = 0.38;     // ラバーバンド係数（1 より小さいほど重い）
  var SLIDE_OUT_PX = 320;    // 遷移時のスライドアウト距離 (px)

  var touchStartX = 0, touchStartY = 0;
  var dragging = false;
  var dragAxis = '';          // 'h' | 'v' | ''
  var dragEdge = '';          // 'start' | 'end' | ''（ページ端かどうか）
  var navigating = false;     // 遷移アニメーション中フラグ

  // ── ヘルパー: 画面を translate で動かす ─────────────────────
  function setTranslate(px) {
    var prop = isV ? 'translateX(' + px + 'px)' : 'translateY(' + px + 'px)';
    document.body.style.transform = prop;
  }
  function snapBack() {
    document.body.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';
    document.body.style.transform = 'none';
    setTimeout(function() { document.body.style.transition = ''; }, 360);
  }
  function slideOut(px, callback) {
    document.body.style.transition = 'transform 0.22s cubic-bezier(0.4,0,1,1), opacity 0.22s';
    document.body.style.opacity = '0';
    setTranslate(px);
    setTimeout(function() {
      document.body.style.transition = '';
      document.body.style.opacity = '';
      document.body.style.transform = '';
      navigating = false;
      callback();
    }, 230);
  }

  // ── インジケーターラベル ────────────────────────────────────
  var indicator = document.createElement('div');
  indicator.style.cssText = [
    'position:fixed;z-index:9999;pointer-events:none;',
    'padding:10px 18px;border-radius:24px;',
    'background:rgba(99,102,241,0.88);color:#fff;',
    'font-size:13px;font-weight:700;letter-spacing:0.02em;',
    'opacity:0;transition:opacity 0.15s;'
  ].join('');
  document.body.appendChild(indicator);

  function positionIndicator(dir) {
    if (isV) {
      indicator.style.top = '50%';
      indicator.style.bottom = '';
      indicator.style.left = (dir === 'prev') ? '12px' : '';
      indicator.style.right = (dir === 'next') ? '12px' : '';
      indicator.style.transform = 'translateY(-50%)';
    } else {
      indicator.style.left = '50%';
      indicator.style.transform = 'translateX(-50%)';
      indicator.style.top = (dir === 'prev') ? '20px' : '';
      indicator.style.bottom = (dir === 'next') ? '20px' : '';
      indicator.style.right = '';
    }
  }
  function updateIndicator(dir, ratio) {
    if (ratio <= 0) { indicator.style.opacity = '0'; return; }
    positionIndicator(dir);
    var pct = Math.round(Math.min(ratio, 1) * 100);
    var ready = ratio >= 1;
    if (isV) {
      indicator.textContent = (dir === 'next')
        ? (ready ? '\\u6b21\\u8a71\\u3078 \\u2192' : pct + '% \\u2192')
        : (ready ? '\\u2190 \\u524d\\u8a71\\u3078' : '\\u2190 ' + pct + '%');
    } else {
      indicator.textContent = (dir === 'next')
        ? (ready ? '\\u2191 \\u6b21\\u8a71\\u3078' : '\\u2191 ' + pct + '%')
        : (ready ? '\\u2193 \\u524d\\u8a71\\u3078' : '\\u2193 ' + pct + '%');
    }
    indicator.style.opacity = String(Math.min(1, ratio * 1.1));
  }

  // ── タッチイベント ─────────────────────────────────────────
  el.addEventListener('touchstart', function(e) {
    if (navigating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    dragging = false;
    dragAxis = '';
    dragEdge = '';
    indicator.style.opacity = '0';
  }, { passive: true });

  el.addEventListener('touchmove', function(e) {
    if (navigating) return;
    var dx = e.touches[0].clientX - touchStartX;
    var dy = e.touches[0].clientY - touchStartY;

    // 軸を最初の動きで固定
    if (!dragAxis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      dragAxis = (Math.abs(dx) >= Math.abs(dy)) ? 'h' : 'v';
    }

    if (isV && dragAxis === 'h') {
      // 縦書き: 横スワイプ
      var atStart = Math.abs(el.scrollLeft) <= 8;
      var atEnd   = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 8;

      if (!dragging) {
        if (atEnd   && dx > 0) { dragging = true; dragEdge = 'end'; }
        if (atStart && dx < 0) { dragging = true; dragEdge = 'start'; }
      }
      if (!dragging) return;

      // ラバーバンド: 画面全体を動かす
      var pull = (dragEdge === 'end' ? dx : dx) * RESISTANCE;
      // 逆方向は引けないようにクランプ
      if (dragEdge === 'end'   && pull < 0) pull = 0;
      if (dragEdge === 'start' && pull > 0) pull = 0;
      setTranslate(pull);
      var dir = (dragEdge === 'end') ? 'next' : 'prev';
      updateIndicator(dir, Math.abs(pull) / THRESHOLD);

    } else if (!isV && dragAxis === 'v') {
      // 横書き: 縦スワイプ
      var atTop    = el.scrollTop <= 8;
      var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;

      if (!dragging) {
        if (atBottom && dy < 0) { dragging = true; dragEdge = 'end'; }
        if (atTop    && dy > 0) { dragging = true; dragEdge = 'start'; }
      }
      if (!dragging) return;

      var pull = dy * RESISTANCE;
      if (dragEdge === 'end'   && pull > 0) pull = 0;
      if (dragEdge === 'start' && pull < 0) pull = 0;
      setTranslate(pull);
      var dir = (dragEdge === 'end') ? 'next' : 'prev';
      updateIndicator(dir, Math.abs(pull) / THRESHOLD);
    }
  }, { passive: true });

  el.addEventListener('touchend', function(e) {
    if (navigating || !dragging) {
      snapBack();
      indicator.style.opacity = '0';
      dragging = false; dragAxis = ''; dragEdge = '';
      return;
    }

    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var pull = isV ? dx * RESISTANCE : dy * RESISTANCE;
    var absPull = Math.abs(pull);
    indicator.style.opacity = '0';
    dragging = false; dragAxis = ''; dragEdge = '';

    if (absPull >= THRESHOLD) {
      // 閾値超え → スライドアウトして遷移
      navigating = true;
      var slideDir = isV
        ? (pull > 0 ?  SLIDE_OUT_PX : -SLIDE_OUT_PX)
        : (pull > 0 ?  SLIDE_OUT_PX : -SLIDE_OUT_PX);
      slideOut(slideDir, function() {
        var type = (isV ? (pull > 0 ? 'nextEpisode' : 'prevEpisode')
                        : (pull < 0 ? 'nextEpisode' : 'prevEpisode'));
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
      });
    } else {
      // 閾値未満 → スナップバック
      snapBack();
    }
  }, { passive: true });
})();`;
