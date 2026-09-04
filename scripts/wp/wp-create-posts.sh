#!/bin/bash
#===============================================
# カスタム投稿のターム・テンプレートを生成し、開発用 JSON をインポートする
# ----------------------------------------------
# テーマ内の Post クラスの情報に基づいてタームと PHP テンプレートを生成する。
# 投稿本文は wp-import-posts.sh に委譲する（WP_IMPORT_ENV=dev / posts.dev.json）。
#
# 使い方:
#   ./wp-create-posts.sh                 # posts.php の全カスタム投稿タイプ
#   ./wp-create-posts.sh locations       # 指定タイプのみ
#   ./wp-create-posts.sh news locations  # 複数指定可
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

#=======================================================
# Postクラスから定義情報をBash配列で読み込む
#=======================================================
export_script="${wp_dir}/wp-content/themes/${theme}/inc/wp-cli/export-posts-for-wp-cli.php"
php "$export_script"
eval "$(php "$export_script")"


#==============================
# ターム作成関数
#==============================
function createTerm() {
    local taxonomy="$1"
    local name="$2"
    local slug="$3"
    local desc="$4"

    # 一旦作成を試みて、戻り値から ID を無視して slug をそのまま返す
    wp term create "$taxonomy" "$name" --slug="$slug" --description="$desc" --allow-root > /dev/null 2>&1

    # すでに存在していてもいいので slug をそのまま返す
    echo "$slug"
}

#==============================
# 投稿タイプ処理対象リスト
#==============================
# ${prefix}_slug から CPT を収集（taxonomy / term の *_slug は除外）
# ※ ${k%%_*} だと CPT スラッグに _ が含まれると壊れる
POST_TYPES_KEYS=()

for k in "${!POST_TYPES[@]}"; do
  [[ "$k" == *_taxonomy_* ]] && continue
  [[ "$k" != *_slug ]] && continue

  type="${k%_slug}"
  [[ -z "$type" ]] && continue

  if [[ ! " ${POST_TYPES_KEYS[*]} " =~ " ${type} " ]]; then
    POST_TYPES_KEYS+=("$type")
  fi
done

ALL_POST_TYPES_KEYS=("${POST_TYPES_KEYS[@]}")

