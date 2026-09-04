#!/bin/bash

#===============================================
# 権限などの変更処理
# ----------------------------------------------
# 環境に合わせてwp-dir下の権限と所有者を変更する
# [権限の変更(共通)]
# ディレクトリ：705
# ファイル：604
# .htaccess：606
# wp-config.php：600
# 
# [所有者の変更(環境別)]
# 開発環境→HOST_UID:HOST_GID（.env）
# ステージ、本番→www-data:www-data ※themes下をのぞく
#===============================================

ESC=$(printf '\033')

path=$(cd "$(dirname "$0")/../.."; pwd)
source ${path}/.env

wp_dir="${WP_DIR_PATH}"
root_htaccess="${wp_dir}/../.htaccess"
host_uid="${HOST_UID:-1000}"
host_gid="${HOST_GID:-1000}"

echo "${ESC}[1;32mファイルの権限を${APP_ENV}に変更中...${ESC}[m"

chmod g=- -R ./

if [ "${APP_ENV}" = 'local' ] ; then

    find "${wp_dir}" -type d -exec chmod 775 {} \;
    find "${wp_dir}" -type f -exec chmod 664 {} \;
    chown -Rf "${host_uid}:${host_gid}" "${wp_dir}/"

    find "${wp_dir}/wp-content/" -not -path "${wp_dir}/wp-content/themes/*" -exec chown www-data:www-data {} \;
    if [ -f "${wp_dir}/.htaccess" ]; then
        chmod 664 "${wp_dir}/.htaccess"
        chown www-data:www-data "${wp_dir}/.htaccess"
    fi
    if [ -f "${root_htaccess}" ]; then
        chmod 664 "${root_htaccess}"
        chown www-data:www-data "${root_htaccess}"
    fi

else

    chmod 606 "${wp_dir}/.htaccess"
    if [ -f "${root_htaccess}" ]; then
        chmod 606 "${root_htaccess}"
    fi
    chmod 600 "${wp_dir}/wp-config.php"
    find "${wp_dir}" -type d -exec chmod 705 {} \;
    find "${wp_dir}" -type f -exec chmod 604 {} \;

    find "${wp_dir}/" -not -path "${wp_dir}/wp-content/themes/*" -exec chown www-data:www-data {} \;
    if [ -f "${root_htaccess}" ]; then
        chown www-data:www-data "${root_htaccess}"
    fi

fi

echo "${ESC}[1;32m変更完了しました${ESC}[m"