import type { SiteMode } from "./novel";

export interface NovelInfo {
  ncode: string;
  title: string;
  writer: string;
  story: string;
  genre: number;
  keyword: string;
  general_all_no: number;
  novelupdated_at: string;
}

export interface EpisodeContent {
  ncode: string;
  number: number;
  subtitle: string;
  body_html: string;
  prev_number: number | null;
  next_number: number | null;
  total_episodes: number;
}

export type AppView =
  | { type: "home"; tab: "favorites" | "search" }
  | { type: "info"; ncode: string; site: SiteMode }
  | { type: "reader"; ncode: string; episode: number; site: SiteMode }
  | { type: "settings" };
