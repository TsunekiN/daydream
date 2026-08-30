import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReaderFontFamily = "mincho" | "gothic" | "system";
export type ReaderFontSize = "sm" | "md" | "lg" | "xl";

export interface ReaderSettings {
  fontFamily: ReaderFontFamily;
  fontSize: ReaderFontSize;
  lineHeight: number;       // 1.5 ~ 3.0
  letterSpacing: number;    // 0 ~ 0.15 (em)
  layout: "vertical" | "horizontal";
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  reader: ReaderSettings;
  excludePreset: "none" | "light" | "medium" | "strong";
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  reader: {
    fontFamily: "mincho",
    fontSize: "md",
    lineHeight: 2.2,
    letterSpacing: 0.08,
    layout: "vertical",
  },
  excludePreset: "strong",
};

export const FONT_FAMILY_OPTIONS: Record<ReaderFontFamily, { label: string; css: string }> = {
  mincho: { label: "明朝体", css: '"Yu Mincho", "游明朝", "Hiragino Mincho ProN", serif' },
  gothic: { label: "ゴシック体", css: '"Yu Gothic", "游ゴシック", "Hiragino Kaku Gothic ProN", sans-serif' },
  system: { label: "システム", css: 'system-ui, sans-serif' },
};

export const FONT_SIZE_OPTIONS: Record<ReaderFontSize, { label: string; px: number }> = {
  sm: { label: "小", px: 14 },
  md: { label: "中", px: 16 },
  lg: { label: "大", px: 18 },
  xl: { label: "特大", px: 21 },
};

export const EXCLUDE_PRESETS = {
  none: { label: "なし" },
  light: { label: "BL/GL除外" },
  medium: { label: "恋愛除外" },
  strong: { label: "強力除外" },
};

const SETTINGS_KEY = "@daydream/settings";

export async function loadSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    const saved = JSON.parse(json);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      reader: { ...DEFAULT_SETTINGS.reader, ...(saved.reader ?? {}) },
    };
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