if [[ $# -gt 0 ]]; then
  FILTERED_KEYS=()
  for requested in "$@"; do
    found=0
    for key in "${ALL_POST_TYPES_KEYS[@]}"; do
      key_prefix=$(echo "$key" | sed 's/\./_/g')
      slug="${POST_TYPES[${key_prefix}_slug]}"
      if [[ "$slug" == "$requested" || "$key" == "$requested" ]]; then
        FILTERED_KEYS+=("$key")
        found=1
        break
      fi
    done
    if [[ "$found" -eq 0 ]]; then
      echo "${ESC}[1;31mエラー: '${requested}' は posts.php に定義されていないカスタム投稿タイプです。${ESC}[m" >&2
      echo "  定義済み: ${ALL_POST_TYPES_KEYS[*]}" >&2
      exit 1
    fi
  done
  POST_TYPES_KEYS=("${FILTERED_KEYS[@]}")
  echo "${ESC}[1;32m指定された投稿タイプを生成します: ${POST_TYPES_KEYS[*]}${ESC}[m"
fi

echo "=== 投稿タイプ一覧 ==="
for key in "${POST_TYPES_KEYS[@]}"; do
  echo "- $key"
done

# 対象 post_type の既存投稿を削除（wp-remove-posts.sh に委譲）
REMOVE_POST_SLUGS=()
for key in "${POST_TYPES_KEYS[@]}"; do
  key_prefix=$(echo "$key" | sed 's/\./_/g')
  slug="${POST_TYPES[${key_prefix}_slug]}"
  if [[ -n "$slug" ]]; then
    REMOVE_POST_SLUGS+=("$slug")
  fi
done

if [[ ${#REMOVE_POST_SLUGS[@]} -gt 0 ]]; then
  bash "$(dirname "$0")/wp-remove-posts.sh" "${REMOVE_POST_SLUGS[@]}"
fi

for POST_KEY in "${POST_TYPES_KEYS[@]}"; do
    echo "== 投稿タイプ: $POST_KEY =="

    key_prefix=$(echo "$POST_KEY" | sed 's/\./_/g')  # ドットが含まれる場合も対応

    # 投稿タイプに紐づく taxonomy キーを収集
    TAXONOMY_KEYS=()
    for key in "${!POST_TYPES[@]}"; do
        # taxonomy slug 用のキーだけ拾う（term 側のキーを誤って含めない）
        # 例: ${POST_KEY}_taxonomy_{taxonomy_key}_slug だけ
        if [[ $key == "${POST_KEY}_taxonomy_"*"_slug" && $key != "${POST_KEY}_taxonomy_"*"_term_"*"_slug" ]]; then
            suffix="${key#${POST_KEY}_taxonomy_}"
            suffix="${suffix%_slug}"
            TAXONOMY_KEYS+=("$suffix")
        fi
    done

    # taxonomyごとにタームを削除・再作成
    for taxonomy_key in "${TAXONOMY_KEYS[@]}"; do
      taxonomy_slug="${POST_TYPES[${POST_KEY}_taxonomy_${taxonomy_key}_slug]}"
      if [[ -z "$taxonomy_slug" ]]; then
        continue
      fi

      echo "[INFO] タクソノミー '$taxonomy_slug' の既存タームを削除中..."
      wp term list "$taxonomy_slug" --format=ids --allow-root | xargs -r wp term delete "$taxonomy_slug" --allow-root

      # taxonomy単位で term 定義を収集
      term_entries=()
      for key in "${!POST_TYPES[@]}"; do
          if [[ $key == "${POST_KEY}_taxonomy_${taxonomy_key}_term_"*"_slug" ]]; then
              suffix="${key#${POST_KEY}_taxonomy_${taxonomy_key}_term_}"
              suffix="${suffix%_slug}"
              term_key="$suffix"

              slug="${POST_TYPES[${POST_KEY}_taxonomy_${taxonomy_key}_term_${term_key}_slug]}"
              label="${POST_TYPES[${POST_KEY}_taxonomy_${taxonomy_key}_term_${term_key}_label]}"

              # ソート用: slug|label
              term_entries+=("${slug}|${label}")
          fi
      done

      if [[ ${#term_entries[@]} -gt 0 ]]; then
        echo "${ESC}[1;32mターム（${taxonomy_slug}）の生成を行います・・・・・${ESC}[m"

        sorted_entries="$(printf '%s\n' "${term_entries[@]}" | sort -t'|' -k1,1)"
        while IFS='|' read -r slug label; do
          [[ -z "${slug:-}" ]] && continue
          createTerm "$taxonomy_slug" "$label" "$slug" "$label" > /dev/null
          echo "ターム：$slug を作成しました。"
        done <<< "$sorted_entries"
      else
        echo "[INFO] ${taxonomy_slug} のターム定義はありません。"
      fi
    done
done

#==============================
# 開発用 JSON インポート（wp-import-posts.sh）
#==============================
IMPORT_SLUGS=()
for slug in "${REMOVE_POST_SLUGS[@]}"; do
  import_dir="${template_dir}/data/${slug}"
  if [[ -d "$import_dir" ]] && find "$import_dir" -type f -iname 'posts.dev.json' -print -quit | grep -q .; then
    IMPORT_SLUGS+=("$slug")
  else
    echo "${ESC}[1;33m[SKIP] ${slug}: data/${slug}/ に posts.dev.json が無いためインポートしません。${ESC}[m"
  fi
done

if [[ ${#IMPORT_SLUGS[@]} -gt 0 ]]; then
  echo "${ESC}[1;32m開発用 JSON（posts.dev.json）から投稿をインポートします・・・・・${ESC}[m"
  export WP_IMPORT_ENV=dev
  WP_IMPORT_POSTS_ARGS="${IMPORT_SLUGS[*]}"
  export WP_IMPORT_POSTS_ARGS
  bash "$(dirname "$0")/wp-import-posts.sh" "${IMPORT_SLUGS[@]}"
fi

#########################################################
# php ファイル生成
#########################################################
echo "${ESC}[1;32mphpファイルの生成を行います・・・・・${ESC}[m"

# テンプレートを生成する関数
generate_template() {
  local file_path="$1"
  local content="$2"

  if [ -f "$file_path" ]; then
    echo "[SKIP] $file_path はすでに存在します。"
  else
    echo "[CREATE] $file_path を生成します。"
    echo "$content" > "$file_path"
  fi
}

# 設定上必要なテンプレート一覧（orphan 削除用）
EXPECTED_POST_TEMPLATES=()

# テンプレート生成・orphan 判定は常に全 CPT（指定時に他 CPT のテンプレを消さない）
for type in "${ALL_POST_TYPES_KEYS[@]}"; do
  type_slug="${POST_TYPES[${type}_slug]:-$type}"
  archive_file="${template_dir}/archive-${type_slug}.php"
  single_file="${template_dir}/single-${type_slug}.php"

  has_archive_key="${type}_has_archive"
  has_single_key="${type}_has_single"
  if [[ -n "${POST_TYPES[$has_archive_key]}" ]]; then
    EXPECTED_POST_TEMPLATES+=("archive-${type_slug}.php")
    # archive-{post_type}.php
    generate_template "$archive_file" "<?php
if (!defined('ABSPATH')) exit;
get_header();
?>
<main class=\"ly_main\">
    ※ ${type_slug} archive
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>"

    # taxonomy-{taxonomy_slug}.php（has_archive のタクソノミーのみ）
    HAS_TAXONOMY_ARCHIVE=0
    for _k in "${!POST_TYPES[@]}"; do
      if [[ $_k == "${type}_taxonomy_"*"_slug" && $_k != "${type}_taxonomy_"*"_term_"*"_slug" ]]; then
        taxonomy_key_suffix="${_k#${type}_taxonomy_}"
        taxonomy_key_suffix="${taxonomy_key_suffix%_slug}"
        taxonomy_slug="${POST_TYPES[$_k]}"
        taxonomy_has_archive="${POST_TYPES[${type}_taxonomy_${taxonomy_key_suffix}_has_archive]:-1}"

        if [[ -z "$taxonomy_slug" || "$taxonomy_has_archive" != "1" ]]; then
          continue
        fi

        HAS_TAXONOMY_ARCHIVE=1
        taxonomy_file="${template_dir}/taxonomy-${taxonomy_slug}.php"
        EXPECTED_POST_TEMPLATES+=("taxonomy-${taxonomy_slug}.php")
        generate_template "$taxonomy_file" "<?php
if (!defined('ABSPATH')) {
    exit;
}
require_once get_theme_file_path('archive-${type_slug}.php');
"
      fi
    done
    if [[ "$HAS_TAXONOMY_ARCHIVE" -eq 0 ]]; then
      echo "[SKIP] $type_slug はタクソノミー一覧ページ不要です。"
    fi
  else
    echo "[SKIP] $type_slug はアーカイブページ不要です。"
  fi

  if [[ "${POST_TYPES[$has_single_key]:-0}" == "1" ]]; then
    EXPECTED_POST_TEMPLATES+=("single-${type_slug}.php")
    generate_template "$single_file" "<?php
if (!defined('ABSPATH')) exit;
get_header();
?>
<main class=\"ly_main\">
    ※ ${type_slug} single
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>"
  else
    echo "[SKIP] $type_slug は詳細ページ不要です。"
  fi
done

# 設定外の投稿系テンプレートを削除
# shellcheck source=scripts/wp/wp-template-orphan-cleanup.sh
source "$(dirname "$0")/wp-template-orphan-cleanup.sh"
cleanup_post_template_orphans "$template_dir" "${EXPECTED_POST_TEMPLATES[@]}"

chown -R 1000:1000 "${template_dir}"
