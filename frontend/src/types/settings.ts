/**
 * アプリ設定の型定義
 */

export type Theme = "light" | "dark" | "system";

export type ReaderLayout = "vertical" | "horizontal";

export type ReaderFontFamily = "mincho" | "gothic" | "system";

export type ReaderFontSize = "sm" | "md" | "lg" | "xl";

export interface ReaderSettings {
  layout: ReaderLayout;
  fontFamily: ReaderFontFamily;
  fontSize: ReaderFontSize;
  lineHeight: number;       // 1.5 ~ 3.0
  letterSpacing: number;    // 0 ~ 0.15 (em)
}

export type PerPage = 20 | 50 | 100;

export interface AppSettings {
  theme: Theme;
  excludePreset: string;    // ExcludePreset key
  reader: ReaderSettings;
  perPage: PerPage;
  skipTocOnContinue: boolean; // お気に入りから続きを直接開く
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  layout: "vertical",
  fontFamily: "mincho",
  fontSize: "md",
  lineHeight: 2.2,
  letterSpacing: 0.08,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  excludePreset: "strong",
  reader: DEFAULT_READER_SETTINGS,
  perPage: 20,
  skipTocOnContinue: true,
};

export const FONT_FAMILY_OPTIONS: Record<ReaderFontFamily, { label: string; css: string }> = {
  mincho: {
    label: "明朝体",
    css: '"Yu Mincho", "游明朝", "Hiragino Mincho ProN", "ヒラギノ明朝 ProN", serif',
  },
  gothic: {
    label: "ゴシック体",
    css: '"Yu Gothic", "游ゴシック", "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN", sans-serif',
  },
  system: {
    label: "システム",
    css: 'var(--font-sans)',
  },
};

export const FONT_SIZE_OPTIONS: Record<ReaderFontSize, { label: string; class: string }> = {
  sm: { label: "小", class: "text-xs md:text-base" },
  md: { label: "中", class: "text-sm md:text-lg" },
  lg: { label: "大", class: "text-base md:text-xl" },
  xl: { label: "特大", class: "text-lg md:text-2xl" },
};
