import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { loadSettings, saveSettings, type AppSettings, DEFAULT_SETTINGS } from "./settings";

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSub: string;
  textMuted: string;
  border: string;
  accent: string;
  inputBg: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateReaderSettings: (patch: Partial<AppSettings["reader"]>) => void;
}

const LIGHT: ThemeColors = {
  background: "#F5F5F8",
  card: "#FFFFFF",
  text: "#111113",
  textSub: "#5A5A5E",
  textMuted: "#8E8E93",
  border: "#E5E5EA",
  accent: "#6366F1",
  inputBg: "#FFFFFF",
};

const DARK: ThemeColors = {
  background: "#1A1A1D",
  card: "#232326",
  text: "#F0F0F0",
  textSub: "#A0A0A5",
  textMuted: "#6E6E73",
  border: "#3A3A3D",
  accent: "#818CF8",
  inputBg: "#2A2A2D",
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LIGHT,
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  updateReaderSettings: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const systemScheme = useColorScheme();

  useEffect(() => { loadSettings().then(setSettings); }, []);

  const isDark = settings.theme === "dark" || (settings.theme === "system" && systemScheme === "dark");
  const colors = isDark ? DARK : LIGHT;

  const updateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const updateReaderSettings = (patch: Partial<AppSettings["reader"]>) => {
    updateSettings({ reader: { ...settings.reader, ...patch } });
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, settings, updateSettings, updateReaderSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
