# Daydream — Specifications

**Version**: 0.5.0  
**Design Concept**: Marshmallow Aesthetic (Glassmorphism + Silver Shine)  
**Last Updated**: 2026-07-25

---

## 1. プロダクト概要

Daydreamは、小説家になろう / ノクターンノベルズの作品を美しいUIで閲覧するための統合Webリーダーアプリケーションです。Marshmallowプロジェクトのデザインコンセプト（グラスモフィズム + シルバーシャイン）を踏襲し、心地よい読書体験を提供します。

### 1.1 ターゲットユーザー

- なろう小説の読者
- ノクターンノベルズ（R18）の読者
- 美しいUIで快適に小説を読みたいユーザー
- 縦書き表示で日本語小説を読みたいユーザー

### 1.2 コアバリュー

- Marshmallow Aestheticによる洗練されたUI体験
- なろう / ノクターン両サイトの統合リーダー
- 縦書き / 横書き切替可能なビューアー
- Google Cloud TTS によるAI音声読み上げ
- スコアリングベースの除外フィルタによるコンテンツキュレーション
- お気に入り管理（既読管理・更新通知・手動並べ替え）
- Firebase Auth によるユーザー認証（Google Sign-In）
- Firestore によるお気に入りデータのクラウド同期
- Firebase Hosting + Cloud Run によるフルマネージドデプロイ
- モバイルファーストUI設計

---

## 2. 画面構成

### 2.1 ヘッダー・タブ構成

ホーム画面は **1行ヘッダー** に「タイトル + タブ切替 + 設定・ユーザーボタン」を配置。

**ヘッダーレイアウト:** `[Daydream] [♡|🔍] [⚙ 👤]`

- 左: アプリタイトル
- 中央: お気に入り / 検索 タブスイッチャー
- 右: 設定ボタン + ユーザーアバター（クリックでログアウト）

| タブ | 説明 |
|------|------|
| お気に入り | 登録した作品一覧。既読管理・更新日表示・手動並べ替え |
| 小説検索 | なろう/ノクターンの作品をキーワード・タグ・作者・ジャンルで検索 |

- タブ切替は `hidden` クラスによる非表示方式（状態を保持）
- ヘッダーは `sticky top-0 z-40` でスティッキー表示
- モバイルではアイコンのみ表示、PCではアイコン+ラベル

### 2.2 画面遷移

```
ホーム（お気に入り / 小説検索）
  ├→ 目次画面（NovelToc）
  │     └→ リーダー画面（NovelReader）
  └→ 設定画面（Settings）
```

ルーティングは `useState<AppView>` による簡易SPAルーティング。

### 2.3 スマートナビゲーション（skipTocOnContinue）

`skipTocOnContinue: true` の場合、お気に入りから作品をタップすると:
- 未読話がある場合 → 目次をスキップしてリーダーの続き（`lastReadEpisode + 1`）に直接遷移
- 最新話まで読了済み or 未読 → 通常通り目次に遷移

---

## 3. 機能仕様

### 3.1 お気に入り機能

Firestore に永続化されるお気に入り管理。リアルタイムリスナーでデバイス間同期。

| 項目 | 仕様 |
|------|------|
| データモデル | ncode, site, title, writer, story, addedAt, lastUpdated, order, lastReadEpisode, totalEpisodes |
| ソート順 | 更新が新しい順 / 登録が新しい順 / 登録が古い順 / 手動並べ替え |
| 表示モード | リスト表示 / カード表示（トグル切替、モバイルではリスト固定） |
| 手動並べ替え | HTML5 Drag & Drop API による並べ替え |
| 更新日取得 | なろう/ノクターン公式APIでncode一括取得（`/bulk-updated`） |
| 全話数表示 | `lastReadEpisode / totalEpisodes` 形式で進捗表示 |
| 既読管理 | リーダーでエピソード読了時に `updateReadProgress` で記録 |
| サイト区別 | バッジ表示（「なろう」/「N18」）— モバイルでは非表示 |
| スワイプ削除 | モバイルで左右スワイプ → 確認ダイアログ → 削除 |
| あらすじ | PCのみ表示（モバイルでは `hidden sm:block`） |

