import { motion } from "framer-motion";
import { BookOpen, Star, Bookmark, Heart } from "lucide-react";
import { cn, formatNumber, formatLength } from "@/lib/utils";
import type { NovelMeta } from "@/types/novel";
import { GENRE_MAP } from "@/types/novel";

interface NovelCardProps {
  novel: NovelMeta;
  rank: number;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function NovelCard({ novel, rank, onClick, isFavorite, onToggleFavorite }: NovelCardProps) {
  const genreName = GENRE_MAP[novel.genre] ?? "その他";
  const keywords = novel.keyword
    ? novel.keyword.split(/\s+/).filter(Boolean).slice(0, 4)
    : [];

  return (
    <motion.div
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: rank * 0.03, ease: [0.23, 1, 0.32, 1] }}
      className="glass rounded-2xl p-4 md:p-5 flex flex-col h-[260px] md:h-[280px] group cursor-pointer"
    >
      {/* Header: Rank + Points + Favorite */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
            rank <= 3
              ? "bg-daydream-accent/10 text-daydream-accent dark:bg-daydream-accent/20"
              : "bg-daydream-gray-100 text-daydream-pearl dark:bg-daydream-gray-200"
          )}
        >
          {rank}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-daydream-pearl">
            {formatNumber(novel.daily_point)} pt
          </span>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1.5 rounded-full hover:bg-daydream-gray-100 transition-colors"
              aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  isFavorite
                    ? "text-daydream-accent fill-daydream-accent"
                    : "text-daydream-gray-300"
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-daydream-black leading-snug line-clamp-2 mb-1.5 group-hover:text-daydream-accent transition-colors">
        {novel.title}
      </h3>

      {/* Author */}
      <p className="text-[11px] text-daydream-pearl mb-2 truncate">
        {novel.writer}
      </p>

      {/* Synopsis */}
      <p className="text-[11px] leading-relaxed text-daydream-gray-400 dark:text-daydream-gray-400 line-clamp-3 flex-1 mb-3">
        {novel.story}
      </p>

      {/* Stats Row */}
      <div className="flex items-center gap-3 text-[10px] text-daydream-pearl mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {novel.general_all_no}話
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="w-3 h-3" />
          {formatLength(novel.length)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Bookmark className="w-3 h-3" />
          {formatNumber(novel.fav_novel_cnt)}
        </span>
        {novel.novelupdated_at && (
          <span className="text-daydream-gray-400">
            更新 {novel.novelupdated_at.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Genre + Keywords */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 rounded-full bg-daydream-accent/8 text-daydream-accent text-[9px] font-bold tracking-wide dark:bg-daydream-accent/15">
          {genreName}
        </span>
        {keywords.map((kw) => (
          <span
            key={kw}
            className="px-2 py-0.5 rounded-full bg-daydream-gray-100 text-daydream-pearl text-[9px] font-medium dark:bg-daydream-gray-200"
          >
            {kw}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
