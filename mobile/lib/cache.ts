/**
 * エピソード本文キャッシュ（最新10話分）
 * AsyncStorage に保存。LRU方式で古いものから削除。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EpisodeContent } from "./types";

const CACHE_KEY = "@daydream/episode-cache";
const MAX_ENTRIES = 10;

interface CacheEntry {
  key: string; // "site:ncode:episode"
  data: EpisodeContent;
  timestamp: number;
}

function makeKey(ncode: string, episode: number, site: string): string {
  return `${site}:${ncode.toLowerCase()}:${episode}`;
}

async function loadCache(): Promise<CacheEntry[]> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (!json) return [];
    return JSON.parse(json) as CacheEntry[];
  } catch { return []; }
}

async function saveCache(entries: CacheEntry[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));
}

/** キャッシュから取得（なければ null） */
export async function getCachedEpisode(ncode: string, episode: number, site: string): Promise<EpisodeContent | null> {
  const entries = await loadCache();
  const key = makeKey(ncode, episode, site);
  const entry = entries.find(e => e.key === key);
  return entry?.data ?? null;
}

/** キャッシュに保存（LRU: 最新10件のみ保持） */
export async function cacheEpisode(ncode: string, episode: number, site: string, data: EpisodeContent): Promise<void> {
  const entries = await loadCache();
  const key = makeKey(ncode, episode, site);

  // 既存エントリを除去
  const filtered = entries.filter(e => e.key !== key);

  // 先頭に追加
  filtered.unshift({ key, data, timestamp: Date.now() });

  // 上限を超えたら古いものを削除
  const trimmed = filtered.slice(0, MAX_ENTRIES);

  await saveCache(trimmed);
}
