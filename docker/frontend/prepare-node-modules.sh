#!/bin/sh
# bind mount 先の node_modules をコンテナ実行ユーザーで書き込み可能にする
set -e

: "${HOST_UID:=1000}"
: "${HOST_GID:=1000}"

mkdir -p /var/www/html/node_modules
chown -R "${HOST_UID}:${HOST_GID}" /var/www/html/node_modules
