# Daydream — Specifications

**Version**: 0.5.0  
**Platform**: Android (React Native / Expo)  
**Last Updated**: 2026-08-26

---

## 1. プロダクト概要

Daydream は、小説家になろう / ノクターンノベルズの作品をスマートフォンで快適に閲覧するためのモバイルリーダーアプリ。バックエンドサーバー不要で、アプリから直接 API 通信・スクレイピングを行う完全ローカル設計。

### 1.1 ターゲットユーザー

- なろう小説の読者
- ノクターンノベルズ（R18）の読者
- 縦書き表示で日本語小説を読みたいユーザー

### 1.2 コアバリュー

- 縦書き / 横書き切替可能なビューアー
- TTS 音声読み上げ（デバイス内蔵エンジン）
- お気に入り管理（既読管理・更新日ソート）
- 検索フィルタ（ジャンル・ソート・除外フィルタ）
- ダーク/ライト/システムテーマ
- 完全ローカル（クラウド接続なし）

---

## 2. 画面構成

### 2.1 ホーム画面（お気に入りリスト）

| 項目 | 仕様 |
|------|------|
| 表示内容 | 更新日、タイトル（先頭タグ除去）、作者名、読了進捗 |
| ソート | 最終更新日が新しい順 |
| 操作（読みかけ） | タップでリーダーに直接遷移（最後に開いた話 + スクロール位置から再開） |
| 操作（未読） | タップで作品詳細に遷移 |
| 空状態 | 「お気に入りがありません」+ 検索ボタン |
| FAB | 右下に検索ボタン（bottom: 48px でナビバー回避） |
| 設定FAB | 右上 ⚙ ボタン（リーダー/設定画面では非表示） |
| 更新日自動取得 | 表示時にAPIで全お気に入りの更新日・全話数を一括取得し反映 |

### 2.2 検索画面

| 項目 | 仕様 |
|------|------|
| サイト切替 | なろう / ノクターン タブ |
| 検索入力 | タイトル・作者名・キーワード |
| フィルタ | デフォルト非表示、トグルで展開 |
| ジャンル | なろうのみ、折り返しチップ表示 |
| ソート | 総合評価/ブクマ数/レビュー/週間pt/日間pt/月間pt/新着 |
| 除外フィルタ | 設定画面の excludePreset に連動（BL/GL除外） |
| 結果表示 | 更新日、タイトル（タグ除去）、作者、あらすじ、話数/文字数/ブクマ/pt |

### 2.3 作品詳細画面

| 項目 | 仕様 |
|------|------|
| 表示 | サイトバッジ、タイトル、作者、更新日、あらすじ、キーワード |
| お気に入り | 右上 ☆/★ アイコン |
| 話数選択 | 数値入力 + スライダー + 「第X話を読む」ボタン |
| 読了表示 | 話数選択カード内に「📖 X/Y話 読了」 |
| デフォルト話数 | lastReadEpisode + 1（未読の場合は1） |

### 2.4 リーダー画面

| 項目 | 仕様 |
|------|------|
| レイアウト | 設定の layout に基づき縦書き/横書き切替 |
| 実装 | WebView + HTML/CSS（writing-mode: vertical-rl） |
| フォント | 設定の fontFamily に連動（明朝/ゴシック/システム） |
| サイズ | 設定の fontSize に連動（14/16/18/21px） |
| 行間 | 設定の lineHeight に連動（1.5〜3.0） |
| 字間 | 設定の letterSpacing に連動（0〜0.15em） |
| 縦中横 | 1-2桁数字、!?組み合わせ |
| 字下げ | なし（段落先頭の全角スペース除去） |
| ダークモード | 背景 #1A1A1D、テキスト #E5E5E5 |
| ヘッダー | ← 戻る + サブタイトル + TTS（▶⏸■ + 速度） |
| フッター | 前話/次話ボタン（話数表示、縦書き時は左右逆転） |
| 読了判定 | 最後までスクロール（残り20px以内）で読了記録 |
| スクロール位置 | 500msデバウンスで保存、次回復元（話の途中から再開可能） |
| 最後に開いた話 | エピソード表示時に保存、お気に入りリストから直接再開に使用 |
| 戻るボタン | 常に作品詳細画面に遷移 |
| スワイプ前後話 | 縦書き: 先頭で左スワイプ→前話、末尾で右スワイプ→次話 / 横書き: 先頭で下スワイプ→前話、末尾で上スワイプ→次話 |
| 読書進捗 | 読了時に AsyncStorage に記録 |

### 2.5 設定画面

| 設定項目 | 選択肢 |
|----------|--------|
| テーマ | ☀️ ライト / 🌙 ダーク / 📱 システム |
| 除外フィルタ | なし / BL/GL除外 / 恋愛除外 / 強力除外 |
| 表示方向 | 縦書き / 横書き |
| 書体 | 明朝体 / ゴシック体 / システム |
| 文字サイズ | 小(14px) / 中(16px) / 大(18px) / 特大(21px) |
| 行間 | 1.5〜3.0（スライダー） |
| 字間 | 0〜0.15em（スライダー） |
| プレビュー | 縦書き時はWebView、横書き時はText表示 |

---

## 3. 技術アーキテクチャ

### 3.1 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | React Native (Expo SDK 57) |
| ナビゲーション | @react-navigation/native-stack v7 |
| データ永続化 | @react-native-async-storage/async-storage |
| リーダー | react-native-webview |
| スライダー | @react-native-community/slider |
| スワイプ削除 | react-native-gesture-handler / react-native-reanimated |
| TTS | expo-speech |
| 言語 | TypeScript 6.0 |
| ランタイム | React 19.2.3 / React Native 0.86.2 |

