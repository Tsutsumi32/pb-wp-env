#!/bin/bash
#===============================================
# リライトルール（パーマリンク）をフラッシュして再生成する
# 管理画面「設定 > パーマリンク」で「変更を保存」を押したときと同様の効果
# - DB の rewrite rules: wp rewrite flush
# - .htaccess: wp-htaccess.sh（サブディレクトリ構成では手動生成が必要）
#===============================================

path=$(cd "$(dirname "$0")/../.."; pwd)
ESC=$(printf '\033')

echo "${ESC}[1;32mリライトルールをフラッシュしています（wp rewrite flush）...${ESC}[m"
wp rewrite flush --allow-root

bash "${path}/scripts/wp/wp-htaccess.sh"

echo "${ESC}[1;32m完了しました。${ESC}[m"
