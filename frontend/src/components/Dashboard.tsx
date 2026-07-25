import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch, SEARCH_ORDER_LABELS, type SearchOrder } from "@/hooks/useSearch";
import { NovelCard } from "./NovelCard";
import { SkeletonGrid } from "./SkeletonCard";
import { GENRE_MAP, type ExcludeFilters, type SiteMode } from "@/types/novel";
import type { PerPage } from "@/types/settings";

interface DashboardProps {
  perPage: PerPage;
  onSelectNovel: (ncode: string, site: SiteMode) => void;
  excludeFilters: ExcludeFilters;
  isFavorite: (ncode: string, site: SiteMode) => boolean;
  onToggleFavorite: (ncode: string, site: SiteMode, title: string, writer: string, story: string) => void;
}

export function Dashboard({ perPage, onSelectNovel, excludeFilters, isFavorite, onToggleFavorite }: DashboardProps) {
  // Site selection (inside filter)
  const [site, setSite] = useState<SiteMode>("narou");

  // Search state (no default ranking — search-only)
  const { novels: searchNovels, allcount: searchCount, isLoading: searchLoading, error: searchError, search, hasSearched } = useSearch();
  const [searchWord, setSearchWord] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchWriter, setSearchWriter] = useState("");
  const [searchGenre, setSearchGenre] = useState<number | null>(null);
  const [searchOrder, setSearchOrder] = useState<SearchOrder>("hyoka");
  const [showFilters, setShowFilters] = useState(true);

  // Compute effective exclude (none for nocturne)
  const effectiveExclude = site === "nocturne" ? {} : excludeFilters;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    search({
      word: searchWord || undefined,
      keyword: searchKeyword || undefined,
      writer: searchWriter || undefined,
      genre: searchGenre,
      order: searchOrder,
      exclude: effectiveExclude,
      site,
      limit: perPage,
    });
  };

  const clearSearch = () => {
    setSearchWord("");
    setSearchKeyword("");
    setSearchWriter("");
    setSearchGenre(null);
  };

  const novels = searchNovels;
  const isLoading = searchLoading;
  const error = searchError;

  return (
    <div>
      {/* Search Section */}
      <section className="mb-6 md:mb-8">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Main search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-daydream-gray-400" />
              <input
                type="text"
                placeholder="タイトル・あらすじで検索..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-daydream-gray-100 dark:bg-daydream-gray-100 border border-transparent focus:border-daydream-accent/30 focus:bg-daydream-white dark:focus:bg-daydream-gray-50 text-sm text-daydream-black placeholder:text-daydream-gray-400 outline-none transition-all"
              />
              {(searchWord || searchKeyword || searchWriter || searchGenre) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-daydream-gray-200 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-daydream-gray-400" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                showFilters
                  ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                  : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">フィルタ</span>
            </button>

            {/* Search button */}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-daydream-accent text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">検索</span>
            </button>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="glass rounded-2xl p-4 md:p-5 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Site select */}
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-1.5 block">
                        サイト
                      </label>
                      <div className="relative">
                        <select
                          value={site}
                          onChange={(e) => setSite(e.target.value as SiteMode)}
                          className="w-full px-3 py-2 rounded-lg bg-daydream-gray-100 dark:bg-daydream-gray-100 text-sm text-daydream-black outline-none border border-transparent focus:border-daydream-accent/30 appearance-none pr-8 transition-all"
                        >
                          <option value="narou">小説家になろう</option>
                          <option value="nocturne">ノクターンノベルズ</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-daydream-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Tag search */}
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-1.5 block">
                        タグ / キーワード
                      </label>
                      <input
                        type="text"
                        placeholder="異世界転生 チート..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-daydream-gray-100 dark:bg-daydream-gray-100 text-sm text-daydream-black placeholder:text-daydream-gray-400 outline-none border border-transparent focus:border-daydream-accent/30 transition-all"
                      />
                    </div>

                    {/* Author search */}
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-1.5 block">
                        作者名
                      </label>
                      <input
                        type="text"
                        placeholder="作者名で検索..."
                        value={searchWriter}
                        onChange={(e) => setSearchWriter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-daydream-gray-100 dark:bg-daydream-gray-100 text-sm text-daydream-black placeholder:text-daydream-gray-400 outline-none border border-transparent focus:border-daydream-accent/30 transition-all"
                      />
                    </div>

                    {/* Genre select */}
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-1.5 block">
                        ジャンル
                      </label>
                      <div className="relative">
                        <select
                          value={searchGenre ?? ""}
                          onChange={(e) =>
                            setSearchGenre(e.target.value ? Number(e.target.value) : null)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-daydream-gray-100 dark:bg-daydream-gray-100 text-sm text-daydream-black outline-none border border-transparent focus:border-daydream-accent/30 appearance-none pr-8 transition-all"
                        >
                          <option value="">すべて</option>
                          {Object.entries(GENRE_MAP).map(([code, name]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-daydream-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Sort order for search */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-1.5 block">
                      並び順
                    </label>
                    <div className="flex flex-nowrap gap-1 overflow-x-auto no-scrollbar">
                      {(Object.entries(SEARCH_ORDER_LABELS) as [SearchOrder, string][]).map(
                        ([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSearchOrder(key)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all shrink-0",
                              searchOrder === key
                                ? "bg-daydream-accent/10 text-daydream-accent border border-daydream-accent/20"
                                : "bg-daydream-gray-100 text-daydream-pearl border border-transparent hover:bg-daydream-gray-200"
                            )}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </section>

      {/* Search Results */}
      {hasSearched && !searchLoading && (
        <section className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-daydream-accent" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-daydream-black">
                検索結果
              </h2>
              <span className="text-[10px] text-daydream-pearl ml-2">
                {searchCount.toLocaleString()}件中 {searchNovels.length}件表示
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-[10px] font-bold uppercase tracking-widest text-daydream-pearl hover:text-daydream-accent transition-colors"
            >
              クリア
            </button>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 text-center mb-8"
        >
          <p className="text-sm text-red-500 dark:text-red-400 font-medium">
            {error}
          </p>
          <button
            onClick={() => handleSearch()}
            className="mt-3 px-4 py-2 rounded-full bg-daydream-accent text-white text-xs font-bold tracking-wider hover:opacity-90 transition-opacity"
          >
            再試行
          </button>
        </motion.div>
      )}

      {/* Grid Content */}
      {isLoading ? (
        <SkeletonGrid />
      ) : !hasSearched ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Search className="w-8 h-8 text-daydream-gray-300 mx-auto mb-3" />
          <p className="text-sm text-daydream-pearl">
            キーワードを入力して検索してください
          </p>
        </motion.div>
      ) : novels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Search className="w-8 h-8 text-daydream-gray-300 mx-auto mb-3" />
          <p className="text-sm text-daydream-pearl">
            該当する作品が見つかりませんでした
          </p>
          <p className="text-[11px] text-daydream-gray-400 mt-1">
            検索条件を変えてお試しください
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
        >
          {novels.map((novel, index) => (
            <NovelCard
              key={novel.ncode}
              novel={novel}
              rank={index + 1}
              onClick={() => onSelectNovel(novel.ncode, site)}
              isFavorite={isFavorite(novel.ncode, site)}
              onToggleFavorite={() => onToggleFavorite(novel.ncode, site, novel.title, novel.writer, novel.story)}
            />
          ))}
        </motion.div>
      )}

      {/* Footer */}
      {!isLoading && novels.length > 0 && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] text-daydream-gray-400 font-medium tracking-wider">
            {searchCount.toLocaleString()}件中 {novels.length}件を表示 — データ提供：なろう小説API
          </p>
        </motion.footer>
      )}
    </div>
  );
}
