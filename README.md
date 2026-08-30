# Daydream — なろう/ノクターン モバイルリーダー

小説家になろう・ノクターンノベルズの作品をスマホで快適に閲覧できるモバイルアプリ。  
React Native (Expo SDK 57) で構築。バックエンド不要、全データはデバイス内で完結。

## 機能一覧

- 📚 **お気に入り管理** — 最終更新日順ソート、読了進捗表示、タップで続きから直接再開、API自動更新
- 🔍 **統合小説検索** — なろう/ノクターン切替、ジャンル・ソート順フィルタ、除外フィルタ（BL/GL/恋愛）
- 📖 **縦書き/横書きリーダー** — WebView + CSS writing-mode、縦中横対応、スワイプで前後話切替
- 📍 **スクロール位置記憶** — 話の途中で閉じても次回同じ位置から再開
- ✅ **読了管理** — 最後までスクロールして初めて読了判定
- 🔊 **TTS読み上げ** — expo-speech、速度調整（0.75x〜2x）
- 🌓 **ダーク/ライト/システムテーマ** — 全画面対応
- ⚙ **設定** — 書体、文字サイズ、行間、字間、表示方向、除外フィルタ
- 🏷️ **タイトルクリーニング** — 先頭の【タグ】を自動除去
- 📱 **完全ローカル** — クラウド接続なし、アンインストールで全データ削除
- 💾 **本文キャッシュ** — 最新10話分をローカル保存、オフライン再読可能

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | React Native (Expo SDK 57) |
| ナビゲーション | React Navigation (native-stack) v7 |
| データ保存 | AsyncStorage |
| リーダー | react-native-webview (CSS vertical-rl) |
| スライダー | @react-native-community/slider |
| スワイプ | react-native-gesture-handler + reanimated |
| TTS | expo-speech |
| 言語 | TypeScript 6 |
| ランタイム | React 19.2 / React Native 0.86 |

## セットアップ

```bash
cd mobile
npm install
npx expo start
```

Expo Go（最新版）でQRコードをスキャンして起動。

### 注意事項

- Expo Go は最新 SDK のみサポート（SDK 57）
- PCとスマホは同じ Wi-Fi に接続
- **OneDrive 同期が有効だと Metro がクラッシュすることがある** → 同期を一時停止推奨

## ディレクトリ構成

```
mobile/
├── App.tsx                  # ルート（NavigationContainer + ThemeProvider）
├── assets/
│   └── icon.png             # アプリアイコン（1024x1024）
├── screens/
│   ├── HomeScreen.tsx       # お気に入り一覧
│   ├── SearchScreen.tsx     # 検索（フィルタ・ソート付き）
│   ├── NovelDetailScreen.tsx # 作品情報 + 話数選択
│   ├── ReaderScreen.tsx     # リーダー画面（ヘッダー/フッター/WebView統合）
│   ├── InlinePlayer.tsx     # TTS インラインプレイヤー
│   ├── SettingsScreen.tsx   # 設定画面
│   └── Slider.tsx           # カスタムスライダー（話数選択用）
├── lib/
│   ├── api.ts               # なろうAPI + スクレイピング
│   ├── cache.ts             # エピソード本文キャッシュ（LRU 10件）
│   ├── readerHtml.ts        # リーダー用 HTML/CSS/JS 生成
│   ├── storage.ts           # AsyncStorage お気に入り/スクロール位置管理
│   ├── settings.ts          # 設定型定義 + 永続化
│   ├── speech.ts            # TTS エンジン（expo-speech）
│   ├── ThemeContext.tsx      # テーマ Context（dark/light/system）
│   ├── types.ts             # 型定義
│   └── utils.ts             # 共通ユーティリティ（文字列処理・フォーマット）
├── app.json                 # Expo 設定
├── tsconfig.json
└── package.json
```

## アーキテクチャ

```
App.tsx (ThemeProvider + NavigationContainer)
  ├── screens/ ─── 画面コンポーネント（表示ロジック）
  └── lib/     ─── ビジネスロジック・データ層
        ├── api.ts        HTTP通信・HTMLパース
        ├── readerHtml.ts リーダーHTML生成（CSS writing-mode）
        ├── storage.ts    永続化（AsyncStorage）
        ├── cache.ts      本文LRUキャッシュ
        ├── settings.ts   設定スキーマ・保存/読込
        ├── speech.ts     TTSエンジン（シングルトン）
        ├── utils.ts      純粋関数ユーティリティ
        └── types.ts      共有型定義
```

## 画面遷移

```
お気に入りリスト
  ├→ リーダー（読みかけ作品タップ → 最後に開いていた話の続きから再開）
  ├→ 作品詳細（未読作品タップ）
  │     └→ リーダー（話数選択 → 読む）
  ├→ 検索（FABボタン）
  │     └→ 作品詳細（検索結果タップ）
  │           └→ リーダー
  └→ 設定（⚙ フロートボタン）

リーダー → 戻る → 常に作品詳細
```

## API使用

| 通信先 | 用途 |
|--------|------|
| api.syosetu.com | 検索・作品メタ情報取得 |
| ncode.syosetu.com | 本文スクレイピング（縦書きリーダー用） |
| novel18.syosetu.com | ノクターン本文スクレイピング |

すべてアプリから直接通信（バックエンドサーバーなし）。  
本文パースは `<p id="L数字">` タグ抽出方式。サブタイトルは `<title>` タグからフォールバック取得。

## ライセンス

Private

## 今後の展望

- **Windows デスクトップ版** — Tauri + React で軽量デスクトップアプリ化を検討。リーダー（WebView + HTML/CSS）と API ロジックはモバイル版から共有可能。