**既読表示（目次画面）:**
- `ep.number <= lastReadEpisode` の話は `opacity-50` で薄く表示
- 最後に読んだ話に「既読」バッジ (`text-[8px] bg-daydream-accent/10`) を表示

### 3.2 小説検索

なろう / ノクターンの公式APIパラメータを活用した検索機能。

| 検索パラメータ | 説明 |
|----------------|------|
| word | タイトル・あらすじからキーワード検索（AND検索） |
| keyword | タグ / キーワード検索 |
| writer | 作者名検索 |
| genre | ジャンル絞り込み（なろうのみ） |
| order | ソート順（8種） |
| limit | 表示件数（perPage設定に連動） |
| site | サイトプルダウン（「小説家になろう」/「ノクターンノベルズ」） |

**ソート順（8種）:**
総合評価、ブクマ数、レビュー数、週間UP、日間pt、週間pt、月間pt、新着

**perPage設定:** 20 / 50 / 100 の3段階。設定画面から変更可能。

**検索UI:**
- メイン検索バー（タイトル・あらすじ）
- フィルタパネル（**デフォルトで展開**）: サイト選択、タグ、作者名、ジャンル
- ソート順ボタン群
- 結果件数表示 + クリアボタン
- 検索未実行時: プレースホルダ表示（「キーワードを入力して検索してください」）


### 3.3 スコアリングベースの除外フィルタ

検索結果から特定ジャンルの作品を除外するプリセットシステム。

| プリセット | 説明 |
|------------|------|
| none | フィルタなし |
| light | BL/GL除外（API側 `notbl`, `notgl`） |
| medium | BL/GL除外 + 恋愛ジャンル除外（`notgenre: "101-102"`） |
| strong | BL/GL除外 + 恋愛大ジャンル除外 + 除外ワード + スコアリングフィルタ |

**スコアリングフィルタ（`clientScoreFilter`）の仕組み:**

クライアントサイドで実行。各作品の `story + title + keyword` に対してスコアワードを走査し、合計スコアが `threshold` 以上になったら除外。

```
threshold: 3

確定除外（単体でthreshold超え）:
  乙女ゲー(5), 逆ハーレム(5), 悪役令嬢(5), 婚約破棄(4)

強シグナル:
  溺愛(3), 寵愛(3), 侯爵令嬢(3), 公爵令嬢(3), 伯爵令嬢(3)

弱シグナル（組み合わせで除外）:
  令嬢(2), 聖女(2), 後宮(2), 皇后(2), 断罪(2), 妃(1), 婚約者(1), 追放された(1)
```

これにより「令嬢」単体では除外されないが、「令嬢 + 溺愛」のように女性向けシグナルが重なった場合のみ除外される。

### 3.4 目次表示

作品のNCODEから目次ページをスクレイピングして章構造を表示。

| 項目 | 仕様 |
|------|------|
| 対応UI | なろう新UI（`.p-novel__*`）/ 旧UI（`.novel_*`） |
| 章グルーピング | 章タイトルごとにセクション分け |
| 短編対応 | 目次なし作品は直接本文表示（`episode_number = 0`） |
| 表示情報 | タイトル、作者名、あらすじ、全N話 |
| 全ページ取得 | `.c-pager__item--last` からページ数を検出し、100話超の目次も全ページ巡回 |
| 既読表示 | `lastReadEpisode` 以下の話は薄表示 + 「既読」バッジ |
| アニメーション | stagger表示（delay: `(gi * 5 + ei) * 0.015`） |


### 3.5 小説リーダー（縦書き / 横書き）+ フォールバック

本文表示はフォールバック方式を採用:
- **バックエンドで本文取得成功** → アプリ内リーダーで表示（ローカル開発時）
- **バックエンドで本文取得失敗（403等）** → 外部リンクでなろうサイトを新タブで開く（デプロイ版）

**アプリ内リーダー（縦書きモード）:**
- `writing-mode: vertical-rl` による縦書き組版
- マウスホイール → 横スクロール変換
- タッチスワイプ対応
- エピソード切替時に開始位置へ自動スクロール

