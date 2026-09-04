#!/bin/bash
#===============================================
# .htaccess を生成する（サブディレクトリ構成）
# ----------------------------------------------
# WordPress をサブディレクトリに置き、サイトをルートで公開する構成向け。
# - ルート .htaccess: フロントのパーマリンク（RewriteBase /）
# - wp-dir/.htaccess: WP 本体（管理画面・wp-json 等）（RewriteBase /{サブディレクトリ}/）
#
# 注: wp rewrite flush --hard はルート .htaccess のみ更新し、
#     wp-dir/.htaccess は WordPress が触らないため手動生成する。
#===============================================

path=$(cd "$(dirname "$0")/../.."; pwd)
source "${path}/.env"

ESC=$(printf '\033')
subdir="${WP_SUB_DIR}"

if [ -z "${subdir}" ]; then
    echo "${ESC}[1;31mWP_SUB_DIR が未設定です。${ESC}[m"
    exit 1
fi

wp_dir="${WP_DIR_PATH:-/var/www/html/${subdir}}"
if ! cd "${wp_dir}"; then
    echo "${ESC}[1;31mWordPress ディレクトリに移動できません: ${wp_dir}${ESC}[m"
    exit 1
fi

echo "${ESC}[1;32m.htaccess を生成します（サブディレクトリ: ${subdir}）・・・・・${ESC}[m"

cat <<EOF > .htaccess
# BEGIN WordPress

RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /${subdir}/
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /${subdir}/index.php [L]

# END WordPress
EOF

cat <<EOF > ../.htaccess
# BEGIN WordPress

RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]

# END WordPress
EOF

echo "${ESC}[1;32m完了しました。${ESC}[m"
