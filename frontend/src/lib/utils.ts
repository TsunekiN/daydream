import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 数値をコンパクトに表示（例: 12345 → 12.3K）
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * 文字数を表示用にフォーマット
 */
export function formatLength(length: number): string {
  if (length >= 1_000_000) return `${(length / 10_000).toFixed(0)}万字`;
  if (length >= 10_000) return `${(length / 10_000).toFixed(1)}万字`;
  return `${length.toLocaleString()}字`;
}
