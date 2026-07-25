import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Heart, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildExternalReaderUrl, formatProgress } from "@/lib/reader-utils";
import type { SiteMode } from "@/types/novel";
import type { NovelInfo } from "@/types/reader";

interface NovelInfoViewProps {
  ncode: string;
  site: SiteMode;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (title: string, writer: string, story: string) => void;
  lastReadEpisode?: number;
  onEpisodeRead: (episode: number, total?: number) => void;
  onReadInApp: (episode: number) => void;
}

export function NovelInfoView({
  ncode,
  site,
  onBack,
  isFavorite,
  onToggleFavorite,
  lastReadEpisode,
  onEpisodeRead,
  onReadInApp,
}: NovelInfoViewProps) {
  const [info, setInfo] = useState<NovelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPath = site === "nocturne" ? "nocturne" : "narou";
      const resp = await fetch(`/api/${apiPath}/novel/${ncode}/info`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail ?? `エラー: ${resp.status}`);
      }
      const data: NovelInfo = await resp.json();
      setInfo(data);

      // デフォルト話数: 既読の次 or 1
      const next = lastReadEpisode && lastReadEpisode > 0
        ? Math.min(lastReadEpisode + 1, data.general_all_no || 1)
        : 1;
      setSelectedEpisode(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [ncode, site, lastReadEpisode]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleRead = useCallback(async () => {
    if (!info) return;

    // まずバックエンドで本文取得を試みる
    try {
      const apiPath = site === "nocturne" ? "nocturne" : "narou";
      const resp = await fetch(`/api/${apiPath}/novel/${ncode}/${selectedEpisode}`);
      if (resp.ok) {
        // 成功 → アプリ内リーダーに遷移
        onReadInApp(selectedEpisode);
        onEpisodeRead(selectedEpisode, info.general_all_no);
        return;
      }
    } catch {
      // fallthrough to external link
    }

    // フォールバック: 外部リンクで開く
    const url = buildExternalReaderUrl(ncode, selectedEpisode, site);
    window.open(url, "_blank", "noopener,noreferrer");
    onEpisodeRead(selectedEpisode, info.general_all_no);
  }, [ncode, site, selectedEpisode, info, onReadInApp, onEpisodeRead]);

  const totalEpisodes = info?.general_all_no ?? 0;

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-daydream-gray-100 hover:bg-daydream-gray-200 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-4 h-4 text-daydream-pearl" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => info && onToggleFavorite(info.title, info.writer, info.story)}
          className={cn(
            "p-2 rounded-full transition-colors",
            isFavorite
              ? "bg-daydream-accent/10 text-daydream-accent"
              : "bg-daydream-gray-100 text-daydream-pearl hover:bg-daydream-gray-200"
          )}
          aria-label={isFavorite ? "お気に入り解除" : "お気に入り追加"}
          disabled={!info}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </header>

      {/* Loading */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-daydream-gray-100 rounded w-3/4" />
          <div className="h-4 bg-daydream-gray-100 rounded w-1/3" />
          <div className="h-20 bg-daydream-gray-100 rounded" />
          <div className="h-10 bg-daydream-gray-100 rounded w-1/2" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchInfo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-daydream-accent text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            再試行
          </button>
        </div>
      )}

      {/* Content */}
      {info && !loading && !error && (
        <div className="space-y-6">
          {/* Site badge */}
          <span className={cn(
            "inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full",
            site === "nocturne"
              ? "bg-red-500/10 text-red-500"
              : "bg-daydream-accent/10 text-daydream-accent"
          )}>
            {site === "nocturne" ? "ノクターン" : "なろう"}
          </span>

          {/* Title & Author */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-daydream-black leading-snug mb-2">
              {info.title}
            </h1>
            <p className="text-sm text-daydream-pearl">{info.writer}</p>
          </div>

          {/* Progress */}
          {lastReadEpisode !== undefined && lastReadEpisode > 0 && (
            <div className="glass rounded-xl p-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-daydream-accent shrink-0" />
              <span className="text-sm font-bold text-daydream-accent">
                {formatProgress(lastReadEpisode, totalEpisodes > 0 ? totalEpisodes : undefined, " 読了")}
              </span>
            </div>
          )}

          {/* Story */}
          {info.story && (
            <div className="glass rounded-xl p-4">
              <p className="text-xs leading-relaxed text-daydream-gray-500 whitespace-pre-line line-clamp-6">
                {info.story}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-[11px] text-daydream-pearl">
            <span>全{totalEpisodes}話</span>
            {info.novelupdated_at && (
              <span>更新: {info.novelupdated_at.split(" ")[0]}</span>
            )}
            {info.keyword && (
              <span className="truncate max-w-[200px]">タグ: {info.keyword}</span>
            )}
          </div>

          {/* Episode Navigator */}
          {totalEpisodes > 0 && (
            <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-daydream-black">
                話数を選択
              </h2>

              {/* Numeric input + slider */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={totalEpisodes}
                  value={selectedEpisode}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(totalEpisodes, Number(e.target.value) || 1));
                    setSelectedEpisode(v);
                  }}
                  className="w-20 px-3 py-2 rounded-lg bg-daydream-gray-100 text-sm font-bold text-daydream-black text-center outline-none focus:ring-2 focus:ring-daydream-accent/30 border border-daydream-gray-200"
                  aria-label="話数入力"
                />
                <span className="text-[11px] text-daydream-pearl shrink-0">
                  / {totalEpisodes}話
                </span>
              </div>

              {totalEpisodes > 1 && (
                <input
                  type="range"
                  min={1}
                  max={totalEpisodes}
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-daydream-gray-200 accent-daydream-accent cursor-pointer"
                  aria-label="話数スライダー"
                />
              )}

              {/* Read button */}
              <button
                onClick={handleRead}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-daydream-accent text-white font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                第{selectedEpisode}話を読む
              </button>
            </div>
          )}

          {/* Short story (totalEpisodes === 0 or 1) */}
          {totalEpisodes <= 1 && (
            <button
              onClick={async () => {
                // Try in-app reader first
                try {
                  const apiPath = site === "nocturne" ? "nocturne" : "narou";
                  const resp = await fetch(`/api/${apiPath}/novel/${ncode}/0`);
                  if (resp.ok) {
                    onReadInApp(0);
                    onEpisodeRead(1, 1);
                    return;
                  }
                } catch {
                  // fallthrough
                }
                const url = buildExternalReaderUrl(ncode, undefined, site);
                window.open(url, "_blank", "noopener,noreferrer");
                onEpisodeRead(1, 1);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-daydream-accent text-white font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4" />
              読む
            </button>
          )}
        </div>
      )}
    </div>
  );
}
