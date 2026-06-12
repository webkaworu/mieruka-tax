FROM python:3.12-slim

WORKDIR /app

# 依存ライブラリのインストールに必要なパッケージをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 環境変数 PYTHONPATH を設定して、src フォルダをモジュールとして認識させる
ENV PYTHONPATH=/app

CMD ["python", "main.py"]
