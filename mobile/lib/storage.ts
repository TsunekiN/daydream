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
