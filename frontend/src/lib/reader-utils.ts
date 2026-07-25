import type { SiteMode } from "@/types/novel";

export function buildExternalReaderUrl(
  ncode: string,
  episode: number | undefined,
  site: SiteMode
): string {
  const base = site === "nocturne"
    ? "https://novel18.syosetu.com"
    : "https://ncode.syosetu.com";
  const ncLower = ncode.toLowerCase();
  if (!episode || episode <= 0) {
    return `${base}/${ncLower}/`;
  }
  return `${base}/${ncLower}/${episode}/`;
}

export function formatProgress(
  lastRead: number,
  total: number | undefined,
  suffix: string = ""
): string {
  if (total !== undefined && total > 0) {
    return `${lastRead}/${total}話${suffix}`;
  }
  return `${lastRead}話${suffix}`;
}
