#!/bin/bash
#===============================================
# テーマ定義のカスタム投稿タイプの記事を完全に削除する
# ----------------------------------------------
# 削除対象は posts.php の定義のみ（page / post 等は対象外）
# ※ wp-install.sh と同様、WordPress ルート（wp-config.php があるディレクトリ）で実行すること
#
# 使い方:
#   ./wp-remove-posts.sh              # posts.php の全カスタム投稿タイプを削除
#   ./wp-remove-posts.sh works        # works のみ削除
#   ./wp-remove-posts.sh works members # 複数指定可能
#===============================================

ESC=$(printf '\033')

# posts.php（export-posts-for-wp-cli.php）からカスタム投稿タイプ slug 一覧を取得
load_theme_cpt_slugs() {
  local path wp_dir theme export_script
  path=$(cd "$(dirname "$0")/../.." && pwd)

  if [ -f "${path}/.env" ]; then
    # shellcheck source=/dev/null
    source "${path}/.env"
  fi

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
      echo "$slug"
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

# 階層付き投稿や残リビジョン対策のため、空になるまで繰り返し削除する
delete_all_in_post_type() {
  local pt="$1"
  while true; do
    ids=$(wp post list \
      --post_type="$pt" \
      --post_status=any \
      --format=ids \
      --posts_per_page=-1 \
      --allow-root 2>/dev/null | tr -s '[:space:]' ' ' | sed 's/^ *//;s/ *$//')
    [ -z "$ids" ] && break
    # shellcheck disable=SC2086
    wp post delete $ids --force --allow-root
  done
}

mapfile -t THEME_CPT_SLUGS < <(load_theme_cpt_slugs)

if [ ${#THEME_CPT_SLUGS[@]} -eq 0 ]; then
  echo "${ESC}[1;33mテーマ定義のカスタム投稿タイプが見つかりません。${ESC}[m"
  exit 0
fi

TARGET_TYPES=()

if [ $# -gt 0 ]; then
  for post_type in "$@"; do
    if ! is_theme_cpt "$post_type"; then
      echo "${ESC}[1;31mエラー: '${post_type}' は posts.php に定義されていないカスタム投稿タイプです。${ESC}[m" >&2
      echo "  定義済み: ${THEME_CPT_SLUGS[*]}" >&2
      exit 1
    fi
    TARGET_TYPES+=("$post_type")
  done
  echo "${ESC}[1;32m指定されたカスタム投稿タイプを削除します: ${TARGET_TYPES[*]}${ESC}[m"
else
  TARGET_TYPES=("${THEME_CPT_SLUGS[@]}")
  echo "${ESC}[1;32mテーマ定義のカスタム投稿タイプをすべて削除します: ${TARGET_TYPES[*]}${ESC}[m"
fi

for post_type in "${TARGET_TYPES[@]}"; do
  echo "  → post_type: ${post_type}"
  delete_all_in_post_type "$post_type"
done

echo "${ESC}[1;32m投稿の削除が完了しました。${ESC}[m"
