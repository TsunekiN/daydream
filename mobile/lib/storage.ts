import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FavoriteNovel } from "./types";

const FAVORITES_KEY = "@daydream/favorites";

export async function getFavorites(): Promise<FavoriteNovel[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!json) return [];
    return JSON.parse(json) as FavoriteNovel[];
  } catch { return []; }
}

export async function addFavorite(novel: FavoriteNovel): Promise<void> {
  const favorites = await getFavorites();
  const idx = favorites.findIndex(f => f.ncode === novel.ncode && f.site === novel.site);
  if (idx >= 0) favorites[idx] = { ...favorites[idx], ...novel };
  else favorites.unshift(novel);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function removeFavorite(ncode: string, site: string): Promise<void> {
  const favorites = await getFavorites();
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.filter(f => !(f.ncode === ncode && f.site === site))));
}

export async function isFavorite(ncode: string, site: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.ncode === ncode && f.site === site);
}

export async function updateReadingProgress(ncode: string, site: string, episode: number, totalEpisodes?: number): Promise<void> {
  const favorites = await getFavorites();
  const idx = favorites.findIndex(f => f.ncode === ncode && f.site === site);
  if (idx >= 0) {
    favorites[idx].lastReadEpisode = episode;
    if (totalEpisodes !== undefined) favorites[idx].totalEpisodes = totalEpisodes;
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// ============================================================
// スクロール位置保存
// ============================================================

const SCROLL_KEY = "@daydream/scroll-positions";
const LAST_OPENED_KEY = "@daydream/last-opened";

/** 最後に開いていたエピソードを保存 */
export async function saveLastOpened(ncode: string, site: string, episode: number): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(LAST_OPENED_KEY);
    const data: Record<string, number> = json ? JSON.parse(json) : {};
    data[`${site}:${ncode.toLowerCase()}`] = episode;
    await AsyncStorage.setItem(LAST_OPENED_KEY, JSON.stringify(data));
  } catch {}
}

/** 最後に開いていたエピソードを取得 */
export async function getLastOpened(ncode: string, site: string): Promise<number | null> {
  try {
    const json = await AsyncStorage.getItem(LAST_OPENED_KEY);
    if (!json) return null;
    const data: Record<string, number> = JSON.parse(json);
    return data[`${site}:${ncode.toLowerCase()}`] ?? null;
  } catch { return null; }
}

/** スクロール位置を保存 */
export async function saveScrollPosition(ncode: string, site: string, episode: number, position: number): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(SCROLL_KEY);
    const data: Record<string, number> = json ? JSON.parse(json) : {};
    data[`${site}:${ncode.toLowerCase()}:${episode}`] = position;
    await AsyncStorage.setItem(SCROLL_KEY, JSON.stringify(data));
  } catch {}
}

/** スクロール位置を取得 */
export async function getScrollPosition(ncode: string, site: string, episode: number): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(SCROLL_KEY);
    if (!json) return 0;
    const data: Record<string, number> = JSON.parse(json);
    return data[`${site}:${ncode.toLowerCase()}:${episode}`] ?? 0;
  } catch { return 0; }
}