### 3.2 データモデル

**FavoriteNovel:**
```typescript
{
  ncode: string;
  site: "narou" | "nocturne";
  title: string;
  writer: string;
  story?: string;
  addedAt: string;          // ISO date
  lastUpdated?: string;     // novelupdated_at
  lastReadEpisode?: number;
  totalEpisodes?: number;
}
```

**AppSettings:**
```typescript
{
  theme: "light" | "dark" | "system";
  excludePreset: "none" | "light" | "medium" | "strong";
  reader: {
    layout: "vertical" | "horizontal";
    fontFamily: "mincho" | "gothic" | "system";
    fontSize: "sm" | "md" | "lg" | "xl";
    lineHeight: number;       // 1.5〜3.0
    letterSpacing: number;    // 0〜0.15
  };
}
```

### 3.3 ストレージキー

| キー | 内容 |
|------|------|
| `@daydream/favorites` | お気に入り配列 (JSON) |
| `@daydream/settings` | 設定オブジェクト (JSON) |
| `@daydream/episode-cache` | 本文キャッシュ (JSON, LRU 10件) |
| `@daydream/scroll-positions` | スクロール位置 (JSON, site:ncode:ep → number) |
| `@daydream/last-opened` | 最後に開いたエピソード (JSON, site:ncode → number) |

アンインストール時に自動削除（Android アプリサンドボックス）。

### 3.4 本文キャッシュ

| 項目 | 仕様 |
|------|------|
| 方式 | LRU（Least Recently Used） |
| 保持件数 | 最新10話分 |
| キー形式 | `site:ncode:episode` |
| データ | EpisodeContent（subtitle, body_html, prev/next, total） |
| ヒット時 | ネットワーク通信なし（オフライン再読可能） |
| 保存タイミング | ネットワークから取得成功時 |

### 3.5 外部通信

| エンドポイント | 用途 |
|----------------|------|
| `api.syosetu.com/novelapi/api/` | なろう検索・メタ情報 |
| `api.syosetu.com/novel18api/api/` | ノクターン検索・メタ情報 |
| `ncode.syosetu.com/{ncode}/{ep}/` | なろう本文 HTML |
| `novel18.syosetu.com/{ncode}/{ep}/` | ノクターン本文 HTML |

Cookie: `over18=yes`（ノクターン用）  
User-Agent: Android Chrome 模倣

**本文HTMLパース:**
以下のパターンを優先度順に試行:
1. `<p id="L数字">` / `<p id="Lp数字">` / `<p id="La数字">` — 全段落タグを抽出・連結
2. `<div id="novel_honbun">` — 旧デザイン フォールバック

**サブタイトル取得:**
1. `<p class="p-novel__title">` — 新デザイン
2. `<... class="novel_subtitle">` — 旧デザイン
3. `<title>作品名 - サブタイトル</title>` — フォールバック

**話数パース:**
`<... class="p-novel__number">` または `<... id="novel_no">` 内の `XX/YY` パターンのみ対象。取得できない場合はお気に入り保存時の `general_all_no`（API値）をフォールバック使用。

---

## 4. TTS 読み上げ

| 項目 | 仕様 |
|------|------|
| エンジン | expo-speech（OS内蔵TTS） |
| 言語 | ja-JP |
| チャンク分割 | 200文字ごと、文末（。！？改行）で区切り |
| 速度 | 0.75x / 1x / 1.25x / 1.5x / 2x |
| UI | ヘッダー右: ▶⏸ / ■ / 速度バッジ |
| 画面遷移時 | 自動停止 |
| エラー時 | 次チャンクに自動スキップ |

---

## 5. テーマ

### ライトモード
```
background: #F5F5F8
card: #FFFFFF
text: #111113
textSub: #5A5A5E
textMuted: #8E8E93
border: #E5E5EA
accent: #6366F1
```

### ダークモード
```
background: #1A1A1D
card: #232326
text: #F0F0F0
textSub: #A0A0A5
textMuted: #6E6E73
border: #3A3A3D
accent: #818CF8
```

---

## 6. タイトルクリーニング

タイトル先頭の以下パターンを自動除去:
- `【...】`
- `《...》`
- `[...]`

末尾のタグは残す。

---

## 7. 縦中横 (tcy)

縦書き表示時に以下を横組み変換:
- 1〜2桁の半角数字: `12` → `<span class="tcy">12</span>`
- 記号の2文字組み合わせ: `!?` → `<span class="tcy">!?</span>`

HTMLタグ内のテキストには適用しない（タグ部分をスキップ）。

---

## 8. 除外フィルタ

| プリセット | API パラメータ |
|------------|----------------|
| none | フィルタなし |
| light | notbl=1, notgl=1 |
| medium | notbl=1, notgl=1 + 恋愛ジャンル除外 |
| strong | notbl=1, notgl=1 + 恋愛除外 + 除外ワード |

---

## 9. アセット

| ファイル | 用途 | サイズ |
|----------|------|--------|
| `assets/icon.png` | アプリアイコン + adaptive icon 前景 | 1024×1024 px |

---

## 10. 今後の展望

### Windows デスクトップ版

| 項目 | 内容 |
|------|------|
| 候補技術 | Tauri (Rust + WebView) |
| UI | React (Vite) — モバイル版のロジックを共有 |
| 共有可能コード | `lib/api.ts`, `lib/types.ts`, リーダー HTML/CSS テンプレート, 縦中横変換 |
| TTS | Windows SAPI |
| データ保存 | ローカルファイル or SQLite |
| 配布 | MSIXまたはポータブル exe |

---

## ライセンス

Private