**アプリ内リーダー（横書きモード）:**
- 通常の縦スクロール

**共通機能:**
- フォントサイズ・書体・行間・字間のカスタマイズ（設定を反映）
- 前後話ナビゲーション
- TTS音声読み上げ（Web Speech API）
- 外部リンクボタン（常に表示、手動でなろうサイトを開ける）
- 既読進捗の自動記録
- 話数表示（XX/YY話）

### 3.6 縦中横（tcy.ts）

縦書き表示時に半角文字を横書き合成するユーティリティ。

**変換対象:**
- 2桁以下の半角数字 (`0`〜`99`)
- 2文字以下の半角アルファベット (`A`〜`ZZ`)
- 感嘆符・疑問符の組み合わせ (`!?`, `!!`, `?!`, `！？`, etc.)

**正規表現:**
```
/(?<![a-zA-Z0-9])([a-zA-Z]{1,2}|[0-9]{1,2}|[!?！？]{2})(?![a-zA-Z0-9])/g
```

- 前後の lookbehind/lookahead で、より長い英数字列内のマッチを防止
- HTMLタグ内は `split(/(<[^>]*>)/)` でテキスト部分のみに適用
- 変換結果: `<span class="tcy">$1</span>` → CSS `text-combine-upright: all`


### 3.7 TTS音声読み上げ

Web Speech API を使用したブラウザネイティブ音声合成。

| 項目 | 仕様 |
|------|------|
| API | Web Speech API (`speechSynthesis`) |
| 言語 | 日本語 (`ja-JP`) |
| 速度調整 | 0.5x 〜 2.0x |
| APIキー | 不要（ブラウザ内蔵） |

**動作:**
- 本文HTMLからテキストを抽出（`stripHtml`）
- `SpeechSynthesisUtterance` でブラウザ音声合成
- 再生/一時停止/停止コントロール
- 速度調整スライダー

**UIコントロール (SpeechPlayer):**
- `[▶ Play]` / `[⏸ Pause]` / `[■ Stop]`
- 速度表示（1.0x 等）


### 3.8 設定

| 設定項目 | 説明 |
|----------|------|
| テーマ | Light / Dark / System の3モード切替 |
| 除外フィルタ | 4段階のプリセット選択 |
| ビューアーレイアウト | 縦書き / 横書きのデフォルト |
| フォント書体 | 明朝 / ゴシック / システム |
| フォントサイズ | 小 / 中 / 大 / 特大 |
| 行間 | 1.5〜3.0（スライダー） |
| 字間 | 0〜0.15em（スライダー） |
| 表示件数 (perPage) | 20 / 50 / 100 |
| 目次スキップ (skipTocOnContinue) | お気に入りから続きを直接開く ON/OFF |

設定画面にはプレビュー表示あり（夏目漱石「吾輩は猫である」冒頭）。
全設定は `localStorage` に永続化。

---

## 4. 技術アーキテクチャ

### 4.1 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Python 3.12+ / FastAPI 0.115 / httpx 0.27 / BeautifulSoup4 (lxml) / Pydantic 2.9 |
| フロントエンド | React 19 / TypeScript 5.8 / Vite 6 |
| スタイリング | Tailwind CSS 4 (@tailwindcss/vite プラグイン) |
| アニメーション | Framer Motion 12 |
| アイコン | Lucide React |
| 認証 | Firebase Authentication（Google Sign-In） |
| データベース | Cloud Firestore（リアルタイム同期） |
| ホスティング | Firebase Hosting + Cloud Run |
| TTS | Google Cloud Text-to-Speech v1 (Chirp 3: HD) |
| ユーティリティ | clsx + tailwind-merge |

### 4.2 ディレクトリ構造

