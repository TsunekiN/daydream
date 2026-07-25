import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Trash2, ArrowUpDown, LayoutGrid, List, GripVertical, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildExternalReaderUrl } from "@/lib/reader-utils";
import type { FavoriteNovel } from "@/hooks/useFavorites";
import type { SiteMode } from "@/types/novel";

type FavSortOrder = "updatedDesc" | "addedDesc" | "addedAsc" | "manual";
type ViewMode = "list" | "card";

const SORT_OPTIONS: { key: FavSortOrder; label: string }[] = [
  { key: "updatedDesc", label: "更新が新しい順" },
  { key: "addedDesc", label: "登録が新しい順" },
  { key: "addedAsc", label: "登録が古い順" },
  { key: "manual", label: "手動並べ替え" },
];

interface FavoritesViewProps {
  favorites: FavoriteNovel[];
  onRemoveFavorite: (ncode: string, site: SiteMode) => void;
  onSelectNovel: (ncode: string, site: SiteMode) => void;
  onReorder: (reordered: FavoriteNovel[]) => void;
  onContinueRead?: (ncode: string, site: SiteMode, episode: number) => void;
}

interface FavListItemProps {
  fav: FavoriteNovel;
  index: number;
  isManual: boolean;
  dragIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: () => void;
  onSelect: () => void;
  onRemove: () => void;
  onContinueRead?: (ncode: string, site: SiteMode, episode: number) => void;
}

