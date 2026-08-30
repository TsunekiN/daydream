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
 */
const READER_SCRIPT = `(function() {
  var el = document.querySelector('.reader');
  if (!el) return;
  var isV = getComputedStyle(el).writingMode.indexOf('vertical') >= 0;
  var sent = false;

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

  // Edge swipe detection for episode navigation (with pull indicator)
  var touchStartX = 0, touchStartY = 0;
  var pullIndicator = document.createElement('div');
  pullIndicator.style.cssText = 'position:fixed;top:50%;transform:translateY(-50%);padding:12px 16px;border-radius:20px;background:rgba(99,102,241,0.9);color:#fff;font-size:13px;font-weight:bold;z-index:9999;opacity:0;transition:opacity 0.2s;pointer-events:none;';
  document.body.appendChild(pullIndicator);

  var pulling = false;
  var pullDirection = '';

  el.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    pulling = false;
    pullDirection = '';
    pullIndicator.style.opacity = '0';
  });

  el.addEventListener('touchmove', function(e) {
    var dx = e.touches[0].clientX - touchStartX;
    var dy = e.touches[0].clientY - touchStartY;
    var threshold = 100;

    if (isV) {
      var atStart = Math.abs(el.scrollLeft) <= 10;
      var atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 10;
      if (atStart && dx < -30 && Math.abs(dx) > Math.abs(dy)) {
        pulling = true;
        pullDirection = 'prev';
        pullIndicator.textContent = Math.abs(dx) >= threshold ? '\\u2190 \\u524d\\u8a71\\u3078' : '\\u2190 ' + Math.round(Math.abs(dx)/threshold*100) + '%';
        pullIndicator.style.left = '16px';
        pullIndicator.style.right = '';
        pullIndicator.style.opacity = String(Math.min(1, Math.abs(dx) / threshold));
      } else if (atEnd && dx > 30 && Math.abs(dx) > Math.abs(dy)) {
        pulling = true;
        pullDirection = 'next';
        pullIndicator.textContent = Math.abs(dx) >= threshold ? '\\u6b21\\u8a71\\u3078 \\u2192' : Math.round(Math.abs(dx)/threshold*100) + '% \\u2192';
        pullIndicator.style.right = '16px';
        pullIndicator.style.left = '';
        pullIndicator.style.opacity = String(Math.min(1, Math.abs(dx) / threshold));
      } else {
        pullIndicator.style.opacity = '0';
      }
    } else {
      var atTop = el.scrollTop <= 10;
      var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      if (atTop && dy > 30 && Math.abs(dy) > Math.abs(dx)) {
        pulling = true;
        pullDirection = 'prev';
        pullIndicator.textContent = Math.abs(dy) >= threshold ? '\\u2193 \\u524d\\u8a71\\u3078' : '\\u2193 ' + Math.round(Math.abs(dy)/threshold*100) + '%';
        pullIndicator.style.left = '50%';
        pullIndicator.style.transform = 'translateX(-50%)';
        pullIndicator.style.top = '20px';
        pullIndicator.style.opacity = String(Math.min(1, Math.abs(dy) / threshold));
      } else if (atBottom && dy < -30 && Math.abs(dy) > Math.abs(dx)) {
        pulling = true;
        pullDirection = 'next';
        pullIndicator.textContent = Math.abs(dy) >= threshold ? '\\u2191 \\u6b21\\u8a71\\u3078' : '\\u2191 ' + Math.round(Math.abs(dy)/threshold*100) + '%';
        pullIndicator.style.left = '50%';
        pullIndicator.style.transform = 'translateX(-50%)';
        pullIndicator.style.top = '';
        pullIndicator.style.bottom = '20px';
        pullIndicator.style.opacity = String(Math.min(1, Math.abs(dy) / threshold));
      } else {
        pullIndicator.style.opacity = '0';
      }
    }
  });

  el.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var threshold = 100;

    pullIndicator.style.opacity = '0';

    if (isV) {
      if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) {
        var atStart = Math.abs(el.scrollLeft) <= 10;
        var atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 10;
        if (dx < -threshold && atStart) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'prevEpisode' }));
        } else if (dx > threshold && atEnd) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nextEpisode' }));
        }
      }
    } else {
      if (Math.abs(dy) >= threshold && Math.abs(dy) > Math.abs(dx)) {
        var atTop = el.scrollTop <= 10;
        var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (dy > threshold && atTop) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'prevEpisode' }));
        } else if (dy < -threshold && atBottom) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'nextEpisode' }));
        }
      }
    }
  });
})();`;
