# Requirements Document

## Introduction

スクレイピングを完全に廃止し、なろう/ノクターン公式APIのみで動作する新しい作品情報表示・リーダーナビゲーション機能を設計する。Cloud Run上でncode.syosetu.comへのスクレイピングが403でブロックされる問題を根本的に解決する。

従来の目次ページ（各話サブタイトル一覧）は廃止し、公式APIから取得可能な全話数情報と話数指定ナビゲーションによって代替する。本文表示は、なろうサイトを新タブで直接開く方式（外部リンク）に切り替える。

## Glossary

- **Novel_API**: なろう公式小説API（`api.syosetu.com/novelapi/api/`）およびR18 API（`api.syosetu.com/novel18api/api/`）の総称
- **Novel_Info_View**: 従来の目次ページに代わる、公式APIから取得した作品メタ情報と話数ナビゲーションを表示する画面
- **Episode_Navigator**: ユーザーが任意の話数を選択するためのUI要素（数値入力またはスライダー）
- **External_Reader_Link**: なろう/ノクターンサイトの本文ページを新タブで開くためのリンク
- **Backend_API**: FastAPIバックエンドアプリケーション（Cloud Run上で動作）
- **Frontend**: Vite + React SPAフロントエンドアプリケーション
- **Ncode**: 小説家になろうの作品識別子（例: n1234ab）
- **SiteMode**: アプリケーション内で「narou」または「nocturne」を区別するフラグ

## Requirements

### Requirement 1: 公式APIによる作品メタ情報取得

**User Story:** As a ユーザー, I want 公式APIから作品の基本情報（タイトル、作者名、あらすじ、全話数）を取得したい, so that スクレイピングなしで作品情報を閲覧できる。

#### Acceptance Criteria

1. WHEN ユーザーが作品を選択した場合, THE Backend_API SHALL Novel_APIに対してncodeを指定したリクエストを送信し、タイトル、作者名、あらすじ、全話数（general_all_no）、最終更新日を含むメタ情報を返す
2. WHEN Novel_APIがエラーを返した場合, THE Backend_API SHALL HTTPステータスコードとエラーメッセージをFrontendに返す
3. THE Backend_API SHALL スクレイピング（BeautifulSoup等によるHTML解析）を一切使用せずに作品メタ情報を提供する

### Requirement 2: Novel_Info_Viewの表示

**User Story:** As a ユーザー, I want 作品の基本情報と全話数を一目で確認したい, so that 目次サブタイトル一覧がなくても作品の概要を把握できる。

#### Acceptance Criteria

1. WHEN ユーザーがNovel_Info_Viewを開いた場合, THE Frontend SHALL 作品タイトル、作者名、あらすじ、全話数、最終更新日を表示する
2. WHEN 作品メタ情報の取得中である場合, THE Frontend SHALL ローディングスケルトンを表示する
3. IF 作品メタ情報の取得に失敗した場合, THEN THE Frontend SHALL エラーメッセージと再試行ボタンを表示する
4. THE Frontend SHALL 従来のエピソードサブタイトル一覧を表示しない

### Requirement 3: Episode_Navigatorによる話数選択

**User Story:** As a ユーザー, I want 任意の話数を指定して直接その話に移動したい, so that 目次一覧がなくても効率的に読みたい話を開ける。

#### Acceptance Criteria

1. WHEN ユーザーがNovel_Info_Viewを表示している場合, THE Frontend SHALL 1から全話数（general_all_no）までの範囲で話数を選択できるEpisode_Navigatorを表示する
2. WHEN ユーザーがEpisode_Navigatorで話数を選択し「読む」ボタンを押した場合, THE Frontend SHALL 対応するなろう/ノクターンサイトの本文ページを新しいブラウザタブで開く
3. WHEN お気に入り作品に既読情報がある場合, THE Frontend SHALL 最後に読んだ話数の次の話をEpisode_Navigatorのデフォルト値として設定する
4. THE Episode_Navigator SHALL 数値入力フィールドとスライダーの両方を提供する

### Requirement 4: External_Reader_Linkの生成

**User Story:** As a ユーザー, I want 選択した話のなろうサイトページを直接開きたい, so that ブラウザで本文を読める。

#### Acceptance Criteria

1. WHEN SiteModeが「narou」の場合, THE Frontend SHALL `https://ncode.syosetu.com/{ncode}/{話数}/` の形式でURLを生成する
2. WHEN SiteModeが「nocturne」の場合, THE Frontend SHALL `https://novel18.syosetu.com/{ncode}/{話数}/` の形式でURLを生成する
3. THE Frontend SHALL 生成したURLを`target="_blank"`かつ`rel="noopener noreferrer"`属性付きのリンクまたはwindow.openで新タブに開く
4. WHEN 全話数が1（短編）の場合, THE Frontend SHALL 話数部分を省略したURL（`https://ncode.syosetu.com/{ncode}/`）を生成する

