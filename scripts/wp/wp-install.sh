#!/bin/bash
#===============================================
# WordPressの初期構築用スクリプト
#===============================================

path=$(cd "$(dirname "$0")/../.."; pwd)

source ${path}/.env

ESC=$(printf '\033')

#テーマ名
theme="${WP_THEME_NAME}"
#サブディレクトリ名
subdir="${WP_SUB_DIR}"
#サイトタイトル
title="${WP_SITE_TITLE}"
#ユーザ名（LOCAL）
user="${WP_ADMIN_USER_NAME_LOCAL}"
#パスワード（LOCAL）
pass="${WP_ADMIN_USER_PASS_LOCAL}"
#WordPress本体の管理者メールアドレス（LOCAL）
email="${WP_ADMIN_MAIL_LOCAL}"
#管理者ユーザーのメールアドレス（LOCAL）
user_mail="${WP_ADMIN_USER_MAIL_LOCAL}"
#サイトアドレス
site_addr="http://${LOCAL_ADDRESS}:${LOCAL_SERVER_PORT}/"

#===============================================
# DB待機（TLS検証問題回避）
# `wp db check` のようなDB疎通チェックは行わず、
# `wp core install` が成功するまでリトライします。
#===============================================
WP_CORE_INSTALL_MAX_RETRIES="${WP_CORE_INSTALL_MAX_RETRIES:-30}"
WP_CORE_INSTALL_INTERVAL="${WP_CORE_INSTALL_INTERVAL:-3}"

wp_core_install_with_retry() {
    local retries=0
    while true; do
        echo "${ESC}[1;32mWordPressをインストールします・・・・・${ESC}[m"

        # 失敗理由を後で判定できるように出力を保持
        install_output="$(wp core install \
            --url="$site_addr$subdir" \
            --title="$title" \
            --admin_user="$user" \
            --admin_password="$pass" \
            --admin_email="$email" \
            --allow-root 2>&1)"
        status=$?

        if [ "$status" -eq 0 ]; then
            break
        fi

        # 既にインストール済みなら続行
        if echo "$install_output" | grep -qi "already installed"; then
            echo "ℹ️  WordPress は既にインストール済みのため続行します。"
            break
        fi

        retries=$((retries + 1))
        if [ "$retries" -ge "$WP_CORE_INSTALL_MAX_RETRIES" ]; then
            echo "${ESC}[1;31mwp core install が失敗しました（最大リトライ回数に到達）${ESC}[m"
            echo "$install_output"
            exit 1
        fi

        echo "DB接続中のため待機して再試行します... (${retries}/${WP_CORE_INSTALL_MAX_RETRIES})"
        sleep "$WP_CORE_INSTALL_INTERVAL"
    done
}

#===============================================
# WordPressのインストール
#===============================================
# WordPress 指定バージョンのダウンロード
# if [ ! -f wp-settings.php ]; then
#     wp core download --version=6.5.5 --locale=ja --force --allow-root
# fi

# chown www-data:www-data ../"$subdir"
# chmod 755 ../"$subdir"

# wp config create \
# --dbname="${DB_DATABASE}" \
# --dbuser="${DB_USERNAME}" \
# --dbpass="${DB_PASSWORD}" \
# --dbhost=db \
# --allow-root

wp_core_install_with_retry
# WordPress本体の管理者メール・管理者ユーザーのメールを設定
wp option update admin_email "${email}" --allow-root
wp user update 1 --user_email="${user_mail}" --allow-root
#サイトアドレス(URL)の変更
wp option update home $site_addr --allow-root


#===============================================
# 一般設定
#===============================================
echo "${ESC}[1;32mWordPressの設定を行います・・・・・${ESC}[m"
#キャッチフレーズを空にする
wp option update blogdescription --allow-root ''
# 日本語
wp language core install  --activate ja --allow-root
# タイムゾーンと日時表記
wp option update timezone_string 'Asia/Tokyo' --allow-root
wp option update date_format 'Y-m-d' --allow-root
wp option update time_format 'H:i' --allow-root
# ニックネームと表示名の変更
wp user update 1 --nickname=testUser --allow-root
wp user update 1 --display_name=testUser --allow-root


#===============================================
# 新しい投稿へのコメントを許可をしない設定
#===============================================
wp option update default_comment_status closed --allow-root


#===============================================
# パーマリンク設定
#===============================================
wp option update permalink_structure /%postname%/ --allow-root


#===============================================
# テーマ切り替え
#===============================================
echo "${ESC}[1;32mテーマファイルを切り替えます・・・・・${ESC}[m"
#テーマ切り替え
wp theme activate $theme --allow-root
#既存テーマ削除（$theme以外のディレクトリ／スラッグをすべて削除）
if [ -n "$theme" ]; then
  while IFS= read -r t; do
    [ -z "$t" ] && continue
    [ "$t" = "$theme" ] && continue
    wp theme delete "$t" --allow-root
  done < <(wp theme list --field=name --allow-root)
fi


#===============================================
# プラグイン アンインストール・インストール
#===============================================
bash ${path}/scripts/wp/wp-plugin.sh


#===============================================
# 翻訳を更新
#===============================================
wp language core update --allow-root


#===============================================
# デフォルトの投稿・固定画面を削除
#===============================================
wp post delete 1 2 3 --force --allow-root


#===============================================
# 投稿記事作成
#===============================================
bash ${path}/scripts/wp/wp-create-posts.sh


#===============================================
# 固定ページ作成
#===============================================
bash ${path}/scripts/wp/wp-create-pages.sh


#===============================================
# 管理バー非表示設定
#===============================================
wp user meta update 1 show_admin_bar_front false --allow-root


#===============================================
# 管理画面からテーマ・プラグインの編集不可
#===============================================
echo "${ESC}[1;32m管理画面からの編集を制限します・・・・・${ESC}[m"
CONFIG_FILE="wp-config.php"
# すでに定義されている場合は何もしない
if ! grep -q "DISALLOW_FILE_EDIT" "$CONFIG_FILE"; then
  # define('WP_DEBUG'...) の直前に挿入する
  sed -i.bak '/define *([ \t]*'\''WP_DEBUG'\''/i \
\
/** 管理画面からテーマ・プラグインの編集を禁止 */\
define('\''DISALLOW_FILE_EDIT'\'', true);\
' "$CONFIG_FILE"
  echo "✅ 完了：wp-config.php に編集禁止設定を挿入しました"
else
  echo "ℹ️ すでに DISALLOW_FILE_EDIT が定義されています。変更しません。"
fi


#===============================================
# index.phpのコピー・書き換え（サブディレクトリ用）
#===============================================
echo "${ESC}[1;32mindex.phpをルートにも配置して書き換えます・・・・・${ESC}[m"
if [ -e index.php ] && [ ! -e ../index.php ] ; then
    cp index.php ../
    sed "s|wp-blog-header.php|$subdir/wp-blog-header.php|" ../index.php > ../index.php.new
    mv ../index.php.new ../index.php
fi


#===============================================
# .htaccess作成
# - ルート / wp-dir とも手動生成（サブディレクトリ構成では wp-dir/.htaccess は WP が更新しない）
#===============================================
bash "${path}/scripts/wp/wp-htaccess.sh"


#===============================================
# WP-CLIでインストールしたデータの所有者変更、権限変更
#===============================================
bash ${path}/scripts/wp/wp-chmod.sh
