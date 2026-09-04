#!/bin/bash
#===============================================
# プラグインをインストールする
# 一度全プライグインを無効化・削除（既存プラグインの設定は維持されます）
# テーマ inc/config/plugins.php で指定したプラグインのインストールを実行
#===============================================

ESC=$(printf '\033')

path=$(cd "$(dirname "$0")/../.."; pwd)
# shellcheck source=/dev/null
source "${path}/.env"

wp_dir="${WP_DIR_PATH}"
theme="${WP_THEME_NAME}"
export_script="${wp_dir}/wp-content/themes/${theme}/inc/wp-cli/export-plugins-for-wp-cli.php"

if [ ! -f "$export_script" ]; then
  echo "${ESC}[1;31mプラグイン設定が見つかりません: ${export_script}${ESC}[m" >&2
  exit 1
fi

# --------------------------------
# 全プラグインを無効化・削除
# --------------------------------
# 無効化
echo "${ESC}[1;32m既存プラグインをアンインストールします・・・(設定は削除されません)${ESC}[m"
wp plugin deactivate --all --allow-root

# 削除
wp plugin delete $(wp plugin list --field=name --allow-root) --allow-root

# --------------------------------
# プラグインインストール
# --------------------------------
# プラグイン名：バージョン（テーマ inc/config/plugins.php を参照）
echo "${ESC}[1;32mプラグインのインストールを行います・・・・・${ESC}[m"
if ! PLUGIN_LINES=$(php "$export_script"); then
  echo "${ESC}[1;31mプラグイン一覧の取得に失敗しました（php）${ESC}[m" >&2
  exit 1
fi
mapfile -t PLUGINS <<< "$PLUGIN_LINES"

for entry in "${PLUGINS[@]}"; do
  [ -z "$entry" ] && continue
  IFS=":" read -r plugin_name plugin_version <<< "$entry"

  echo "インストール中: $plugin_name $( [ -n "$plugin_version" ] && echo "(バージョン: $plugin_version)" || echo "(最新バージョン)" )"

  if [ -n "$plugin_version" ]; then
    wp plugin install "$plugin_name" --version="$plugin_version" --activate --allow-root
  else
    wp plugin install "$plugin_name" --activate --allow-root
  fi

  wp language plugin install "$plugin_name" ja --allow-root
done

bash ${path}/scripts/wp/wp-chmod.sh