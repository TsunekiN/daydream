import type { SearchParams, SearchResult, NovelInfo, NovelMeta, TocEntry, EpisodeContent, SiteMode } from "./types";

const NAROU_API = "https://api.syosetu.com/novelapi/api/";
const R18_API = "https://api.syosetu.com/novel18api/api/";
const NAROU_BASE = "https://ncode.syosetu.com";
const NOCTURNE_BASE = "https://novel18.syosetu.com";
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

function getApiBase(site: SiteMode) { return site === "nocturne" ? R18_API : NAROU_API; }
function getSiteBase(site: SiteMode) { return site === "nocturne" ? NOCTURNE_BASE : NAROU_BASE; }
function stripTags(html: string) { return html.replace(/<[^>]*>/g, ""); }

export async function searchNovels(params: SearchParams, site: SiteMode = "narou"): Promise<SearchResult> {
  const q: Record<string, string> = {
    out: "json", lim: String(params.limit ?? 20), order: params.order ?? "hyoka",
    of: "t-n-w-s-gf-k-ga-l-f-r-a-dp-wp-mp-gp-nu",
  };
  if (params.word) q.word = params.word;
  if (params.keyword) q.keyword = params.keyword;
  if (params.writer) q.wname = params.writer;
  if (params.genre) q.genre = String(params.genre);
  if (params.st) q.st = String(params.st);

  const resp = await fetch(`${getApiBase(site)}?${new URLSearchParams(q)}`, { headers: { "User-Agent": UA } });
  if (!resp.ok) throw new Error(`API検索エラー: ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return { allcount: 0, novels: [] };

  const allcount: number = data[0]?.allcount ?? 0;
  const novels: NovelMeta[] = data.slice(1).map((item: any) => ({
    ncode: String(item.ncode ?? ""), title: String(item.title ?? ""), writer: String(item.writer ?? ""),
    story: String(item.story ?? ""), genre: Number(item.genre ?? 9999), keyword: String(item.keyword ?? ""),
    general_all_no: Number(item.general_all_no ?? 0), length: Number(item.length ?? 0),
    fav_novel_cnt: Number(item.fav_novel_cnt ?? 0), review_cnt: Number(item.review_cnt ?? 0),
    all_point: Number(item.all_point ?? 0), daily_point: Number(item.daily_point ?? 0),
    weekly_point: Number(item.weekly_point ?? 0), monthly_point: Number(item.monthly_point ?? 0),
    global_point: Number(item.global_point ?? 0), novelupdated_at: String(item.novelupdated_at ?? ""),
  }));
  return { allcount, novels };
}

export async function getNovelInfo(ncode: string, site: SiteMode = "narou"): Promise<NovelInfo> {
  const q = new URLSearchParams({ out: "json", ncode, of: "t-n-w-s-gf-k-ga-nu", lim: "1" });
  const resp = await fetch(`${getApiBase(site)}?${q}`, { headers: { "User-Agent": UA } });
  if (!resp.ok) throw new Error(`作品情報取得エラー: ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data) || data.length < 2) throw new Error("作品が見つかりません");
  const item = data[1];
  return {
    ncode: String(item.ncode ?? ""), title: String(item.title ?? ""), writer: String(item.writer ?? ""),
    story: String(item.story ?? ""), genre: Number(item.genre ?? 9999), keyword: String(item.keyword ?? ""),
    general_all_no: Number(item.general_all_no ?? 0), novelupdated_at: String(item.novelupdated_at ?? ""),
  };
}

