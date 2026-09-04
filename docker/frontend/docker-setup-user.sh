#!/bin/sh
# コンテナ内で HOST_UID / HOST_GID のユーザーで実行できるようにする
# UID/GID が既に存在する場合（node イメージの 1000 等）はそのユーザーを流用
set -e
: "${HOST_UID:=1000}"
: "${HOST_GID:=1000}"

EXISTING_USER=$(awk -F: -v uid="$HOST_UID" '$3==uid {print $1; exit}' /etc/passwd) || true
GROUP_NAME=$(awk -F: -v gid="$HOST_GID" '$3==gid {print $1; exit}' /etc/group) || true

if [ -n "$EXISTING_USER" ] && [ -n "$GROUP_NAME" ]; then
  # 既存のユーザー・グループをそのまま使う
  echo "$EXISTING_USER" > /tmp/appuser
  echo "$GROUP_NAME" > /tmp/appgroup
else
  # 新規に appuser を作成（Debian 用 groupadd/useradd）
  if [ -z "$GROUP_NAME" ]; then
    groupadd -g "$HOST_GID" appgroup
    GROUP_NAME=appgroup
  fi
  useradd -u "$HOST_UID" -g "$HOST_GID" -m -s /bin/bash appuser
  echo "appuser" > /tmp/appuser
  echo "$GROUP_NAME" > /tmp/appgroup
fi