```
daydream/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI アプリ初期化、CORS、ルーター登録
│   │   ├── schemas.py           # Pydantic スキーマ定義
│   │   └── routers/
│   │       ├── narou.py         # なろうAPI + スクレイピング
│   │       └── nocturne.py      # ノクターンAPI + スクレイピング
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # ルートコンポーネント + ルーティング
│   │   ├── main.tsx             # エントリーポイント
│   │   ├── index.css            # デザイントークン、グラスモフィズム
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # 小説検索ダッシュボード
│   │   │   ├── FavoritesView.tsx # お気に入り一覧（カード/リスト）
│   │   │   ├── LoginScreen.tsx  # ログイン画面（Google Sign-In）
│   │   │   ├── NovelCard.tsx    # 作品カード
│   │   │   ├── NovelToc.tsx     # 目次表示
│   │   │   ├── NovelReader.tsx  # 小説リーダー（縦書き/横書き）
│   │   │   ├── Settings.tsx     # 設定画面
│   │   │   ├── SkeletonCard.tsx # ローディングスケルトン
│   │   │   └── SpeechPlayer.tsx # TTS再生コントロール
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # Firebase認証（Google Sign-In）
│   │   │   ├── useFavorites.ts  # お気に入り管理（Firestore同期）
│   │   │   ├── useSearch.ts     # 検索ロジック
│   │   │   ├── useSettings.ts   # 設定管理 + テーマ適用
│   │   │   └── useVerticalScroll.ts # 縦書きスクロール処理
│   │   ├── contexts/
│   │   │   └── SpeechContext.tsx # TTS音声エンジン（シングルトン）
│   │   ├── constants/
│   │   │   └── tts.ts           # TTS設定定数
│   │   ├── lib/
│   │   │   ├── firebase.ts      # Firebase初期化（Auth + Firestore）
│   │   │   ├── speech-utils.ts  # TTS用テキスト処理
│   │   │   ├── tcy.ts          # 縦中横変換ユーティリティ
│   │   │   └── utils.ts         # cn() ユーティリティ
│   │   └── types/
│   │       ├── novel.ts         # 小説メタ情報、ジャンル、フィルタ
│   │       ├── reader.ts        # 目次、エピソード、ルーティング状態
│   │       └── settings.ts      # 設定型定義、フォントオプション
│   ├── vite.config.ts           # Vite設定 + APIプロキシ
│   ├── tsconfig.json
│   └── package.json
├── specifications.md
├── firebase.json              # Firebase Hosting + Cloud Run rewrite設定
└── README.md
```


### 4.3 API エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/narou/search` | なろう小説検索 |
| GET | `/api/narou/bulk-updated` | 複数作品の最終更新日一括取得 |
| GET | `/api/narou/novel/{ncode}/toc` | なろう作品目次取得（全ページ巡回） |
| GET | `/api/narou/novel/{ncode}/{episode_number}` | なろうエピソード本文取得 |
| GET | `/api/nocturne/search` | ノクターン小説検索 |
| GET | `/api/nocturne/bulk-updated` | 複数作品の最終更新日一括取得（R18） |
| GET | `/api/nocturne/novel/{ncode}/toc` | ノクターン作品目次取得（全ページ巡回） |
| GET | `/api/nocturne/novel/{ncode}/{episode_number}` | ノクターンエピソード本文取得 |

**共通クエリパラメータ（検索）:**

| パラメータ | 型 | 説明 |
|------------|-----|------|
| word | string | タイトル・あらすじ検索 |
| keyword | string | タグ検索 |
| writer | string | 作者名検索 |
| genre | int | ジャンル絞り込み（なろうのみ） |
| order | string | ソート順 |
| limit | int (1-500) | 取得件数 |
| notbl | bool | BL除外 |
| notgl | bool | GL除外 |
| notgenre | string | 除外ジャンル（ハイフン区切り、なろうのみ） |
| notbiggenre | string | 除外大ジャンル（ハイフン区切り、なろうのみ） |
| notword | string | 除外キーワード |

### 4.4 状態管理

**クライアントサイドルーティング:**

`useState<AppView>` による簡易SPA ルーティング。

| ビュー | 状態 |
|--------|------|
| home | お気に入り / 小説検索（2タブ） |
| toc | 作品目次 |
| reader | 小説リーダー |
| settings | 設定画面 |

