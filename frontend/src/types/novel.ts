/**
 * なろう小説メタ情報
 */
export interface NovelMeta {
  ncode: string;
  title: string;
  writer: string;
  story: string;
  genre: number;
  keyword: string;
  general_all_no: number;
  length: number;
  fav_novel_cnt: number;
  review_cnt: number;
  all_point: number;
  daily_point: number;
  weekly_point: number;
  monthly_point: number;
  global_point: number;
  novelupdated_at?: string;  // "YYYY-MM-DD HH:MM:SS"
}

/**
 * ランキングAPIレスポンス
 */
export interface RankingResponse {
  allcount: number;
  novels: NovelMeta[];
}

/**
 * ジャンル情報
 */
export interface Genre {
  code: number;
  name: string;
}

/**
 * ジャンルコード → 表示名マッピング
 */
export const GENRE_MAP: Record<number, string> = {
  101: "異世界〔恋愛〕",
  102: "現実世界〔恋愛〕",
  201: "ハイファンタジー",
  202: "ローファンタジー",
  301: "純文学",
  302: "ヒューマンドラマ",
  303: "歴史",
  304: "推理",
  305: "ホラー",
  306: "アクション",
  307: "コメディー",
  401: "VRゲーム〔SF〕",
  402: "宇宙〔SF〕",
  403: "空想科学〔SF〕",
  404: "パニック〔SF〕",
  9901: "童話",
  9902: "詩",
  9903: "エッセイ",
  9904: "リプレイ",
  9999: "その他",
  9801: "ノンジャンル",
};


/**
 * 除外フィルタ設定
 */
export interface ExcludeFilters {
  notbl?: boolean;
  notgl?: boolean;
  notgenre?: string;       // ハイフン区切り: "101-102"
  notbiggenre?: string;    // ハイフン区切り: "1"
  notword?: string;        // スペース区切りの除外ワード（API側）
  clientExcludeWords?: string[]; // 廃止予定（後方互換）
  /**
   * スコアリングベースのクライアント側フィルタ。
   * 各ワードにスコアを割り当て、合計がthresholdを超えたら除外。
   * これにより「令嬢」単体では除外されないが「令嬢+婚約+溺愛」のように
   * 女性向けシグナルが重なった場合のみ除外される。
   */
  clientScoreFilter?: {
    words: { word: string; score: number }[];
    threshold: number;
  };
}

/**
 * 女性向け除外プリセット
 */
export const EXCLUDE_PRESETS = {
  none: {
    label: "フィルタなし",
    filters: {} as ExcludeFilters,
  },
  light: {
    label: "BL/GL除外",
    filters: { notbl: true, notgl: true } as ExcludeFilters,
  },
  medium: {
    label: "女性向け軽減",
    filters: {
      notbl: true,
      notgl: true,
      notgenre: "101-102",  // 恋愛ジャンル除外
    } as ExcludeFilters,
  },
  strong: {
    label: "女性向け強力除外",
    filters: {
      notbl: true,
      notgl: true,
      notbiggenre: "1",     // 大ジャンル「恋愛」全体除外
      notword: "乙女ゲー 悪役令嬢 逆ハーレム 婚約破棄",
      clientScoreFilter: {
        // スコア合計が3以上で除外
        threshold: 3,
        words: [
          // 確定的に女性向け（単体で除外）
          { word: "乙女ゲー", score: 5 },
          { word: "逆ハーレム", score: 5 },
          { word: "悪役令嬢", score: 5 },
          { word: "婚約破棄", score: 4 },
          // 女性向けの強いシグナル
          { word: "溺愛", score: 3 },
          { word: "聖女", score: 2 },
          { word: "寵愛", score: 3 },
          { word: "後宮", score: 2 },
          // 弱いシグナル（組み合わせで除外）
          { word: "令嬢", score: 2 },
          { word: "妃", score: 1 },
          { word: "皇后", score: 2 },
          { word: "侯爵令嬢", score: 3 },
          { word: "公爵令嬢", score: 3 },
          { word: "伯爵令嬢", score: 3 },
          { word: "婚約者", score: 1 },
          { word: "断罪", score: 2 },
          { word: "追放された", score: 1 },
        ],
      },
    } as ExcludeFilters,
  },
} as const;

export type ExcludePreset = keyof typeof EXCLUDE_PRESETS;

/**
 * サイトモード切替
 */
export type SiteMode = "narou" | "nocturne";
