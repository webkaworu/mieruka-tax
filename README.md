# 📊 税金の使い道見える化 (TAX VISIBILITY)

行政が公開している複雑な財務データを、誰もが直感的に理解できるように可視化するWebアプリケーションです。自分が納めた税金が「どこに」「どれだけ」使われているかを明確に示し、行政の透明性向上を支援します。

## 🚀 主な機能

*   **予算内訳ダッシュボード**: 財務省の予算データをドーナツチャートで可視化。クリックすることで詳細な内訳（ドリルダウン）を確認可能。
*   **マイ・タックス（税金シミュレーター）**: 自身の納税額を入力すると、具体的な費目ごとの配分額を算出。「おにぎり何個分」といった実感のわく単位に換算して表示。
*   **データの出典提示**: 全てのグラフ・リスト上の数値について、根拠となった財務省の原文PDF資料へのリンクと掲載ページを提示。
*   **型安全な連携**: Hono RPC を活用し、フロントエンドからバックエンドまで一貫した型安全性を確保。

## 🛠 技術スタック

| レイヤー | 技術 |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, TanStack Query, Recharts, Tailwind CSS, Zustand |
| **Backend** | Deno, Hono (Clean Architecture) |
| **Data Pipeline** | Python 3.11, pdfplumber, BeautifulSoup4, Pandas |
| **Database** | Supabase (PostgreSQL) |
| **Infrastructure** | Docker, Docker Compose |

## 🏗 システム構成

```text
mieruka-tax/
├── frontend/        # React (UI・可視化層)
├── backend/         # Deno (API配信層)
├── data-pipeline/   # Python (データ収集・加工層)
├── supabase/        # DBマイグレーション管理
└── docs/            # 各種設計・仕様ドキュメント
```

## 🏁 セットアップ手順

### 1. 前提条件
*   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) がインストールされていること。
*   [Supabase](https://supabase.com/) のプロジェクトが作成されており、APIキーとURLが取得済みであること。

### 2. 環境変数の設定
プロジェクトルートに `.env` ファイルを作成し、`.env.sample` を参考に Supabase の情報を設定してください。

```bash
cp .env.sample .env
# .env を編集して情報を入力してください
```

### 3. データベースの準備
SupabaseのSQL Editor等を使用し、`supabase/migrations/` 内の SQL ファイルを順に実行してテーブルと制約を作成してください。

### 4. 起動
Docker Compose を使用して、全サービスを起動します。

```bash
docker compose up -d
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:8000/api](http://localhost:8000/api)

### 5. データの投入 (ETLの実行)
データパイプラインを実行して、財務省から最新データを取得しDBに格納します。

```bash
docker compose run --rm data-pipeline python main.py
```

## 🛡️ セキュリティと運用ルール

本プロジェクトでは以下のセキュリティガイドラインを採用しています。詳細は [docs/SECURITY.md](docs/SECURITY.md) を参照してください。

*   **node_modules の隔離**: ホスト環境を汚染しないよう、`node_modules` はコンテナ内のボリュームに閉じ込めています。
*   **コンテナ内インストール**: パッケージの追加は必ずコンテナ内で行ってください。
    ```bash
    docker compose exec frontend pnpm install <package_name>
    ```
*   **Row Level Security (RLS)**: Supabase 側で RLS を有効にし、一般公開キー (`anon`) からの不正な書き込みを遮断しています。

## 📄 ライセンス

&copy; 2026 TAX VISIBILITY PROJECT. All rights reserved.
