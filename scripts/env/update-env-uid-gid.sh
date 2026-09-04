#!/bin/sh
# .env の HOST_UID / HOST_GID を現在のユーザーに合わせる
# Windows (Git Bash / WSL), Linux, Mac で動作するよう id がない場合は 1000 を使用

set -e
cd "$(dirname "$0")/../.."

# .env がなければ .env.example からコピー
if [ ! -f .env ] && [ -f .env.example ]; then
  cp -n .env.example .env 2>/dev/null || true
fi

[ ! -f .env ] && exit 0

# UID / GID を取得（id がない環境では 1000）
HOST_UID=$(id -u 2>/dev/null) || true
HOST_GID=$(id -g 2>/dev/null) || true
HOST_UID=${HOST_UID:-1000}
HOST_GID=${HOST_GID:-1000}

# sed -i は OS で挙動が違うため、一時ファイルで上書き
if sed "s/^HOST_UID=.*/HOST_UID=$HOST_UID/" .env > .env.tmp.uid && mv .env.tmp.uid .env; then
  :
else
  rm -f .env.tmp.uid
  exit 1
fi

if sed "s/^HOST_GID=.*/HOST_GID=$HOST_GID/" .env > .env.tmp.gid && mv .env.tmp.gid .env; then
  echo "✅ .env の HOST_UID / HOST_GID を現在のユーザーに合わせました ($HOST_UID / $HOST_GID)"
else
  rm -f .env.tmp.gid
  exit 1
fi
