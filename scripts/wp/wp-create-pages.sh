#!/bin/bash
#===============================================
# 固定ページを生成する
# ----------------------------------------------
# テーマ内のPageクラスの情報に基づいて生成する
# 仕組み上の固定ページと、テーマファイルの作成を行う
#===============================================

# 出力色
ESC=$(printf '\033')

# 現パス
path=$(cd "$(dirname "$0")/../.."; pwd)
source "${path}/.env"

wp_dir="${WP_DIR_PATH}"

# テーマ名
theme="${WP_THEME_NAME}"

# テーマディレクトリ
template_dir="${wp_dir}/wp-content/themes/${theme}" # 実際のテーマディレクトリに変更

# WordPressのルートから見たPHP出力ファイルのパス
export_script="${wp_dir}/wp-content/themes/${theme}/inc/wp-cli/export-pages-for-wp-cli.php"

#########################################################
# 固定ページ側の処理
#########################################################
echo "${ESC}[1;32m固定ページの生成を行います・・・・・${ESC}[m"
# 既存固定ページの削除（IDがある場合のみ）
POST_IDS=$(wp post list --post_type=page --format=ids --allow-root)
if [ -n "$POST_IDS" ]; then
  wp post delete $POST_IDS --force --allow-root
fi

# PHPから出力されたページリスト（タイトル:スラッグ:親スラッグ）
PAGES=()
while IFS= read -r line; do
  PAGES+=("$line")
done < <(php "$export_script")

# スラッグ→投稿IDのマップ
declare -A PAGE_IDS

# ページ作成ループ
for entry in "${PAGES[@]}"; do
  IFS=":" read -r title slug parent_slug <<< "$entry"

  # スラッグが top または error の場合は除外
  if [[ "$slug" == "top" || "$slug" == "error" ]]; then
    echo "スキップ: $slug"
    continue
  fi

  if [[ -n "$parent_slug" ]]; then
    parent_id=${PAGE_IDS[$parent_slug]}
    if [[ -z "$parent_id" ]]; then
      echo "エラー: 親ページ '$parent_slug' がまだ作成されていません。" >&2
      exit 1
    fi

    POST_ID=$(wp post create \
      --post_type=page \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_parent="$parent_id" \
      --porcelain \
      --allow-root)

    echo "$title ページを作成しました（親: $parent_slug, ID: $POST_ID）"
  else
    POST_ID=$(wp post create \
      --post_type=page \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --porcelain \
      --allow-root)

    echo "$title ページを作成しました（ID: $POST_ID）"
  fi

  PAGE_IDS[$slug]=$POST_ID
done

#########################################################
# php ファイル生成
#########################################################
echo "${ESC}[1;32mphpファイルの生成を行います・・・・・${ESC}[m"
# テンプレートの雛形（スラッグを埋め込む）
generate_template_content() {
    local slug="$1"
    cat <<EOF
<?php
if (!defined('ABSPATH')) exit;
get_header();
?>
<main class="ly_main">
    ※ ${slug}
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
EOF
}

# 設定上必要なテンプレート一覧（orphan 削除用）
# front-page.php / 404.php は手動実装前提のため orphan 対象外
EXPECTED_PAGE_TEMPLATES=()

# 各ページについて処理
for entry in "${PAGES[@]}"; do
  IFS=":" read -r title slug parent <<< "$entry"

  # スラッグが空ならスキップ
  [ -z "$slug" ] && continue

  # ファイル名の決定
  if [ "$slug" == "top" ]; then
    filename="front-page.php"
  elif [ "$slug" == "error" ]; then
    filename="404.php"
  else
    filename="page-${slug}.php"
    EXPECTED_PAGE_TEMPLATES+=("$filename")
  fi

  filepath="${template_dir}/${filename}"

  # すでにファイルが存在する場合はスキップ
  if [ -f "$filepath" ]; then
    echo "[SKIP] $filename はすでに存在します。"
    continue
  fi

  # ファイルを生成
  echo "[CREATE] $filename を生成します。"
  generate_template_content "$slug" > "$filepath"
done

# 設定外の固定ページ系テンプレートを削除
# shellcheck source=scripts/wp/wp-template-orphan-cleanup.sh
source "$(dirname "$0")/wp-template-orphan-cleanup.sh"
cleanup_page_template_orphans "$template_dir" "${EXPECTED_PAGE_TEMPLATES[@]}"

chown -R 1000:1000 "${template_dir}"
