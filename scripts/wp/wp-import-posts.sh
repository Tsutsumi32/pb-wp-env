#!/bin/bash
#===============================================
# テーマ内 JSON / CSV からカスタム投稿をインポートする
# ----------------------------------------------
# 配置先: {theme}/data/{post_type}/ 配下
#   本番: posts.json または posts.csv（同時配置は中止）
#   開発: posts.dev.json または posts.dev.csv（WP_IMPORT_ENV=dev。同時配置は中止）
# CSV の入れ子フィールドはドット区切り（例: acf.works_period, acf.members_question_1.question）
#
# 使い方:
#   ./wp-import-posts.sh news
#   ./wp-import-posts.sh news works
#   WP_IMPORT_ENV=dev ./wp-import-posts.sh works
#===============================================

set -euo pipefail

ESC=$(printf '\033')

usage() {
  echo "使い方: $0 <post_type> [post_type ...]" >&2
  echo "環境: WP_IMPORT_ENV=prod（デフォルト）または WP_IMPORT_ENV=dev" >&2
}

resolve_import_env() {
  local raw
  raw=$(echo "${WP_IMPORT_ENV:-}" | tr '[:upper:]' '[:lower:]')
  case "$raw" in
    ''|prod|production)
      IMPORT_ENV=prod
      ;;
    dev|develop|development)
      IMPORT_ENV=dev
      ;;
    *)
      echo "${ESC}[1;31mエラー: WP_IMPORT_ENV が不正です: ${WP_IMPORT_ENV}（prod または dev）${ESC}[m" >&2
      exit 1
      ;;
  esac
}

source_env_file() {
  local env_file="$1"
  [ -f "$env_file" ] || return 0
  set +u
  # shellcheck source=/dev/null
  source "$env_file"
  set -u
}

load_theme_cpt_slugs() {
  local path wp_dir theme export_script
  path=$(cd "$(dirname "$0")/../.." && pwd)

  source_env_file "${path}/.env"

  wp_dir="${WP_DIR_PATH:-}"
  theme="${WP_THEME_NAME:-}"
  if [ -z "$wp_dir" ] || [ -z "$theme" ]; then
    echo "${ESC}[1;31mエラー: WP_DIR_PATH / WP_THEME_NAME が未設定です。.env を確認してください。${ESC}[m" >&2
    return 1
  fi

  export_script="${wp_dir}/wp-content/themes/${theme}/inc/wp-cli/export-posts-for-wp-cli.php"
  if [ ! -f "$export_script" ]; then
    echo "${ESC}[1;31mエラー: export スクリプトが見つかりません: ${export_script}${ESC}[m" >&2
    return 1
  fi

  eval "$(php "$export_script")"

  local k type key_prefix slug seen=()
  for k in "${!POST_TYPES[@]}"; do
    type="${k%%_*}"
    [ -z "$type" ] && continue

    local already=0 s
    for s in "${seen[@]}"; do
      [ "$s" = "$type" ] && already=1 && break
    done
    [ "$already" -eq 1 ] && continue

    key_prefix=$(echo "$type" | sed 's/\./_/g')
    slug="${POST_TYPES[${key_prefix}_slug]}"
    if [ -n "$slug" ]; then
      seen+=("$type")
      THEME_CPT_SLUGS+=("$slug")
    fi
  done
}

is_theme_cpt() {
  local target="$1"
  local slug
  for slug in "${THEME_CPT_SLUGS[@]}"; do
    [ "$slug" = "$target" ] && return 0
  done
  return 1
}

if [ $# -lt 1 ]; then
  usage
  exit 1
fi

IMPORT_ENV=prod
resolve_import_env

THEME_CPT_SLUGS=()
load_theme_cpt_slugs

if [ ${#THEME_CPT_SLUGS[@]} -eq 0 ]; then
  echo "${ESC}[1;33mテーマ定義のカスタム投稿タイプが見つかりません。${ESC}[m"
  exit 0
fi

path=$(cd "$(dirname "$0")/../.." && pwd)
source_env_file "${path}/.env"

wp_dir="${WP_DIR_PATH}"
import_script="${wp_dir}/wp-content/themes/${WP_THEME_NAME}/inc/wp-cli/import-posts-from-json.php"

if [ ! -f "$import_script" ]; then
  echo "${ESC}[1;31mエラー: import スクリプトが見つかりません: ${import_script}${ESC}[m" >&2
  exit 1
fi

for post_type in "$@"; do
  if ! is_theme_cpt "$post_type"; then
    echo "${ESC}[1;31mエラー: '${post_type}' は posts.php に定義されていないカスタム投稿タイプです。${ESC}[m" >&2
    echo "  定義済み: ${THEME_CPT_SLUGS[*]}" >&2
    exit 1
  fi

  echo "${ESC}[1;32mJSON / CSV インポートを開始します: ${post_type}（環境: ${IMPORT_ENV}）${ESC}[m"
  wp eval-file "$import_script" "$post_type" "$IMPORT_ENV" --allow-root
done

echo "${ESC}[1;32mJSON / CSV インポートが完了しました。${ESC}[m"
