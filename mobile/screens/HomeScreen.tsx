import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Animated } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { getFavorites, getLastOpened, removeFavorite } from "../lib/storage";
import { cleanTitle } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import type { FavoriteNovel } from "../lib/types";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr.split(" ")[0];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState<FavoriteNovel[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    const favs = await getFavorites();
    // 最終更新日が新しい順にソート
    favs.sort((a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""));
    setFavorites(favs);
  }, []);

  useFocusEffect(useCallback(() => { loadFavorites(); }, [loadFavorites]));

  const onRefresh = async () => { setRefreshing(true); await loadFavorites(); setRefreshing(false); };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => `${item.site}-${item.ncode}`}
        renderItem={({ item }) => {
          const renderRightActions = () => (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert("削除", `「${item.title}」を削除しますか？`, [
                  { text: "キャンセル", style: "cancel" },
                  { text: "削除", style: "destructive", onPress: async () => { await removeFavorite(item.ncode, item.site); loadFavorites(); }},
                ]);
              }}
            >
              <Text style={styles.deleteBtnText}>削除</Text>
            </TouchableOpacity>
          );

          return (
            <Swipeable renderRightActions={renderRightActions} overshootRight={false} rightThreshold={40}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                activeOpacity={1}
                onPress={async () => {
                  const lastOpened = await getLastOpened(item.ncode, item.site);
                  if (lastOpened && lastOpened > 0) {
                    navigation.navigate("Reader", { ncode: item.ncode, episode: lastOpened, site: item.site });
                  } else if (item.lastReadEpisode && item.lastReadEpisode > 0) {
                    navigation.navigate("Reader", { ncode: item.ncode, episode: item.lastReadEpisode + 1, site: item.site });
                  } else {
                    navigation.navigate("NovelDetail", { ncode: item.ncode, site: item.site });
                  }
                }}
              >
            <Text style={[styles.cardUpdated, { color: colors.textMuted }]}>{formatDate(item.lastUpdated || item.addedAt)} 更新</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{cleanTitle(item.title)}</Text>
            <View style={styles.cardRow}>
              <Text style={[styles.cardWriter, { color: colors.textSub }]} numberOfLines={1}>{item.writer}</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.lastReadEpisode ?? 0}/{item.totalEpisodes ?? "?"}話</Text>
            </View>
          </TouchableOpacity>
          </Swipeable>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>お気に入りがありません</Text>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>検索画面から作品を見つけて{"\n"}お気に入りに追加しましょう</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate("Search")}>
              <Text style={styles.btnText}>検索する</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={favorites.length === 0 ? { flex: 1 } : { padding: 12, paddingBottom: 72 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate("Search")}>
        <Text style={styles.fabText}>検索</Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F8" },
  card: { backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, elevation: 1 },
  cardUpdated: { fontSize: 9, marginBottom: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111113", marginBottom: 2 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardWriter: { fontSize: 12, color: "#5A5A5E", flex: 1 },
  cardMeta: { fontSize: 11, color: "#8E8E93" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#111113", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#5A5A5E", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: "#6366F1", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  fab: { position: "absolute", bottom: 48, right: 24, backgroundColor: "#6366F1", borderRadius: 28, width: 56, height: 56, alignItems: "center", justifyContent: "center", elevation: 6 },
  fabText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  deleteBtn: { backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center", width: 72, borderRadius: 10, marginBottom: 6, marginLeft: 8 },
  deleteBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
});
