import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useVerticalScroll } from "@/hooks/useVerticalScroll";
import { transformForVertical } from "@/lib/tcy";
import { SpeechPlayer } from "@/components/SpeechPlayer";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS } from "@/types/settings";
import type { EpisodeContent } from "@/types/reader";
import type { SiteMode } from "@/types/novel";

interface NovelReaderProps {
  ncode: string;
  episode: number;
  site: SiteMode;
  onBack: () => void;
  onEpisodeChange: (episode: number) => void;
  onEpisodeRead: (episode: number, total?: number) => void;
}

export function NovelReader({
  ncode,
  episode,
  site,
  onBack,
  onEpisodeChange,
  onEpisodeRead,
}: NovelReaderProps) {
  const [content, setContent] = useState<EpisodeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const { ref: verticalRef } = useVerticalScroll();

  const isVertical = settings.reader.layout === "vertical";
  const fontCss = FONT_FAMILY_OPTIONS[settings.reader.fontFamily].css;
  const fontSizeClass = FONT_SIZE_OPTIONS[settings.reader.fontSize].class;

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPath = site === "nocturne" ? "nocturne" : "narou";
      const resp = await fetch(`/api/${apiPath}/novel/${ncode}/${episode}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail ?? `取得失敗: ${resp.status}`);
      }
      const data: EpisodeContent = await resp.json();
      setContent(data);
      onEpisodeRead(episode, data.total_episodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }, [ncode, episode, site, onEpisodeRead]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handlePrev = () => {
    if (content?.prev_number != null) {
      onEpisodeChange(content.prev_number);
    }
  };

  const handleNext = () => {
    if (content?.next_number != null) {
      onEpisodeChange(content.next_number);
    }
  };

  const handleOpenExternal = () => {
    const base = site === "nocturne"
      ? "https://novel18.syosetu.com"
      : "https://ncode.syosetu.com";
    const url = episode > 0
      ? `${base}/${ncode.toLowerCase()}/${episode}/`
      : `${base}/${ncode.toLowerCase()}/`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Prepare body HTML for display
  const displayHtml = content?.body_html
    ? isVertical
      ? transformForVertical(content.body_html)
      : content.body_html
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toolbar */}
      <header className="sticky top-0 z-40 bg-background border-b border-daydream-gray-200 px-3 py-2 flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-daydream-gray-100 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-4 h-4 text-daydream-pearl" />
        </button>

        <div className="flex-1 min-w-0">
          {content && (
            <p className="text-xs text-daydream-pearl truncate">
              {content.subtitle || `第${episode}話`}
            </p>
          )}
        </div>

        {/* Episode nav */}
        <button
          onClick={handlePrev}
          disabled={!content?.prev_number}
          className="p-1.5 rounded-full hover:bg-daydream-gray-100 transition-colors disabled:opacity-30"
          aria-label="前話"
        >
          <ChevronLeft className="w-4 h-4 text-daydream-pearl" />
        </button>
        <span className="text-[10px] text-daydream-pearl tabular-nums whitespace-nowrap">
          {episode}{content?.total_episodes ? `/${content.total_episodes}` : ""}
        </span>
        <button
          onClick={handleNext}
          disabled={!content?.next_number}
          className="p-1.5 rounded-full hover:bg-daydream-gray-100 transition-colors disabled:opacity-30"
          aria-label="次話"
        >
          <ChevronRight className="w-4 h-4 text-daydream-pearl" />
        </button>

        <button
          onClick={handleOpenExternal}
          className="p-2 rounded-full hover:bg-daydream-gray-100 transition-colors"
          aria-label="外部で開く"
        >
          <ExternalLink className="w-3.5 h-3.5 text-daydream-pearl" />
        </button>
      </header>

      {/* TTS Player */}
      {content && !loading && (
        <div className="border-b border-daydream-gray-200 px-3 py-2">
          <SpeechPlayer bodyHtml={content.body_html} />
        </div>
      )}

      {/* Content area */}
      <main className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-daydream-accent animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchContent}
              className="text-sm text-daydream-accent underline"
            >
              再試行
            </button>
          </div>
        )}

        {content && !loading && !error && (
          <div
            ref={isVertical ? verticalRef : undefined}
            className={cn(
              "h-[calc(100vh-7rem)] overflow-auto p-4 sm:p-6 md:p-8",
              isVertical && "writing-vertical-rl overflow-x-auto overflow-y-hidden"
            )}
            style={{
              fontFamily: fontCss,
              lineHeight: settings.reader.lineHeight,
              letterSpacing: `${settings.reader.letterSpacing}em`,
            }}
          >
            {/* Subtitle */}
            {content.subtitle && (
              <h1
                className={cn(
                  "font-bold mb-6",
                  isVertical ? "text-lg" : "text-xl"
                )}
              >
                {content.subtitle}
              </h1>
            )}

            {/* Body */}
            <div
              className={cn(
                "novel-body",
                fontSizeClass,
                isVertical && "h-full"
              )}
              dangerouslySetInnerHTML={{ __html: displayHtml }}
            />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      {content && !loading && !error && (
        <footer className="border-t border-daydream-gray-200 px-3 py-2 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={!content.prev_number}
            className="flex items-center gap-1 text-xs text-daydream-pearl disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            前話
          </button>
          <button
            onClick={handleNext}
            disabled={!content.next_number}
            className="flex items-center gap-1 text-xs text-daydream-pearl disabled:opacity-30"
          >
            次話
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      )}
    </div>
  );
}
