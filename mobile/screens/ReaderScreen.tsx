import { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { RootStackParamList } from "../App";
import { getEpisodeContent } from "../lib/api";
import { updateReadingProgress, saveScrollPosition, getScrollPosition, saveLastOpened, getFavorites } from "../lib/storage";
import { getCachedEpisode, cacheEpisode } from "../lib/cache";
import { loadSettings, FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, type AppSettings } from "../lib/settings";
import type { EpisodeContent, SiteMode } from "../lib/types";
import { speechEngine, type SpeechStatus } from "../lib/speech";

type Props = NativeStackScreenProps<RootStackParamList, "Reader">;

export default function ReaderScreen({ route, navigation }: Props) {
  const { ncode, episode, site } = route.params;
  const [content, setContent] = useState<EpisodeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEp, setCurrentEp] = useState(episode);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [knownTotal, setKnownTotal] = useState(0);
  const colorScheme = useColorScheme();

  useEffect(() => { loadSettings().then(setSettings); }, []);

  // お気に入りから正確な total_episodes を取得
  useEffect(() => {
    getFavorites().then(favs => {
      const fav = favs.find(f => f.ncode === ncode.toUpperCase() && f.site === site);
      if (fav?.totalEpisodes) setKnownTotal(fav.totalEpisodes);
    });
  }, [ncode, site]);

  const fetchContent = useCallback(async (ep: number) => {
    setLoading(true); setError(null);
    try {
      // キャッシュを確認
      const cached = await getCachedEpisode(ncode, ep, site);
      if (cached) {
        setContent(cached);
        saveLastOpened(ncode.toUpperCase(), site, ep);
        setLoading(false);
        return;
      }

      // ネットワークから取得
      const data = await getEpisodeContent(ncode, ep, site as SiteMode);
      setContent(data);
      if (!data.body_html || data.body_html.trim().length === 0) {
        setError("本文の取得に失敗しました");
        return;
      }

      // キャッシュに保存
      cacheEpisode(ncode, ep, site, data);
      saveLastOpened(ncode.toUpperCase(), site, ep);
    } catch (e) { setError(e instanceof Error ? e.message : "取得に失敗しました"); }
    finally { setLoading(false); }
  }, [ncode, site]);

  const webViewRef = useRef<any>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchContent(currentEp); }, [currentEp, fetchContent]);

  // スクロール位置復元
  useEffect(() => {
    if (content && !loading && webViewRef.current) {
      getScrollPosition(ncode, site, currentEp).then(pos => {
        if (pos > 0) {
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              (function() {
                var el = document.querySelector('.reader');
                if (el) {
                  var isV = getComputedStyle(el).writingMode.includes('vertical');
                  if (isV) el.scrollLeft = -${pos};
                  else el.scrollTop = ${pos};
                }
              })();
              true;
            `);
          }, 300);
        }
      });
    }
  }, [content, loading, currentEp]);

  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "reachedEnd") {
        // 最後までスクロールしたら読了
        updateReadingProgress(ncode.toUpperCase(), site, currentEp, content?.total_episodes || undefined);
      } else if (msg.type === "scroll") {
        // スクロール位置を定期保存
        if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
        scrollSaveTimer.current = setTimeout(() => {
          saveScrollPosition(ncode, site, currentEp, msg.position);
        }, 500);
      }
    } catch {}
  };

  const generateHtml = () => {
    if (!content || !settings) return "";
    const { layout, fontFamily, fontSize, lineHeight, letterSpacing } = settings.reader;
    const isDark = settings.theme === "dark";
    const isVertical = layout === "vertical";
    const fontCss = FONT_FAMILY_OPTIONS[fontFamily].css;
    const fontPx = FONT_SIZE_OPTIONS[fontSize].px;
    const bodyHtml = isVertical ? transformForVertical(stripLeadingSpaces(content.body_html)) : stripLeadingSpaces(content.body_html);

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
  ${content.subtitle ? `<div class="subtitle">${escapeHtml(content.subtitle)}</div>` : ""}
  <div class="body">${bodyHtml}</div>
</div>
<script>
(function() {
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
})();
</script>
</body></html>`;
  };

  const isDark = settings?.theme === "dark" || (settings?.theme === "system" && colorScheme === "dark");
  const containerBg = isDark ? "#1A1A1D" : "#FAFAFA";
  const headerBg = isDark ? "#232326" : "#FFF";
  const borderColor = isDark ? "#3A3A3D" : "#E5E5EA";
  const textMain = isDark ? "#F0F0F0" : "#3A3A3C";
  const textSub = isDark ? "#A0A0A5" : "#8E8E93";
  const accentColor = "#6366F1";
  const totalDisplay = content?.total_episodes || knownTotal;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header: back + title + TTS controls */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.navigate("NovelDetail", { ncode, site })} style={styles.headerBtn}>
          <Text style={[styles.backText, { color: accentColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]} numberOfLines={1}>
          {content?.subtitle || `第${currentEp}話`}
        </Text>
        {content && !loading && !error && (
          <InlinePlayer bodyHtml={content.body_html} isDark={isDark} accentColor={accentColor} textSub={textSub} />
        )}
      </View>

      {/* Content */}
      {loading && <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: "#DC2626", marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchContent(currentEp)}>
            <Text style={{ color: "#6366F1" }}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}
      {content && !loading && !error && settings && (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: generateHtml() }}
          style={[styles.webview, { backgroundColor: containerBg }]}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          javaScriptEnabled={true}
          onMessage={handleWebViewMessage}
        />
      )}

      {/* Footer */}
      {content && !loading && !error && settings && (
        <View style={[styles.footer, { backgroundColor: headerBg, borderTopColor: borderColor }]}>
          {settings.reader.layout === "vertical" ? (
            <>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? "#2A2A2D" : "#F0F0F5" }, !content.next_number && { opacity: 0.3 }]}
                onPress={() => content.next_number && setCurrentEp(content.next_number)}
                disabled={!content.next_number}
              >
                <Text style={[styles.navBtnText, { color: accentColor }]}>
                  {content.next_number ? `← ${content.next_number}話` : "―"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.epText, { color: textSub }]}>
                {currentEp}{totalDisplay ? ` / ${totalDisplay}` : ""}話
              </Text>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? "#2A2A2D" : "#F0F0F5" }, !content.prev_number && { opacity: 0.3 }]}
                onPress={() => content.prev_number && setCurrentEp(content.prev_number)}
                disabled={!content.prev_number}
              >
                <Text style={[styles.navBtnText, { color: accentColor }]}>
                  {content.prev_number ? `${content.prev_number}話 →` : "―"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? "#2A2A2D" : "#F0F0F5" }, !content.prev_number && { opacity: 0.3 }]}
                onPress={() => content.prev_number && setCurrentEp(content.prev_number)}
                disabled={!content.prev_number}
              >
                <Text style={[styles.navBtnText, { color: accentColor }]}>
                  {content.prev_number ? `← ${content.prev_number}話` : "―"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.epText, { color: textSub }]}>
                {currentEp}{totalDisplay ? ` / ${totalDisplay}` : ""}話
              </Text>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: isDark ? "#2A2A2D" : "#F0F0F5" }, !content.next_number && { opacity: 0.3 }]}
                onPress={() => content.next_number && setCurrentEp(content.next_number)}
                disabled={!content.next_number}
              >
                <Text style={[styles.navBtnText, { color: accentColor }]}>
                  {content.next_number ? `${content.next_number}話 →` : "―"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================
// Utilities
// ============================================================

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 段落先頭の全角スペース・半角スペースを除去 */
function stripLeadingSpaces(html: string): string {
  return html.replace(/(>)\s*[　\s]+/g, "$1");
}

/**
 * 縦中横 (Tate-Chu-Yoko) 変換 + HTML変換
 * Web版 tcy.ts の仕様を再現:
 * - 1~2桁の半角数字 → <span class="tcy">
 * - !? 等の2文字連続 → <span class="tcy">
 */
function transformForVertical(html: string): string {
  // Split into tags and text segments
  return html.split(/(<[^>]*>)/).map(segment => {
    if (segment.startsWith("<")) return segment;
    // 1-2 digit numbers
    let result = segment.replace(
      /(?<![0-9a-zA-Z])([0-9]{1,2})(?![0-9a-zA-Z])/g,
      '<span class="tcy">$1</span>'
    );
    // !? marks combination
    result = result.replace(
      /([!?！？]{2})/g,
      '<span class="tcy">$1</span>'
    );
    return result;
  }).join("");
}

// ============================================================
// Inline TTS Player (header-right)
// ============================================================

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function InlinePlayer({ bodyHtml, isDark, accentColor, textSub }: { bodyHtml: string; isDark: boolean; accentColor: string; textSub: string }) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [rate, setRate] = useState(1.0);

  useEffect(() => {
    const unsub = speechEngine.subscribe((state) => { setStatus(state.status); });
    return unsub;
  }, []);

  useEffect(() => { return () => { speechEngine.stop(); }; }, []);

  const handlePlayPause = () => {
    if (status === "idle") speechEngine.speak(bodyHtml);
    else if (status === "playing") speechEngine.pause();
    else if (status === "paused") speechEngine.resume();
  };

  const cycleRate = () => {
    const idx = RATE_OPTIONS.indexOf(rate);
    const next = RATE_OPTIONS[(idx + 1) % RATE_OPTIONS.length];
    setRate(next);
    speechEngine.setRate(next);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <TouchableOpacity onPress={handlePlayPause} style={{ padding: 6 }}>
        <Text style={{ fontSize: 14, color: status === "playing" ? accentColor : textSub }}>
          {status === "playing" ? "⏸" : "▶"}
        </Text>
      </TouchableOpacity>
      {status !== "idle" && (
        <TouchableOpacity onPress={() => speechEngine.stop()} style={{ padding: 6 }}>
          <Text style={{ fontSize: 12, color: textSub }}>■</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={cycleRate} style={{ backgroundColor: isDark ? "#3A3A3D" : "#E5E5EA", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
        <Text style={{ fontSize: 9, fontWeight: "600", color: textSub }}>{rate}x</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFF",
  },
  headerBtn: { padding: 8 },
  backText: { fontSize: 16, color: "#6366F1" },
  headerTitle: { flex: 1, fontSize: 12, color: "#5A5A5E", textAlign: "center", marginHorizontal: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  webview: { flex: 1, backgroundColor: "#FAFAFA" },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: "#E5E5EA", backgroundColor: "#FFF",
  },
  navBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#F0F0F5" },
  navBtnText: { fontSize: 12, fontWeight: "600", color: "#6366F1" },
  epText: { fontSize: 11, color: "#8E8E93" },
});
