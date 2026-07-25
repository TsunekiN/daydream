import { useCallback, useEffect, useState } from "react";
import type { AppSettings, ReaderSettings, Theme } from "@/types/settings";
import { DEFAULT_APP_SETTINGS } from "@/types/settings";
import type { ExcludePreset } from "@/types/novel";

const STORAGE_KEY = "daydream-settings";

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_APP_SETTINGS, ...parsed, reader: { ...DEFAULT_APP_SETTINGS.reader, ...parsed.reader } };
    }
  } catch {
    // ignore
  }
  return DEFAULT_APP_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  // Apply theme
  useEffect(() => {
    const resolved = settings.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : settings.theme;

    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    updateSettings({ theme });
  }, [updateSettings]);

  const setExcludePreset = useCallback((preset: ExcludePreset) => {
    updateSettings({ excludePreset: preset });
  }, [updateSettings]);

  const setReaderSettings = useCallback((reader: Partial<ReaderSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, reader: { ...prev.reader, ...reader } };
      saveSettings(next);
      return next;
    });
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    updateSettings({ perPage: perPage as AppSettings["perPage"] });
  }, [updateSettings]);

  const setSkipToc = useCallback((skipTocOnContinue: boolean) => {
    updateSettings({ skipTocOnContinue });
  }, [updateSettings]);

  return {
    settings,
    setTheme,
    setExcludePreset,
    setReaderSettings,
    setPerPage,
    setSkipToc,
    updateSettings,
  };
}
