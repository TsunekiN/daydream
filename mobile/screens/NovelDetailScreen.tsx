import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from "react-native";
import Slider from "./Slider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { getNovelInfo } from "../lib/api";
import { cleanTitle } from "../lib/utils";
import { addFavorite, removeFavorite, isFavorite as checkIsFavorite, getFavorites } from "../lib/storage";
import { useTheme } from "../lib/ThemeContext";
import type { NovelInfo, SiteMode } from "../lib/types";

type Props = NativeStackScreenProps<RootStackParamList, "NovelDetail">;

export default function NovelDetailScreen({ route, navigation }: Props) {
  const { ncode, site } = route.params;
  const { colors } = useTheme();

  // 戻るボタンを常にお気に入りリストへ
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ padding: 8 }}>
          <Text style={{ fontSize: 16, color: colors.accent }}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);
  const [info, setInfo] = useState<NovelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [selectedEp, setSelectedEp] = useState(1);
  const [lastRead, setLastRead] = useState(0);

  useEffect(() => { loadData(); }, [ncode, site]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [novelInfo, favStatus] = await Promise.all([
        getNovelInfo(ncode, site as SiteMode),
        checkIsFavorite(ncode.toUpperCase(), site),
      ]);
      setInfo(novelInfo);
      setIsFav(favStatus);

      const favs = await getFavorites();
      const fav = favs.find(f => f.ncode === ncode.toUpperCase() && f.site === site);
      const lr = fav?.lastReadEpisode ?? 0;
      setLastRead(lr);
      setSelectedEp(lr > 0 ? Math.min(lr + 1, novelInfo.general_all_no || 1) : 1);
    } catch {} finally { setLoading(false); }
  };

  const toggleFav = async () => {
    if (!info) return;
    if (isFav) { await removeFavorite(ncode.toUpperCase(), site); setIsFav(false); }
    else {
      await addFavorite({ ncode: ncode.toUpperCase(), site: site as SiteMode, title: info.title, writer: info.writer, story: info.story, addedAt: new Date().toISOString(), totalEpisodes: info.general_all_no, lastUpdated: info.novelupdated_at });
      setIsFav(true);
    }
  };

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  if (!info) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>作品が見つかりません</Text></View>;

  const totalEp = info.general_all_no;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Site badge + Favorite */}
      <View style={styles.topRow}>
        <View style={[styles.badge, site === "nocturne" ? styles.badgeR18 : styles.badgeNarou]}>
          <Text style={[styles.badgeText, site === "nocturne" ? styles.badgeR18Text : styles.badgeNarouText]}>
            {site === "nocturne" ? "ノクターン" : "なろう"}
          </Text>
        </View>
        <TouchableOpacity style={[styles.favIcon, { backgroundColor: isFav ? "rgba(99,102,241,0.1)" : colors.border }]} onPress={toggleFav}>
          <Text style={[styles.favIconText, { color: isFav ? colors.accent : colors.textMuted }]}>{isFav ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </View>

      {/* Title & Author */}
      <Text style={[styles.title, { color: colors.text }]}>{cleanTitle(info.title)}</Text>
      <Text style={[styles.writer, { color: colors.textSub }]}>{info.writer}</Text>
      {info.novelupdated_at && <Text style={[styles.updatedAt, { color: colors.textMuted }]}>更新: {info.novelupdated_at.split(" ")[0]}</Text>}

      {/* Story */}
      {info.story ? (
        <View style={[styles.storyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.story, { color: colors.textSub }]} numberOfLines={8}>{info.story}</Text>
        </View>
      ) : null}

      {/* Meta */}
      {info.keyword ? <Text style={[styles.keywords, { color: colors.textMuted }]} numberOfLines={2}>{info.keyword}</Text> : null}

      {/* Episode navigator */}
      {totalEp > 0 && (
        <View style={[styles.epNavCard, { backgroundColor: colors.card }]}>
          <View style={styles.epNavHeader}>
            <Text style={[styles.epNavTitle, { color: colors.text }]}>話数を選択</Text>
            {lastRead > 0 && <Text style={[styles.progressText, { color: colors.accent }]}>📖 {lastRead}/{totalEp}話 読了</Text>}
          </View>
          <View style={styles.epInputRow}>
            <TextInput
              style={[styles.epInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={String(selectedEp)}
              onChangeText={(t) => {
                const v = Math.max(1, Math.min(totalEp, parseInt(t) || 1));
                setSelectedEp(v);
              }}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Text style={[styles.epInputLabel, { color: colors.textMuted }]}>/ {totalEp}話</Text>
          </View>
          {totalEp > 1 && (
            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>1</Text>
              <View style={styles.sliderContainer}>
                <Slider min={1} max={totalEp} value={selectedEp} onValueChange={setSelectedEp} />
              </View>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>{totalEp}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.readBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate("Reader", { ncode, episode: selectedEp, site })}>
            <Text style={styles.readBtnText}>第{selectedEp}話を読む</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Short story */}
      {totalEp <= 1 && (
        <TouchableOpacity style={[styles.readBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate("Reader", { ncode, episode: 0, site })}>
          <Text style={styles.readBtnText}>読む</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F8" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F8" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeNarou: { backgroundColor: "rgba(99,102,241,0.1)" },
  badgeR18: { backgroundColor: "rgba(239,68,68,0.1)" },
  badgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  badgeNarouText: { color: "#6366F1" },
  badgeR18Text: { color: "#EF4444" },
  favIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0F5", alignItems: "center", justifyContent: "center" },
  favIconActive: { backgroundColor: "rgba(99,102,241,0.1)" },
  favIconText: { fontSize: 18, color: "#8E8E93" },
  favIconTextActive: { color: "#6366F1" },
  title: { fontSize: 20, fontWeight: "700", color: "#111113", marginBottom: 6, lineHeight: 28 },
  writer: { fontSize: 14, color: "#5A5A5E", marginBottom: 4 },
  updatedAt: { fontSize: 11, color: "#8E8E93", marginBottom: 12 },
  storyCard: { backgroundColor: "#FFF", borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  story: { fontSize: 12, color: "#3A3A3C", lineHeight: 20 },
  keywords: { fontSize: 10, color: "#8E8E93", marginBottom: 16 },
  epNavCard: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, elevation: 1 },
  epNavHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  epNavTitle: { fontSize: 11, fontWeight: "700", color: "#111113", letterSpacing: 1 },
  progressText: { fontSize: 11, fontWeight: "600", color: "#6366F1" },
  epInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  epInput: { width: 64, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#F5F5F8", borderRadius: 8, borderWidth: 1, borderColor: "#E5E5EA", fontSize: 14, fontWeight: "700", textAlign: "center", color: "#111113" },
  epInputLabel: { fontSize: 11, color: "#8E8E93" },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sliderContainer: { flex: 1 },
  sliderLabel: { fontSize: 10, color: "#8E8E93" },
  readBtn: { backgroundColor: "#6366F1", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  readBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
