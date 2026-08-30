import { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { RootStackParamList } from "../App";
import { getEpisodeContent } from "../lib/api";
import { updateReadingProgress, saveScrollPosition, getScrollPosition, saveLastOpened, getFavorites } from "../lib/storage";
import { getCachedEpisode, cacheEpisode } from "../lib/cache";
import { useTheme } from "../lib/ThemeContext";
import { generateReaderHtml } from "../lib/readerHtml";
import type { EpisodeContent, SiteMode } from "../lib/types";
import InlinePlayer from "./InlinePlayer";

type Props = NativeStackScreenProps<RootStackParamList, "Reader">;

export default function ReaderScreen({ route, navigation }: Props) {
  const { ncode, episode, site } = route.params;
  const { isDark, colors, settings } = useTheme();

  const [content, setContent] = useState<EpisodeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEp, setCurrentEp] = useState(episode);
  const [knownTotal, setKnownTotal] = useState(0);

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
      // キャッシュを確認（subtitle と body_html が有効な場合のみ使用）
      const cached = await getCachedEpisode(ncode, ep, site);
      if (cached && cached.subtitle && cached.body_html && cached.body_html.length > 50) {
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

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "reachedEnd") {
        updateReadingProgress(ncode.toUpperCase(), site, currentEp, content?.total_episodes || undefined);
      } else if (msg.type === "scroll") {
        if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
        scrollSaveTimer.current = setTimeout(() => {
          saveScrollPosition(ncode, site, currentEp, msg.position);
        }, 500);
      } else if (msg.type === "nextEpisode") {
        if (content?.next_number) setCurrentEp(content.next_number);
      } else if (msg.type === "prevEpisode") {
        if (content?.prev_number) setCurrentEp(content.prev_number);
      }
    } catch {}
  };

  const html = content
    ? generateReaderHtml({
        subtitle: content.subtitle,
        bodyHtml: content.body_html,
        reader: settings.reader,
        isDark,
      })
    : "";

  const accentColor = colors.accent;
  const totalDisplay = content?.total_episodes || knownTotal;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: back + title + TTS controls */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate("NovelDetail", { ncode, site })} style={styles.headerBtn}>
          <Text style={[styles.backText, { color: accentColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSub }]} numberOfLines={1}>
          {content?.subtitle || `第${currentEp}話`}
        </Text>
        {content && !loading && !error && (
          <InlinePlayer bodyHtml={content.body_html} isDark={isDark} accentColor={accentColor} textSub={colors.textMuted} />
        )}
      </View>

      {/* Content */}
      {loading && <View style={styles.center}><ActivityIndicator size="large" color={accentColor} /></View>}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: "#DC2626", marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchContent(currentEp)}>
            <Text style={{ color: accentColor }}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}
      {content && !loading && !error && (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          style={[styles.webview, { backgroundColor: colors.background }]}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          javaScriptEnabled={true}
          onMessage={handleWebViewMessage}
        />
      )}

      {/* Footer */}
      {content && !loading && !error && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
              <Text style={[styles.epText, { color: colors.textMuted }]}>
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
              <Text style={[styles.epText, { color: colors.textMuted }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  headerBtn: { padding: 8 },
  backText: { fontSize: 16 },
  headerTitle: { flex: 1, fontSize: 12, textAlign: "center", marginHorizontal: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  webview: { flex: 1 },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  navBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  navBtnText: { fontSize: 12, fontWeight: "600" },
  epText: { fontSize: 11 },
});