function FavListItem({ fav, index, isManual, dragIndex, onDragStart, onDragOver, onDrop, onSelect, onRemove, onContinueRead }: FavListItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0]!.clientX - touchStartX.current;
    if (Math.abs(dx) > 10) isSwiping.current = true;
    setSwipeX(dx);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(swipeX) > 80) {
      if (window.confirm(`「${fav.title}」をお気に入りから削除しますか？`)) {
        onRemove();
      }
    }
    setSwipeX(0);
  }, [swipeX, fav.title, onRemove]);

  const handleClick = useCallback(() => {
    if (!isSwiping.current) onSelect();
  }, [onSelect]);

  const lastRead = fav.lastReadEpisode ?? 0;
  const total = fav.totalEpisodes ?? 0;

  const handleContinueClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (lastRead > 0 && total > 0 && lastRead < total) {
      const nextEp = lastRead + 1;
      const url = buildExternalReaderUrl(fav.ncode, nextEp, fav.site);
      window.open(url, "_blank", "noopener,noreferrer");
      onContinueRead?.(fav.ncode, fav.site, nextEp);
    } else if (lastRead === 0) {
      const url = buildExternalReaderUrl(fav.ncode, 1, fav.site);
      window.open(url, "_blank", "noopener,noreferrer");
      onContinueRead?.(fav.ncode, fav.site, 1);
    }
  }, [fav.ncode, fav.site, lastRead, total, onContinueRead]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, x: swipeX * 0.3 }}
      transition={{ delay: index * 0.02, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      draggable={isManual}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "glass rounded-xl p-3 md:p-4 flex items-start gap-2 sm:gap-3 group cursor-pointer",
        dragIndex === index && "opacity-50 scale-[0.98]",
        isManual && "cursor-grab active:cursor-grabbing",
        Math.abs(swipeX) > 40 && "bg-red-500/5"
      )}
      onClick={handleClick}
    >
      {/* Drag handle */}
      {isManual && (
        <GripVertical className="w-4 h-4 text-daydream-gray-300 shrink-0 mt-0.5" />
      )}

      {/* Site badge — hidden on mobile */}
      <span className={cn(
        "hidden sm:inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5",
        fav.site === "nocturne"
          ? "bg-red-500/10 text-red-500"
          : "bg-daydream-accent/10 text-daydream-accent"
      )}>
        {fav.site === "nocturne" ? "N18" : "なろう"}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-daydream-black truncate group-hover:text-daydream-accent transition-colors">
          {fav.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px] text-daydream-pearl truncate">{fav.writer}</p>
          {total > 0 && (
            <span className="text-[9px] font-bold text-daydream-accent shrink-0">
              {lastRead}/{total}話
            </span>
          )}
        </div>
        {fav.story && (
          <p className="hidden sm:block text-[10px] leading-relaxed text-daydream-gray-400 line-clamp-2 mt-1">
            {fav.story}
          </p>
        )}

        {/* Continue reading button */}
        <div className="mt-1.5">
          {lastRead > 0 && total > 0 && lastRead < total && (
            <button
              onClick={handleContinueClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-daydream-accent/10 text-daydream-accent text-[10px] font-bold hover:bg-daydream-accent/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              続きを読む（第{lastRead + 1}話）
            </button>
          )}
          {lastRead > 0 && total > 0 && lastRead >= total && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold">
              <CheckCircle className="w-3 h-3" />
              最新話まで読了
            </span>
          )}
          {lastRead === 0 && (
            <button
              onClick={handleContinueClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-daydream-gray-100 text-daydream-pearl text-[10px] font-bold hover:bg-daydream-gray-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              第1話を読む
            </button>
          )}
        </div>
      </div>

      {/* Meta + Remove */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {fav.lastUpdated && (
          <span className="text-[9px] text-daydream-gray-400">
            {fav.lastUpdated.split(" ")[0]}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hidden sm:block p-1.5 rounded-full hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="削除"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </motion.div>
  );
}

export function FavoritesView({
  favorites,
  onRemoveFavorite,
  onSelectNovel,
  onReorder,
  onContinueRead,
}: FavoritesViewProps) {
  const [sortOrder, setSortOrder] = useState<FavSortOrder>("updatedDesc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const sortedFavorites = sortOrder === "manual"
    ? [...favorites].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [...favorites].sort((a, b) => {
        switch (sortOrder) {
          case "updatedDesc": {
            const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : a.addedAt;
            const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : b.addedAt;
            return bTime - aTime;
          }
          case "addedDesc":
            return b.addedAt - a.addedAt;
          case "addedAsc":
            return a.addedAt - b.addedAt;
          default:
            return 0;
        }
      });

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIndex === null || dragOverIndex.current === null || dragIndex === dragOverIndex.current) {
      setDragIndex(null);
      return;
    }
    const items = [...sortedFavorites];
    const [moved] = items.splice(dragIndex, 1);
    if (moved) {
      items.splice(dragOverIndex.current, 0, moved);
      onReorder(items);
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  }, [dragIndex, sortedFavorites, onReorder]);

  const isManual = sortOrder === "manual";

  return (
    <div>
      {/* Header: title + controls */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-daydream-accent fill-daydream-accent" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-daydream-black">
            お気に入り
          </h2>
          <span className="text-[10px] text-daydream-pearl">
            {favorites.length}作品
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle — hidden on mobile (list only) */}
          <div className="hidden sm:flex bg-daydream-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list" ? "bg-daydream-white shadow-sm" : "text-daydream-gray-400"
              )}
              aria-label="リスト表示"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "card" ? "bg-daydream-white shadow-sm" : "text-daydream-gray-400"
              )}
              aria-label="カード表示"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort */}
          {favorites.length > 1 && (
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-daydream-gray-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as FavSortOrder)}
                className="text-[10px] font-bold text-daydream-pearl bg-daydream-gray-100 rounded-lg px-2 py-1 outline-none cursor-pointer border border-daydream-gray-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Heart className="w-10 h-10 text-daydream-gray-300 mx-auto mb-4" />
          <p className="text-sm text-daydream-pearl mb-2">
            まだお気に入りがありません
          </p>
          <p className="text-[11px] text-daydream-gray-400">
            「なろう」や「ノクターン」タブから作品を見つけてお気に入りに追加しましょう
          </p>
        </motion.div>
      ) : (
        <>
        {/* Card View — hidden on mobile */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4",
          viewMode === "card" ? "hidden sm:grid" : "hidden"
        )}>
          {sortedFavorites.map((fav, index) => {
            const lastRead = fav.lastReadEpisode ?? 0;
            const total = fav.totalEpisodes ?? 0;

            return (
              <motion.div
                key={`${fav.site}-${fav.ncode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                draggable={isManual}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className={cn(
                  "glass rounded-2xl p-4 md:p-5 flex flex-col cursor-pointer group",
                  dragIndex === index && "opacity-50 scale-95",
                  isManual && "cursor-grab active:cursor-grabbing"
                )}
                onClick={() => !isManual && onSelectNovel(fav.ncode, fav.site)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    fav.site === "nocturne"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-daydream-accent/10 text-daydream-accent"
                  )}>
                    {fav.site === "nocturne" ? "N18" : "なろう"}
                  </span>
                  <div className="flex items-center gap-1">
                    {isManual && <GripVertical className="w-3.5 h-3.5 text-daydream-gray-300" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.ncode, fav.site); }}
                      className="p-1 rounded-full hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-daydream-black line-clamp-2 mb-1 group-hover:text-daydream-accent transition-colors">
                  {fav.title}
                </h3>

                {/* Author */}
                <p className="text-[11px] text-daydream-pearl mb-2 truncate">{fav.writer}</p>

                {/* Story excerpt */}
                {fav.story && (
                  <p className="hidden sm:block text-[10px] leading-relaxed text-daydream-gray-400 line-clamp-3 flex-1">
                    {fav.story}
                  </p>
                )}

                {/* Updated + Progress */}
                <div className="flex items-center gap-3 mt-2">
                  {total > 0 && (
                    <span className="text-[9px] font-bold text-daydream-accent">
                      {lastRead}/{total}話
                    </span>
                  )}
                  {fav.lastUpdated && (
                    <span className="text-[9px] text-daydream-gray-400">
                      更新: {fav.lastUpdated.split(" ")[0]}
                    </span>
                  )}
                </div>

                {/* Continue reading */}
                <div className="mt-2">
                  {lastRead > 0 && total > 0 && lastRead < total && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextEp = lastRead + 1;
                        const url = buildExternalReaderUrl(fav.ncode, nextEp, fav.site);
                        window.open(url, "_blank", "noopener,noreferrer");
                        onContinueRead?.(fav.ncode, fav.site, nextEp);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-daydream-accent/10 text-daydream-accent text-[10px] font-bold hover:bg-daydream-accent/20 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      続きを読む
                    </button>
                  )}
                  {lastRead > 0 && total > 0 && lastRead >= total && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold">
                      <CheckCircle className="w-3 h-3" />
                      最新話まで読了
                    </span>
                  )}
                  {lastRead === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = buildExternalReaderUrl(fav.ncode, 1, fav.site);
                        window.open(url, "_blank", "noopener,noreferrer");
                        onContinueRead?.(fav.ncode, fav.site, 1);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-daydream-gray-100 text-daydream-pearl text-[10px] font-bold hover:bg-daydream-gray-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      第1話を読む
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* List View — always visible on mobile, or when list mode selected */}
        <div className={cn(
          "space-y-1.5",
          viewMode === "card" ? "block sm:hidden" : ""
        )}>
          {sortedFavorites.map((fav, index) => (
            <FavListItem
              key={`${fav.site}-${fav.ncode}`}
              fav={fav}
              index={index}
              isManual={isManual}
              dragIndex={dragIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onSelect={() => !isManual && onSelectNovel(fav.ncode, fav.site)}
              onRemove={() => onRemoveFavorite(fav.ncode, fav.site)}
              onContinueRead={onContinueRead}
            />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