**お気に入り (useFavorites):**
- Firestore `users/{uid}/favorites/{docId}` に永続化
- `onSnapshot` リアルタイムリスナーでデバイス間同期
- `writeBatch` による一括更新（並べ替え・更新日）
- 既読管理（`updateReadProgress`）
- 一括更新日取得（`refreshLastUpdated`）
- 未ログイン時はローカルステートのみ（保存されない）

**設定 (useSettings):**
- `localStorage` に永続化
- テーマ適用（`.dark` クラス操作）
- システムテーマ変更のリアルタイム追従

**TTS (SpeechContext):**
- SpeechEngine シングルトン
- `useSyncExternalStore` で最小限の再レンダリング
- セッションIDによる競合防止


---

## 5. デザインシステム

### 5.1 カラーパレット

CSS変数 (`--dd-*`) ベースで定義。`.dark` クラス付与時にランタイムで切替。

**ライトモード:**
```
daydream-white:     #FDFDFD   — 基本背景
daydream-black:     #111113   — テキスト
daydream-silver:    #E6E6EB   — シルバー装飾
daydream-pearl:     #5A5A5E   — セカンダリテキスト
daydream-platinum:  #D2D2D8   — ボーダー・装飾
daydream-accent:    #6366F1   — アクセント（Indigo）
daydream-gray-50〜400          — 段階的グレー
background:         #F5F5F8   — アプリ全体背景
```

**ダークモード (`.dark` クラス適用時):**
```
daydream-white:     #18181B   — 暗い背景
daydream-black:     #EDEDF0   — 明るいテキスト
daydream-accent:    #818CF8   — アクセント（明るいIndigo）
background:         #09090B   — アプリ全体背景
```

### 5.2 タイポグラフィ

| 用途 | フォント |
|------|----------|
| 見出し・タイトル | Playfair Display, Noto Serif JP |
| 本文・UI | Inter, Noto Sans JP |
| 縦書き（明朝） | 游明朝, ヒラギノ明朝 ProN |
| 縦書き（ゴシック） | 游ゴシック, ヒラギノ角ゴ ProN |

### 5.3 エフェクト

- **グラスモフィズム**: `backdrop-filter: blur(20px)` + 半透明背景 + インナーシャドウ
- **シルバーシャイン**: ホバー時にカード上を走る光のアニメーション
- **カスタムイージング**: `cubic-bezier(0.23, 1, 0.32, 1)` による優雅なモーション
- **スプリングアニメーション**: Framer Motion によるページ遷移・リスト表示

---

## 6. モバイルUI仕様

| 項目 | 仕様 |
|------|------|
| ヘッダー | 1行スティッキー（`sticky top-0 z-40`） |
| タブ | アイコンのみ表示（`hidden sm:inline` でラベル非表示） |
| タップ領域 | 最小44px（`p-2 sm:p-2.5` ボタン） |
| カード/リスト切替 | モバイルではリスト固定（`hidden sm:flex` でトグル非表示） |
| スワイプ削除 | タッチ操作で80px以上スワイプ → 確認ダイアログ → 削除 |
| サイトバッジ | モバイルでは非表示（`hidden sm:inline-block`） |
| あらすじ | モバイルでは非表示（`hidden sm:block`） |
| 削除ボタン | モバイルではスワイプで代替（`hidden sm:block`） |
| セーフエリア | `env(safe-area-inset-*)` + `100dvh` |

---

## 7. レスポンシブ対応

| ブレークポイント | カラム数 |
|------------------|----------|
| モバイル (< 640px) | 1カラム |
| タブレット (640px〜1024px) | 2カラム |
| デスクトップ (1024px〜1280px) | 3カラム |
| ワイド (> 1280px) | 4カラム（検索結果のみ） |

**iOS対応:**
- `100dvh`, `-webkit-fill-available`
- `env(safe-area-inset-*)` によるノッチ対応
- `overscroll-behavior: none`

---

## 8. セキュリティ・注意事項

