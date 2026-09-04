# Node 24 ベースのフロントエンドビルド環境
FROM node:lts-bookworm

# ビルド引数（デフォルト値は1000）
ARG HOST_UID=1000
ARG HOST_GID=1000

# 環境変数の設定
ENV DEBIAN_FRONTEND=noninteractive

# 必要なパッケージをインストール（ネイティブモジュール用 build-essential / フォントサブセット用 fonttools）
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    sudo \
    python3-fonttools \
    python3-brotli \
    && rm -rf /var/lib/apt/lists/*

# UID/GID が既存の場合は流用、なければ appuser を作成（node イメージの 1000 と衝突しない）
COPY docker/frontend/docker-setup-user.sh /tmp/setup-user.sh
RUN chmod +x /tmp/setup-user.sh && \
    HOST_UID=${HOST_UID} HOST_GID=${HOST_GID} /tmp/setup-user.sh

COPY docker/frontend/prepare-node-modules.sh /usr/local/bin/prepare-node-modules.sh
RUN chmod +x /usr/local/bin/prepare-node-modules.sh

WORKDIR /var/www/html

# package.json / package-lock.json の存在確認用（依存関係は make install でコンテナ内から導入）
COPY resources/package*.json ./
RUN chown -R $(cat /tmp/appuser):$(cat /tmp/appgroup) /var/www/html
