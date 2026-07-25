/**
 * 設定ページ
 * - テーマ（ダーク/ライト/システム）
 * - 除外フィルタプリセット
 * - ビューアーのレイアウト・フォント設定
 */

import { motion } from "framer-motion";
import { ArrowLeft, Moon, Sun, Monitor, ShieldOff, BookOpen, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppSettings, ReaderSettings, Theme, ReaderLayout, ReaderFontFamily, ReaderFontSize, PerPage } from "@/types/settings";
import { FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS } from "@/types/settings";
import { EXCLUDE_PRESETS, type ExcludePreset } from "@/types/novel";

interface SettingsProps {
  settings: AppSettings;
  onBack: () => void;
  onSetTheme: (theme: Theme) => void;
  onSetExcludePreset: (preset: ExcludePreset) => void;
  onSetReaderSettings: (reader: Partial<ReaderSettings>) => void;
  onSetPerPage: (perPage: PerPage) => void;
  onSetSkipToc: (skip: boolean) => void;
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 md:p-6 space-y-4", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-daydream-accent">{icon}</span>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-daydream-black">
        {title}
      </h3>
    </div>
  );
}

export function Settings({
  settings,
  onBack,
  onSetTheme,
  onSetExcludePreset,
  onSetReaderSettings,
  onSetPerPage,
  onSetSkipToc,
}: SettingsProps) {
  const themeOptions: { key: Theme; icon: React.ReactNode; label: string }[] = [
    { key: "light", icon: <Sun className="w-4 h-4" />, label: "ライト" },
    { key: "dark", icon: <Moon className="w-4 h-4" />, label: "ダーク" },
    { key: "system", icon: <Monitor className="w-4 h-4" />, label: "システム" },
  ];

  const layoutOptions: { key: ReaderLayout; label: string }[] = [
    { key: "vertical", label: "縦書き" },
    { key: "horizontal", label: "横書き" },
  ];

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-daydream-pearl hover:text-daydream-black transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold text-daydream-black"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Settings
        </motion.h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-6"
      >
        {/* Theme */}
        <SectionCard>
          <SectionTitle icon={<Sun className="w-4 h-4" />} title="テーマ" />
          <div className="flex gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onSetTheme(opt.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                  settings.theme === opt.key
                    ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                    : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Per Page */}
        <SectionCard>
          <SectionTitle icon={<BookOpen className="w-4 h-4" />} title="表示件数" />
          <div className="flex gap-2">
            {([20, 50, 100] as PerPage[]).map((n) => (
              <button
                key={n}
                onClick={() => onSetPerPage(n)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  settings.perPage === n
                    ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                    : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                )}
              >
                {n}件
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Skip TOC */}
        <SectionCard>
          <SectionTitle icon={<BookOpen className="w-4 h-4" />} title="お気に入りの動作" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-daydream-black font-medium">続きから直接開く</p>
              <p className="text-[10px] text-daydream-gray-400 mt-0.5">
                未読話がある場合、目次をスキップして続きの話に遷移
              </p>
            </div>
            <button
              onClick={() => onSetSkipToc(!settings.skipTocOnContinue)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                settings.skipTocOnContinue ? "bg-daydream-accent" : "bg-daydream-gray-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  settings.skipTocOnContinue && "translate-x-5"
                )}
              />
            </button>
          </div>
        </SectionCard>

        {/* Exclude Filter */}
        <SectionCard>
          <SectionTitle icon={<ShieldOff className="w-4 h-4" />} title="除外フィルタ" />
          <p className="text-[11px] text-daydream-gray-400 -mt-2">
            ランキング・検索結果から女性向け作品を除外する強度を設定します
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(EXCLUDE_PRESETS) as [ExcludePreset, typeof EXCLUDE_PRESETS[ExcludePreset]][]).map(
              ([key, preset]) => (
                <button
                  key={key}
                  onClick={() => onSetExcludePreset(key)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-[10px] font-bold tracking-wider transition-all border",
                    settings.excludePreset === key
                      ? key === "none"
                        ? "bg-daydream-gray-200 text-daydream-black border-daydream-gray-300"
                        : key === "strong"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                          : "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                      : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                  )}
                >
                  {preset.label}
                </button>
              )
            )}
          </div>
          {settings.excludePreset === "strong" && (
            <p className="text-[10px] text-daydream-gray-400 bg-daydream-gray-100 dark:bg-daydream-gray-100 rounded-lg px-3 py-2">
              BL/GL除外 + 恋愛大ジャンル除外 + 除外ワード（乙女ゲー・悪役令嬢・逆ハーレム・溺愛・婚約破棄・聖女）
            </p>
          )}
        </SectionCard>

        {/* Reader Layout */}
        <SectionCard>
          <SectionTitle icon={<BookOpen className="w-4 h-4" />} title="ビューアー レイアウト" />

          {/* Layout direction */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2 block">
              デフォルト表示方向
            </label>
            <div className="flex gap-2">
              {layoutOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onSetReaderSettings({ layout: opt.key })}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    settings.reader.layout === opt.key
                      ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                      : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line height */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2 block">
              行間 — {settings.reader.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.5"
              max="3.0"
              step="0.1"
              value={settings.reader.lineHeight}
              onChange={(e) => onSetReaderSettings({ lineHeight: parseFloat(e.target.value) })}
              className="w-full h-2 bg-daydream-gray-200 rounded-full appearance-none cursor-pointer accent-daydream-accent"
            />
            <div className="flex justify-between text-[9px] text-daydream-gray-400 mt-1">
              <span>狭い</span>
              <span>広い</span>
            </div>
          </div>

          {/* Letter spacing */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2 block">
              字間 — {settings.reader.letterSpacing.toFixed(2)}em
            </label>
            <input
              type="range"
              min="0"
              max="0.15"
              step="0.01"
              value={settings.reader.letterSpacing}
              onChange={(e) => onSetReaderSettings({ letterSpacing: parseFloat(e.target.value) })}
              className="w-full h-2 bg-daydream-gray-200 rounded-full appearance-none cursor-pointer accent-daydream-accent"
            />
            <div className="flex justify-between text-[9px] text-daydream-gray-400 mt-1">
              <span>なし</span>
              <span>広い</span>
            </div>
          </div>
        </SectionCard>

        {/* Reader Font */}
        <SectionCard>
          <SectionTitle icon={<Type className="w-4 h-4" />} title="ビューアー フォント" />

          {/* Font family */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2 block">
              書体
            </label>
            <div className="flex gap-2">
              {(Object.entries(FONT_FAMILY_OPTIONS) as [ReaderFontFamily, typeof FONT_FAMILY_OPTIONS[ReaderFontFamily]][]).map(
                ([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => onSetReaderSettings({ fontFamily: key })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      settings.reader.fontFamily === key
                        ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                        : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                    )}
                    style={{ fontFamily: opt.css }}
                  >
                    {opt.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2 block">
              文字サイズ
            </label>
            <div className="flex gap-2">
              {(Object.entries(FONT_SIZE_OPTIONS) as [ReaderFontSize, typeof FONT_SIZE_OPTIONS[ReaderFontSize]][]).map(
                ([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => onSetReaderSettings({ fontSize: key })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      settings.reader.fontSize === key
                        ? "bg-daydream-accent/10 text-daydream-accent border-daydream-accent/20"
                        : "bg-daydream-gray-100 text-daydream-pearl border-transparent hover:bg-daydream-gray-200"
                    )}
                  >
                    {opt.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 border border-daydream-gray-200 dark:border-daydream-gray-200 rounded-xl p-4 overflow-hidden">
            <p className="text-[9px] font-bold uppercase tracking-widest text-daydream-pearl mb-2">
              プレビュー
            </p>
            <div
              className={cn("text-daydream-black", FONT_SIZE_OPTIONS[settings.reader.fontSize].class)}
              style={{
                fontFamily: FONT_FAMILY_OPTIONS[settings.reader.fontFamily].css,
                lineHeight: settings.reader.lineHeight,
                letterSpacing: `${settings.reader.letterSpacing}em`,
              }}
            >
              {settings.reader.layout === "vertical" ? (
                <div
                  className="h-32 overflow-hidden"
                  style={{ writingMode: "vertical-rl", direction: "ltr" }}
                >
                  <p>　吾輩は猫である。名前はまだ無い。</p>
                  <p>　どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。</p>
                </div>
              ) : (
                <div>
                  <p>　吾輩は猫である。名前はまだ無い。</p>
                  <p>　どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。</p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
