#!/bin/bash
#===============================================
# WordPress本体の管理者メールアドレスをPRODUCTION用に変更
#===============================================
path=$(cd "$(dirname "$0")/../.."; pwd)
source ${path}/.env

ESC=$(printf '\033')

email=${WP_ADMIN_MAIL_PRODUCTION}

echo "${ESC}[1;32m管理者情報を変更します${ESC}[m"

# 管理者メール変更
wp option update admin_email "${email}" --allow-root

echo "${ESC}[1;32m変更完了しました${ESC}[m"