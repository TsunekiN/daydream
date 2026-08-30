export type SiteMode = "narou" | "nocturne";

export interface SearchParams {
  word?: string;
  keyword?: string;
  writer?: string;
  genre?: number;
  order?: string;
  limit?: number;
  st?: number;
  /** 除外フィルタプリセット */
  excludePreset?: "none" | "light" | "medium" | "strong";
}

export interface SearchResult {
  allcount: number;
  novels: NovelMeta[];
}

export interface NovelMeta {
  ncode: string;
  title: string;
  writer: string;
  story: string;
  genre: number;
  keyword: string;
  general_all_no: number;
  length: number;
  fav_novel_cnt: number;
  review_cnt: number;
  all_point: number;
  daily_point: number;
  weekly_point: number;
  monthly_point: number;
  global_point: number;
  novelupdated_at: string;
}

export type NovelInfo = Pick<NovelMeta, "ncode" | "title" | "writer" | "story" | "genre" | "keyword" | "general_all_no" | "novelupdated_at">;

export interface TocEntry {
  number: number;
  title: string;
  chapter: string;
}

export interface EpisodeContent {
  subtitle: string;
  body_html: string;
  prev_number: number | null;
  next_number: number | null;
  total_episodes: number;
}

export interface FavoriteNovel {
  ncode: string;
  site: SiteMode;
  title: string;
  writer: string;
  story?: string;
  addedAt: string;
  lastUpdated?: string;
  lastReadEpisode?: number;
  totalEpisodes?: number;
}
