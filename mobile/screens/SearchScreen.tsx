import { useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { searchNovels, formatNumber, formatLength, cleanTitle } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import type { NovelMeta, SiteMode } from "../lib/types";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "hyoka", label: "総合評価" },
  { key: "favnovelcnt", label: "ブクマ数" },
  { key: "reviewcnt", label: "レビュー" },
  { key: "weekly", label: "週間pt" },
  { key: "daily", label: "日間pt" },
  { key: "monthlypoint", label: "月間pt" },
  { key: "new", label: "新着" },
];

const GENRE_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: "全ジャンル" },
  { value: 101, label: "異世界〔恋愛〕" },
  { value: 102, label: "現実世界〔恋愛〕" },
  { value: 201, label: "ハイファンタジー" },
  { value: 202, label: "ローファンタジー" },
  { value: 301, label: "純文学" },
  { value: 302, label: "ヒューマンドラマ" },
  { value: 303, label: "歴史" },
  { value: 304, label: "推理" },
  { value: 305, label: "ホラー" },
  { value: 306, label: "アクション" },
  { value: 307, label: "コメディー" },
  { value: 401, label: "VRゲーム" },
  { value: 402, label: "宇宙" },
  { value: 403, label: "空想科学" },
  { value: 404, label: "パニック" },
  { value: 9901, label: "童話" },
  { value: 9902, label: "詩" },
  { value: 9903, label: "エッセイ" },
  { value: 9904, label: "その他" },
];

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NovelMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<SiteMode>("narou");
  const [allcount, setAllcount] = useState(0);
  const [order, setOrder] = useState("hyoka");
  const [genre, setGenre] = useState<number | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const { colors, settings } = useTheme();

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true); setError(null);
    try {
      const notbl = settings?.excludePreset !== "none";
      const notgl = settings?.excludePreset !== "none";
      const result = await searchNovels({
        word: query.trim() || undefined,
        genre,
        order,
        limit: 30,
        notbl,
        notgl,
      }, site);
      setResults(result.novels); setAllcount(result.allcount);
    } catch (e) { setError(e instanceof Error ? e.message : "検索に失敗しました"); setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Site toggle */}
      <View style={styles.siteToggle}>
        <TouchableOpacity style={[styles.siteBtn, { backgroundColor: colors.border }, site === "narou" && { backgroundColor: colors.accent }]} onPress={() => setSite("narou")}>
          <Text style={[styles.siteBtnText, { color: colors.textSub }, site === "narou" && styles.siteBtnTextActive]}>なろう</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.siteBtn, { backgroundColor: colors.border }, site === "nocturne" && { backgroundColor: colors.accent }]} onPress={() => setSite("nocturne")}>
          <Text style={[styles.siteBtnText, { color: colors.textSub }, site === "nocturne" && styles.siteBtnTextActive]}>ノクターン</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Text style={[styles.filterToggle, { color: colors.accent }]}>{showFilters ? "▲ フィルタ" : "▼ フィルタ"}</Text>
        </TouchableOpacity>
      </View>

      {/* Search inputs */}
      <View style={styles.searchBar}>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="タイトル・作者名・キーワード" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.accent }]} onPress={handleSearch}><Text style={styles.searchBtnText}>検索</Text></TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          {/* Genre (narou only) */}
          {site === "narou" && (
            <View>
              <Text style={styles.filterLabel}>ジャンル</Text>
              <View style={styles.chipWrap}>
                {GENRE_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g.label}
                    style={[styles.chip, genre === g.value && styles.chipActive]}
                    onPress={() => setGenre(g.value)}
                  >
                    <Text style={[styles.chipText, genre === g.value && styles.chipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sort */}
          <View>
            <Text style={styles.filterLabel}>ソート順</Text>
            <View style={styles.chipWrap}>
              {SORT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, order === s.key && styles.chipActive]}
                  onPress={() => setOrder(s.key)}
                >
                  <Text style={[styles.chipText, order === s.key && styles.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Loading / Error / Count */}
      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ padding: 40 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && results.length > 0 && <Text style={[styles.count, { color: colors.textMuted }]}>{allcount.toLocaleString()}件中 {results.length}件表示</Text>}

      {/* Results */}
      {!loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.ncode}
          contentContainerStyle={{ padding: 12, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate("NovelDetail", { ncode: item.ncode, site })}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{cleanTitle(item.title)}</Text>
              <Text style={[styles.cardWriter, { color: colors.accent }]}>{item.writer}</Text>
              <Text style={[styles.cardStory, { color: colors.textSub }]} numberOfLines={3}>{item.story}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.stat, { color: colors.textMuted }]}>{item.general_all_no}話</Text>
                <Text style={[styles.stat, { color: colors.textMuted }]}>{formatLength(item.length)}</Text>
                <Text style={[styles.stat, { color: colors.textMuted }]}>♥{formatNumber(item.fav_novel_cnt)}</Text>
                <Text style={[styles.stat, { color: colors.textMuted }]}>pt{formatNumber(item.global_point)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F8" },
  siteToggle: { flexDirection: "row", alignItems: "center", padding: 12, paddingBottom: 0, gap: 8 },
  siteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E5E5EA" },
  siteBtnActive: { backgroundColor: "#6366F1" },
  siteBtnText: { fontSize: 13, fontWeight: "500", color: "#5A5A5E" },
  siteBtnTextActive: { color: "#FFF" },
  filterToggle: { fontSize: 11, color: "#6366F1", fontWeight: "600" },
  searchBar: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  input: { flex: 1, backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#111113", borderWidth: 1, borderColor: "#E5E5EA" },
  searchBtn: { backgroundColor: "#6366F1", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  searchBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  filters: { paddingHorizontal: 12, paddingTop: 8, gap: 10 },
  filterLabel: { fontSize: 11, fontWeight: "700", color: "#5A5A5E", marginBottom: 6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#E5E5EA" },
  chipActive: { backgroundColor: "#6366F1" },
  chipText: { fontSize: 11, fontWeight: "500", color: "#5A5A5E" },
  chipTextActive: { color: "#FFF" },
  errorText: { fontSize: 14, color: "#DC2626", textAlign: "center", padding: 16 },
  count: { fontSize: 12, color: "#8E8E93", paddingHorizontal: 16, paddingTop: 8 },
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111113", marginBottom: 4 },
  cardWriter: { fontSize: 12, color: "#6366F1", marginBottom: 6 },
  cardStory: { fontSize: 12, color: "#5A5A5E", lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: "row", gap: 12 },
  stat: { fontSize: 11, color: "#8E8E93" },
});