### Requirement 5: スクレイピングコードの廃止

**User Story:** As a 開発者, I want スクレイピングに依存するコードを削除したい, so that Cloud Run上で403エラーが発生しないシステムにする。

#### Acceptance Criteria

1. THE Backend_API SHALL `/novel/{ncode}/toc` エンドポイント（なろう・ノクターン両方）を廃止する
2. THE Backend_API SHALL `/novel/{ncode}/{episode_number}` エンドポイント（なろう・ノクターン両方）を廃止する
3. THE Backend_API SHALL BeautifulSoup、lxml等のHTML解析ライブラリへの依存を削除する
4. THE Frontend SHALL 従来のNovelTocコンポーネントおよびNovelReaderコンポーネントを廃止する

### Requirement 6: 作品メタ情報取得用の新エンドポイント

**User Story:** As a 開発者, I want 公式APIから単一作品のメタ情報を返す専用エンドポイントが欲しい, so that Novel_Info_Viewが必要とするデータを効率的に取得できる。

#### Acceptance Criteria

1. THE Backend_API SHALL `/novel/{ncode}/info` エンドポイント（GET）をなろう・ノクターン両方のルーターに提供する
2. WHEN 有効なncodeが指定された場合, THE Backend_API SHALL Novel_APIにncodeを指定してリクエストし、タイトル、作者名、あらすじ、全話数、最終更新日を含むレスポンスを返す
3. WHEN 存在しないncodeが指定された場合, THE Backend_API SHALL HTTP 404ステータスを返す
4. WHEN Novel_APIへの接続に失敗した場合, THE Backend_API SHALL HTTP 502ステータスとエラー詳細を返す

### Requirement 7: お気に入り作品からの「続きを読む」機能

**User Story:** As a ユーザー, I want お気に入り一覧から直接「続きを読む」で次の話をなろうサイトで開きたい, so that Novel_Info_Viewを経由せず素早く続きにアクセスできる。

#### Acceptance Criteria

1. WHEN お気に入り作品に既読情報（lastReadEpisode）がある場合, THE Frontend SHALL お気に入り一覧の各作品に「続きを読む」ボタンを表示する
2. WHEN ユーザーが「続きを読む」ボタンを押した場合, THE Frontend SHALL lastReadEpisode + 1 に対応するExternal_Reader_Linkを新タブで開く
3. WHEN lastReadEpisodeが全話数（totalEpisodes）と等しい場合, THE Frontend SHALL 「続きを読む」ボタンの代わりに「最新話まで読了」の表示をする
4. WHILE 既読情報が存在しない場合, THE Frontend SHALL 「第1話を読む」ボタンを表示する

### Requirement 8: 既読管理の更新方式

**User Story:** As a ユーザー, I want 外部サイトで読んだ話数を手動で記録したい, so that アプリ内で本文を表示しなくても読書進捗を管理できる。

#### Acceptance Criteria

1. WHEN ユーザーがExternal_Reader_Linkをクリックして新タブを開いた場合, THE Frontend SHALL クリックした話数を既読としてFirestoreのお気に入りデータに記録する
2. WHEN ユーザーがNovel_Info_Viewで話数を手動入力し「既読にする」ボタンを押した場合, THE Frontend SHALL 指定した話数までを既読としてFirestoreに記録する
3. THE Frontend SHALL 既読話数は常に現在の最大値以上の値のみ更新する（読み戻しで既読数が減らない）

### Requirement 9: 読書中の進捗表示

**User Story:** As a ユーザー, I want 読んでいる最中に「XX話/YY話」のように現在読んでいる話数と全体の話数を常に確認したい, so that 作品全体のどこまで読み進めたか把握できる。

#### Acceptance Criteria

1. WHEN ユーザーがお気に入り一覧を表示している場合, THE Frontend SHALL 各作品に「XX/YY話」形式（XX=現在の既読話数, YY=全話数）を表示する
2. WHEN ユーザーがNovel_Info_Viewを表示している場合, THE Frontend SHALL 「XX/YY話 読了」形式で現在の読書進捗を目立つ位置に表示する
3. WHEN ユーザーがExternal_Reader_Linkをクリックした直後, THE Frontend SHALL 表示中の進捗表示を即座に更新する（XX → XX+1）
4. IF 全話数情報（totalEpisodes）がまだ取得されていない場合, THEN THE Frontend SHALL 「XX話 読了」のようにYY部分を省略して表示する
