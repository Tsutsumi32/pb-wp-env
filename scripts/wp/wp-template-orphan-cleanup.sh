#!/bin/bash
#===============================================
# posts.php / pages.php 定義に無い自動生成系テンプレートを削除
# ----------------------------------------------
# wp-create-posts.sh / wp-create-pages.sh から source して利用する
# front-page.php / 404.php は手動実装前提のため削除対象外
#===============================================

_is_expected_template() {
  local filename="$1"
  shift
  local expected
  for expected in "$@"; do
    if [[ "$filename" == "$expected" ]]; then
      return 0
    fi
  done
  return 1
}

# 投稿系（archive-*.php / single-*.php / taxonomy-*.php）の orphan を削除
# $1: template_dir
# $2...: 設定上必要なファイル名（basename）
cleanup_post_template_orphans() {
  local template_dir="$1"
  shift
  local expected=("$@")
  local pattern filename file

  echo "[INFO] 設定外の投稿系テンプレートを確認します..."

  for pattern in archive-*.php single-*.php taxonomy-*.php; do
    for file in "$template_dir"/$pattern; do
      [[ -f "$file" ]] || continue
      filename=$(basename "$file")

      if [[ "$filename" == "single.php" ]]; then
        continue
      fi

      if _is_expected_template "$filename" "${expected[@]}"; then
        echo "[KEEP]   $filename"
      else
        echo "[DELETE] $filename"
        rm -f "$file"
      fi
    done
  done
}

# 固定ページ系（page-*.php）の orphan を削除
# $1: template_dir
# $2...: 設定上必要なファイル名（basename）
cleanup_page_template_orphans() {
  local template_dir="$1"
  shift
  local expected=("$@")
  local filename file

  echo "[INFO] 設定外の固定ページ系テンプレートを確認します..."

  for file in "$template_dir"/page-*.php; do
    [[ -f "$file" ]] || continue
    filename=$(basename "$file")

    if [[ "$filename" == "page.php" ]]; then
      continue
    fi

    if _is_expected_template "$filename" "${expected[@]}"; then
      echo "[KEEP]   $filename"
    else
      echo "[DELETE] $filename"
      rm -f "$file"
    fi
  done
}
