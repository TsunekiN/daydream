import { useCallback, useState } from "react";
import type { NovelMeta, RankingResponse, ExcludeFilters, SiteMode } from "@/types/novel";

export type SearchOrder =
  | "hyoka"
  | "favnovelcnt"
  | "reviewcnt"
  | "dailypoint"
  | "weeklypoint"
  | "monthlypoint"
  | "ncodedesc"
  | "old";

export const SEARCH_ORDER_LABELS: Record<SearchOrder, string> = {
  hyoka: "総合評価",
  favnovelcnt: "ブクマ数",
  reviewcnt: "レビュー数",
  dailypoint: "日間pt",
  weeklypoint: "週間pt",
  monthlypoint: "月間pt",
  ncodedesc: "新着",
  old: "古い順",
};

export interface SearchParams {
  word?: string;
  keyword?: string;
  writer?: string;
  genre?: number | null;
  order?: SearchOrder;
  limit?: number;
  exclude?: ExcludeFilters;
  site?: SiteMode;
}

interface UseSearchResult {
  novels: NovelMeta[];
  allcount: number;
  isLoading: boolean;
  error: string | null;
  search: (params: SearchParams) => void;
  hasSearched: boolean;
}

export function useSearch(): UseSearchResult {
  const [novels, setNovels] = useState<NovelMeta[]>([]);
  const [allcount, setAllcount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    const site = params.site ?? "narou";

    const qs = new URLSearchParams();
    if (params.word) qs.set("word", params.word);
    if (params.keyword) qs.set("keyword", params.keyword);
    if (params.writer) qs.set("writer", params.writer);
    if (params.genre && site === "narou") qs.set("genre", params.genre.toString());
    if (params.order) qs.set("order", params.order);
    qs.set("limit", (params.limit ?? 20).toString());

    // 除外フィルタ
    if (params.exclude?.notbl) qs.set("notbl", "true");
    if (params.exclude?.notgl) qs.set("notgl", "true");
    if (params.exclude?.notword) qs.set("notword", params.exclude.notword);

    if (site === "narou") {
      if (params.exclude?.notgenre) qs.set("notgenre", params.exclude.notgenre);
      if (params.exclude?.notbiggenre) qs.set("notbiggenre", params.exclude.notbiggenre);
    }

    const endpoint = site === "nocturne" ? "/api/nocturne/search" : "/api/narou/search";

    try {
      const resp = await fetch(`${endpoint}?${qs}`);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `API Error: ${resp.status}`);
      }
      const data: RankingResponse = await resp.json();
      // クライアントサイド除外フィルタ
      let filtered = data.novels;
      if (params.exclude?.clientExcludeWords && params.exclude.clientExcludeWords.length > 0) {
        const words = params.exclude.clientExcludeWords;
        filtered = filtered.filter((novel) => {
          const target = novel.story + novel.title + novel.keyword;
          return !words.some((w) => target.includes(w));
        });
      }
      if (params.exclude?.clientScoreFilter) {
        const { words, threshold } = params.exclude.clientScoreFilter;
        filtered = filtered.filter((novel) => {
          const target = novel.story + novel.title + novel.keyword;
          let score = 0;
          for (const { word, score: s } of words) {
            if (target.includes(word)) score += s;
            if (score >= threshold) return false;
          }
          return true;
        });
      }
      setNovels(filtered);
      setAllcount(data.allcount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setNovels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { novels, allcount, isLoading, error, search, hasSearched };
}