export async function getTableOfContents(ncode: string, site: SiteMode = "narou"): Promise<TocEntry[]> {
  const resp = await fetch(`${getSiteBase(site)}/${ncode.toLowerCase()}/`, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "ja,en-US;q=0.9", Cookie: "over18=yes" },
  });
  if (!resp.ok) throw new Error(`目次取得エラー: ${resp.status}`);
  const html = await resp.text();
  const entries: TocEntry[] = [];
  const ncLower = ncode.toLowerCase();

  // Only match episode links that contain the ncode in the path
  const epRegex = new RegExp(`<a[^>]*href="[^"]*/${ncLower}/(\\d+)/"[^>]*>([\\s\\S]*?)<\\/a>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = epRegex.exec(html)) !== null) {
    const num = parseInt(match[1], 10);
    const title = stripTags(match[2]).trim();
    if (num > 0 && title && !title.includes("次へ") && !title.includes("前へ")
      && !title.includes("感想") && !title.includes("レビュー")) {
      entries.push({ number: num, title, chapter: "" });
    }
  }

  return entries;
}

export async function getEpisodeContent(ncode: string, episode: number, site: SiteMode = "narou"): Promise<EpisodeContent> {
  const base = getSiteBase(site);
  const url = episode === 0
    ? `${base}/${ncode.toLowerCase()}/`
    : `${base}/${ncode.toLowerCase()}/${episode}/`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en-US;q=0.9",
      Cookie: "over18=yes",
    },
  });
  if (!resp.ok) throw new Error(`本文取得エラー: ${resp.status}`);
  const html = await resp.text();

  // subtitle
  const subtitleMatch = html.match(/<p[^>]*class="[^"]*p-novel__title[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    ?? html.match(/<[^>]*class="[^"]*novel_subtitle[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
  let subtitle = subtitleMatch ? stripTags(subtitleMatch[1]).trim() : "";

  // フォールバック: <title>作品名 - サブタイトル</title> から抽出
  if (!subtitle) {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch && titleMatch[1].includes(" - ")) {
      subtitle = titleMatch[1].split(" - ").slice(1).join(" - ").trim();
    }
  }

  // body - extract novel text
  let bodyHtml = "";

  // 方法1: <p id="L数字"> または <p id="Lp数字">(まえがき) <p id="La数字">(あとがき) を全て抽出
  const pTagRegex = /<p id="L[pa]?\d+"[^>]*>[\s\S]*?<\/p>/gi;
  const pTags = html.match(pTagRegex);
  if (pTags && pTags.length > 0) {
    bodyHtml = pTags.join("\n");
  }

  // フォールバック: 旧デザイン novel_honbun
  if (bodyHtml.trim().length < 50) {
    const oldMatch = html.match(/<div[^>]*id="novel_honbun"[^>]*>([\s\S]+?)<\/div>/i);
    if (oldMatch && oldMatch[1].trim().length > 50) {
      bodyHtml = oldMatch[1];
    }
  }
  bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");

  let totalEpisodes = 0;
  let prevNumber: number | null = episode > 1 ? episode - 1 : null;
  let nextNumber: number | null = null;

  // 話数検出: なろう公式のページ番号表示 "XX/YY" をノード内テキストから取得
  // class="p-novel__number" または id="novel_no" 内のパターンのみを対象にする
  const novelNoMatch = html.match(/<[^>]*(?:class="[^"]*p-novel__number[^"]*"|id="novel_no")[^>]*>[^<]*?(\d+)\s*\/\s*(\d+)/i);
  if (novelNoMatch) {
    totalEpisodes = parseInt(novelNoMatch[2], 10);
    if (episode < totalEpisodes) nextNumber = episode + 1;
  } else {
    // フォールバック: 次へリンクの存在で判定
    if (html.includes("c-pager__item--next") || html.includes("novel_bn_next")) {
      nextNumber = episode + 1;
    }
  }

  return { subtitle, body_html: bodyHtml, prev_number: prevNumber, next_number: nextNumber, total_episodes: totalEpisodes };
}

export function extractParagraphs(bodyHtml: string): string[] {
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(bodyHtml)) !== null) {
    const text = stripTags(match[1]).replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
    if (text) paragraphs.push(text);
  }
  if (paragraphs.length === 0) {
    paragraphs.push(...bodyHtml.split(/<br\s*\/?>/gi).map(l => stripTags(l).trim()).filter(l => l.length > 0));
  }
  return paragraphs;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatLength(length: number): string {
  if (length >= 10_000) return `${(length / 10_000).toFixed(1)}万字`;
  return `${length.toLocaleString()}字`;
}


/** タイトル先頭の【...】や《...》や[...]のタグ情報を除去 */
export function cleanTitle(title: string): string {
  return title
    .replace(/^(\s*(【[^】]*】|《[^》]*》|\[[^\]]*\])\s*)+/, "")
    .trim();
}


/** お気に入りの更新日・全話数を一括取得（ncodeリストからAPI取得） */
export async function fetchBulkUpdated(
  ncodes: { ncode: string; site: SiteMode }[]
): Promise<Record<string, { novelupdated_at: string; general_all_no: number }>> {
  const result: Record<string, { novelupdated_at: string; general_all_no: number }> = {};

  // なろう・ノクターンを分離
  const narouCodes = ncodes.filter(n => n.site === "narou").map(n => n.ncode);
  const nocCodes = ncodes.filter(n => n.site === "nocturne").map(n => n.ncode);

  const fetchBatch = async (codes: string[], apiBase: string, site: SiteMode) => {
    if (codes.length === 0) return;
    // APIは一度に最大500件
    const q = new URLSearchParams({
      out: "json",
      ncode: codes.join("-"),
      of: "n-nu-ga",
      lim: String(codes.length),
    });
    try {
      const resp = await fetch(`${apiBase}?${q}`, { headers: { "User-Agent": UA } });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!Array.isArray(data)) return;
      for (let i = 1; i < data.length; i++) {
        const item = data[i];
        const ncode = String(item.ncode ?? "").toUpperCase();
        if (ncode) {
          result[`${site}:${ncode}`] = {
            novelupdated_at: String(item.novelupdated_at ?? ""),
            general_all_no: Number(item.general_all_no ?? 0),
          };
        }
      }
    } catch {}
  };

  await Promise.all([
    fetchBatch(narouCodes, NAROU_API, "narou"),
    fetchBatch(nocCodes, R18_API, "nocturne"),
  ]);

  return result;
}
