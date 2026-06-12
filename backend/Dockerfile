FROM denoland/deno:alpine-1.44.1

# 8000ポートを公開
EXPOSE 8000

WORKDIR /app

# モノレポ全体の構造を考慮して必要なファイルをコピー
# backend 自体は /app、shared は /packages/shared に配置する想定
COPY backend/deno.json ./
COPY packages/shared /packages/shared

# 依存関係のキャッシュ
# 注: deno.json の import map が ../packages/shared/src/ を指しているため、
# コンテナ内のパス構成と合わせる必要があります。
# ワークスペース構成：
# /app (backend)
# /packages/shared (shared)
# なので ../packages/shared は正しく機能します。

RUN deno cache --node-modules-dir main.ts || true

# ソースコードのコピー
COPY backend/ .

# メインスクリプトをキャッシュ
RUN deno cache main.ts

# 実行コマンド
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
