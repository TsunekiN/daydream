import { useEffect, useState } from "react";
import { Heart, Search, Settings as SettingsIcon, LogOut } from "lucide-react";
import { FavoritesView } from "@/components/FavoritesView";
import { Dashboard } from "@/components/Dashboard";
import { NovelInfoView } from "@/components/NovelInfoView";
import { NovelReader } from "@/components/NovelReader";
import { Settings } from "@/components/Settings";
import { LoginScreen } from "@/components/LoginScreen";
import { SpeechProvider } from "@/contexts/SpeechContext";
import { useSettings } from "@/hooks/useSettings";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { EXCLUDE_PRESETS } from "@/types/novel";
import type { ExcludePreset, SiteMode } from "@/types/novel";
import type { AppView } from "@/types/reader";

type HomeTab = "favorites" | "search";

const TAB_CONFIG: { key: HomeTab; label: string; icon: React.ReactNode }[] = [
  { key: "favorites", label: "お気に入り", icon: <Heart className="w-3.5 h-3.5" /> },
  { key: "search", label: "小説検索", icon: <Search className="w-3.5 h-3.5" /> },
];

export function App() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const [view, setView] = useState<AppView>({ type: "home", tab: "favorites" });
  const { settings, setTheme, setExcludePreset, setReaderSettings, setPerPage, setSkipToc } = useSettings();
  const favoritesHook = useFavorites();

  const excludeFilters = EXCLUDE_PRESETS[settings.excludePreset as ExcludePreset]?.filters ?? {};

  const currentTab: HomeTab = view.type === "home" ? view.tab : "favorites";

  const setTab = (tab: HomeTab) => {
    setView({ type: "home", tab });
  };

  const navigateToInfo = (ncode: string, site: SiteMode) => {
    setView({ type: "info", ncode, site });
  };

  const navigateToReader = (ncode: string, episode: number, site: SiteMode) => {
    setView({ type: "reader", ncode, episode, site });
  };

  const navigateToSettings = () => {
    setView({ type: "settings" });
  };

  const navigateHome = () => {
    setView({ type: "home", tab: currentTab });
  };

  // Home views (tabs)
  const isHomeView = view.type === "home";

  // お気に入りタブが表示されたら更新日を取得
  useEffect(() => {
    if (isHomeView && currentTab === "favorites") {
      favoritesHook.refreshLastUpdated();
    }
  }, [isHomeView, currentTab]); // eslint-disable-line -- intentional

  // 認証ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-daydream-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 未認証 → ログイン画面
  if (!user) {
    return <LoginScreen onLogin={login} isLoading={authLoading} />;
  }

  return (
    <SpeechProvider>
      {isHomeView && (
        <div className="min-h-screen px-3 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10 pb-[env(safe-area-inset-bottom)]">
          {/* Header — title(left) + tabs(center) + user+settings(right) */}
          <header className="sticky top-0 z-40 bg-background -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 px-3 sm:px-4 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 flex items-center mb-4 md:mb-8">
            {/* Left: title */}
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-daydream-black shrink-0"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Daydream
            </h1>

            {/* Center: Tab switcher */}
            <div className="flex-1 flex justify-center">
              <div className="flex bg-daydream-gray-100 p-0.5 sm:p-1 rounded-full text-[10px] font-bold tracking-widest">
                {TAB_CONFIG.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all shrink-0",
                      currentTab === key
                        ? "bg-daydream-white shadow-sm text-daydream-black dark:bg-daydream-gray-200"
                        : "text-daydream-gray-400 hover:text-daydream-black"
                    )}
                  >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: settings + user avatar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={navigateToSettings}
                className="p-2 sm:p-2.5 rounded-full bg-daydream-gray-100 hover:bg-daydream-gray-200 transition-colors"
                aria-label="設定"
              >
                <SettingsIcon className="w-4 h-4 text-daydream-pearl" />
              </button>
              {user.photoURL ? (
                <button
                  onClick={logout}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 ring-daydream-gray-200 hover:ring-daydream-accent transition-all"
                  aria-label="ログアウト"
                  title="ログアウト"
                >
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="p-2 rounded-full bg-daydream-gray-100 hover:bg-daydream-gray-200 transition-colors"
                  aria-label="ログアウト"
                >
                  <LogOut className="w-4 h-4 text-daydream-pearl" />
                </button>
              )}
            </div>
          </header>

          {/* Tab content — hidden instead of unmount to preserve state */}
          <div className={currentTab === "favorites" ? "" : "hidden"}>
            <FavoritesView
              favorites={favoritesHook.favorites}
              onRemoveFavorite={favoritesHook.removeFavorite}
              onSelectNovel={(ncode, site) => {
                navigateToInfo(ncode, site);
              }}
              onReorder={favoritesHook.reorderFavorites}
              onContinueRead={(ncode, site, episode) => {
                const fav = favoritesHook.favorites.find((f) => f.ncode === ncode && f.site === site);
                const total = fav?.totalEpisodes;
                favoritesHook.updateReadProgress(ncode, site, episode, total);
              }}
            />
          </div>
          <div className={currentTab === "search" ? "" : "hidden"}>
            <Dashboard
              perPage={settings.perPage}
              onSelectNovel={navigateToInfo}
              excludeFilters={excludeFilters}
              isFavorite={favoritesHook.isFavorite}
              onToggleFavorite={(ncode, site, title, writer, story) => {
                if (favoritesHook.isFavorite(ncode, site)) {
                  favoritesHook.removeFavorite(ncode, site);
                } else {
                  favoritesHook.addFavorite({ ncode, site, title, writer, story: story?.slice(0, 200) });
                }
              }}
            />
          </div>
        </div>
      )}

      {view.type === "info" && (
        <NovelInfoView
          ncode={view.ncode}
          site={view.site}
          onBack={navigateHome}
          isFavorite={favoritesHook.isFavorite(view.ncode, view.site)}
          lastReadEpisode={favoritesHook.favorites.find((f) => f.ncode === view.ncode && f.site === view.site)?.lastReadEpisode}
          onToggleFavorite={(title, writer, story) => {
            if (favoritesHook.isFavorite(view.ncode, view.site)) {
              favoritesHook.removeFavorite(view.ncode, view.site);
            } else {
              favoritesHook.addFavorite({ ncode: view.ncode, site: view.site, title, writer, story: story?.slice(0, 200) });
            }
          }}
          onEpisodeRead={(episodeNumber, totalEpisodes) => {
            favoritesHook.updateReadProgress(view.ncode, view.site, episodeNumber, totalEpisodes);
          }}
          onReadInApp={(episode) => {
            navigateToReader(view.ncode, episode, view.site);
          }}
        />
      )}

      {view.type === "reader" && (
        <NovelReader
          ncode={view.ncode}
          episode={view.episode}
          site={view.site}
          onBack={() => setView({ type: "info", ncode: view.ncode, site: view.site })}
          onEpisodeChange={(ep) => setView({ type: "reader", ncode: view.ncode, episode: ep, site: view.site })}
          onEpisodeRead={(episodeNumber, totalEpisodes) => {
            favoritesHook.updateReadProgress(view.ncode, view.site, episodeNumber, totalEpisodes);
          }}
        />
      )}

      {view.type === "settings" && (
        <Settings
          settings={settings}
          onBack={navigateHome}
          onSetTheme={setTheme}
          onSetExcludePreset={setExcludePreset}
          onSetReaderSettings={setReaderSettings}
          onSetPerPage={setPerPage}
          onSetSkipToc={setSkipToc}
        />
      )}
    </SpeechProvider>
  );
}
