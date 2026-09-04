#!/bin/bash
#===============================================
# PRODUCTION用管理者ユーザーの作成・更新
# LOCAL用ユーザーが存在する場合は削除（メディア等は引き継ぎ）
#===============================================
path=$(cd "$(dirname "$0")/../.."; pwd)
source "${path}/.env"
source "$(dirname "$0")/wp-user-helpers.sh"

ESC=$(printf '\033')

user_name="${WP_ADMIN_USER_NAME_PRODUCTION}"
user_name_old="${WP_ADMIN_USER_NAME_PRODUCTION_OLD:-}"
user_pass="${WP_ADMIN_USER_PASS_PRODUCTION}"
user_mail="${WP_ADMIN_USER_MAIL_PRODUCTION}"
other_name="${WP_ADMIN_USER_NAME_LOCAL}"
lookup_name="${user_name_old:-${user_name}}"

echo "${ESC}[1;32mPRODUCTION用管理者ユーザーを設定します${ESC}[m"

ensure_admin_user "${lookup_name}" "${user_pass}" "${user_mail}" "${user_name}"
remove_user_with_reassign "${user_name}" "${other_name}"

echo "${ESC}[1;32m完了しました${ESC}[m"