- Firebase Auth による認証ガード（未ログインユーザーはログイン画面にリダイレクト）
- Firestore セキュリティルールで `users/{uid}` 配下のデータは本人のみアクセス可能
- ノクターンへのアクセス時に `over18=yes` クッキーを自動セット
- Google Cloud TTS APIキーはクライアント側に露出（HTTPリファラー制限推奨）
- CORSは開発用ワイルドカード許可（本番では Firebase Hosting 経由でプロキシ）
- スクレイピング時は一般的なブラウザ User-Agent を使用

---

## 9. 認証

### 9.1 Firebase Authentication

| 項目 | 仕様 |
|------|------|
| プロバイダ | Google Sign-In (`signInWithPopup`) |
| 状態管理 | `onAuthStateChanged` リスナー |
| 認証ガード | 未認証ユーザーは `LoginScreen` を表示 |
| ユーザー表示 | ヘッダー右端にGoogleアバター画像 |
| ログアウト | アバタークリックで `signOut` 実行 |
| フォールバック | アバター未設定時は `LogOut` アイコンボタンを表示 |

### 9.2 認証フロー

```
アプリ起動
  ↓
onAuthStateChanged で認証状態を監視
  ↓
未認証 → LoginScreen（Google Sign-In ボタン）
  ↓ signInWithPopup
認証済み → メインUI表示
  ↓ アバタークリック
signOut → LoginScreen に戻る
```

---

## 10. データ永続化

### 10.1 Firestore 構造

```
users/
  {uid}/
    favorites/
      {site}_{NCODE}/     # docId 例: "narou_N1234AB"
        ncode: string
        site: "narou" | "nocturne"
        title: string
        writer: string
        story?: string
        addedAt: number (timestamp)
        lastUpdated?: string
        order?: number
        lastReadEpisode?: number
        totalEpisodes?: number
```

### 10.2 リアルタイム同期

- `onSnapshot` リスナーで Firestore → クライアントにリアルタイム反映
- 複数デバイス間で自動同期
- `orderBy("addedAt", "desc")` でソート済みデータを取得

### 10.3 バッチ書き込み

- 並べ替え操作: `writeBatch` で全ドキュメントの `order` フィールドを一括更新
- 更新日取得: `/bulk-updated` API結果を `writeBatch` で一括反映

### 10.4 設定データ

- ユーザー設定（テーマ・フィルタ・リーダー設定）は引き続き `localStorage` に保存
- デバイス固有の表示設定のためクラウド同期の対象外

---

## 11. デプロイ

### 11.1 構成

| コンポーネント | サービス | リージョン |
|----------------|----------|------------|
| フロントエンド | Firebase Hosting | グローバルCDN |
| バックエンドAPI | Cloud Run (`daydream-api`) | asia-northeast1 |
| 認証 | Firebase Authentication | — |
| データベース | Cloud Firestore | — |

### 11.2 firebase.json rewrite 設定

```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": { "serviceId": "daydream-api", "region": "asia-northeast1" }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

- `/api/**` → Cloud Run にルーティング（サーバーレスプロキシ）
- その他のパス → `index.html`（SPA fallback）

### 11.3 デプロイコマンド

**フロントエンド（ワンコマンド）:**
```bash
cd frontend
npm run deploy
# → tsc -b && vite build && firebase deploy --only hosting --project daydream-2025
```

**バックエンド:**
```bash
cd backend
gcloud run deploy daydream-api --source . --region asia-northeast1 --allow-unauthenticated
```

---

## 12. OGP メタタグ

`index.html` に Open Graph / Twitter Card メタタグを設定。

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Daydream — なろう/ノクターン 統合Webリーダー" />
<meta property="og:description" content="小説家になろう・ノクターンノベルズの作品を美しいUIで快適に閲覧..." />
<meta property="og:url" content="https://daydream-2025.web.app" />
<meta property="og:image" content="https://daydream-2025.web.app/ogp.png" />
<meta property="og:site_name" content="Daydream" />
<meta property="og:locale" content="ja_JP" />
<meta name="twitter:card" content="summary_large_image" />
```

OGP画像: `/public/ogp.png`

---

## 13. ライセンス

Private
