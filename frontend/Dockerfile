FROM node:24-alpine

# pnpmの最新版を使用
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# モノレポ全体の依存関係を解決するために必要なファイルをコピー
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-contract/package.json ./packages/api-contract/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# フロントエンドとその依存関係（shared等）のみをインストール
RUN pnpm install --filter mieruka-tax-frontend... --ignore-scripts

# 全ソースコードのコピー
COPY . .

WORKDIR /app/frontend

# Viteのデフォルトポート
EXPOSE 3000

CMD ["pnpm", "dev", "--host"]
