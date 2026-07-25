# Daydream — なろう/ノクターン 統合Webリーダー

小説家になろう・ノクターンノベルズの作品を美しいUIで快適に閲覧できる統合Webリーダー。Firebase Auth によるユーザー認証、Firestore によるお気に入りデータのクラウド同期に対応。

## 公開URL

https://daydream-2025.web.app

## 機能一覧

- 🔐 **Firebase Auth（Googleログイン）** — ワンクリックでGoogleアカウント認証
- 🔄 **Firestore同期** — お気に入り・既読データをデバイス間でリアルタイム同期
- 📚 **お気に入り管理** — 既読管理、更新通知、手動並べ替え、カード/リスト切替、スワイプ削除
- 🔍 **統合小説検索** — 小説家になろう / ノクターンノベルズをプルダウンで切替
- 📖 **縦書き/横書きリーダー** — 縦中横対応、フォント・サイズ・行間・字間カスタマイズ（フォールバック: 外部リンク）
- 🔊 **TTS音声読み上げ** — Web Speech API による読み上げ
- 🛡️ **スコアリング除外フィルタ** — 女性向け作品のインテリジェントな除外
- 🌓 **ダーク/ライト/システムテーマ**
- 📱 **モバイルファースト** — スマホ最適化UI、スティッキーヘッダー、44pxタップ領域
- ⏭️ **スマート続き読み** — お気に入りから未読話に直接遷移
- 🏷️ **OGPメタタグ対応** — SNS共有時にリッチプレビュー表示

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Python 3.12+ / FastAPI / httpx / BeautifulSoup4 |
| フロントエンド | React 19 / TypeScript 5.8 / Vite 6 / Tailwind CSS 4 |
| 認証 | Firebase Authentication（Google Sign-In） |
| データベース | Cloud Firestore（お気に入り・既読データ同期） |
| ホスティング | Firebase Hosting（フロントエンド） |
| API サーバー | Cloud Run（バックエンド） |
| アニメーション | Framer Motion 12 |
| アイコン | Lucide React |
| TTS | Web Speech API |

## セットアップ（ローカル開発）

### バックエンド

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### 環境変数

`frontend/.env.local` に以下を設定:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=daydream-2025.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=daydream-2025
VITE_FIREBASE_STORAGE_BUCKET=daydream-2025.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### アクセス（ローカル）

- http://localhost:5173（フロントエンド）
- http://localhost:8000/docs（APIドキュメント）

## デプロイ

### フロントエンド（Firebase Hosting）

```bash
cd frontend
npm run deploy
```

### バックエンド（Cloud Run）

```bash
cd backend
gcloud run deploy daydream-api --source . --region asia-northeast1 --allow-unauthenticated
```

## 本文表示のフォールバック

- **ローカル開発時**: バックエンドがなろうサイトから本文HTMLをスクレイピング → アプリ内縦書きリーダーで表示
- **デプロイ版（Cloud Run）**: GCPのIPがなろうにブロックされるため403エラー → 自動的に外部リンク（なろうサイトを新タブ）にフォールバック

## API エンドポイント

| パス | 説明 |
|------|------|
| `/api/narou/search` | なろう小説検索 |
| `/api/narou/bulk-updated` | 最終更新日一括取得 |
| `/api/narou/novel/{ncode}/info` | 作品メタ情報取得（公式API） |
| `/api/narou/novel/{ncode}/{ep}` | エピソード本文取得（スクレイピング） |
| `/api/nocturne/search` | ノクターン検索 |
| `/api/nocturne/bulk-updated` | 最終更新日一括取得（R18） |
| `/api/nocturne/novel/{ncode}/info` | 作品メタ情報取得（R18 API） |
| `/api/nocturne/novel/{ncode}/{ep}` | エピソード本文取得（スクレイピング） |

## ライセンス

Private
