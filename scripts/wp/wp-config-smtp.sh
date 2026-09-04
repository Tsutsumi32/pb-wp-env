#!/bin/bash
#===============================================
# WP Mail SMTP を wp-config.php に定数で設定する
#
# 運用:
#   1. .env に WPMS_* を設定
#   2. ローカルで本スクリプトを実行（make wp-config-smtp）
#   3. 生成された wp-config.php を本番へ手動アップロード
#
# ローカル開発では WPMS_DISABLE_WP_MAIL_SMTP=true により
# SMTP 定数は無効化され、MailHog へフォールバックします。
# プラグインが不要な場合は本スクリプトを実行しない（--remove で削除可）。
#===============================================

set -euo pipefail

ESC=$(printf '\033')
path=$(cd "$(dirname "$0")/../.." && pwd)
CONFIG_FILE="wp-config.php"
GUARD_BEGIN_MARKER='/** BEGIN WPMS-DISABLE-GUARD'
GUARD_END_MARKER='/** END WPMS-DISABLE-GUARD */'
SMTP_BEGIN_MARKER='/** BEGIN WPMS-SMTP-SETTINGS'
SMTP_END_MARKER='/** END WPMS-SMTP-SETTINGS */'

usage() {
  cat <<'EOF'
Usage:
  bash wp-config-smtp.sh [path/to/.env]  # ガード + SMTP 設定を wp-config.php に適用
  bash wp-config-smtp.sh --remove        # ガード + SMTP 設定を削除

wp-config.php がある WordPress ルート（wp-dir）で実行してください。
未指定時はプロジェクトルートの .env を読み込みます。
EOF
}

escape_php_string() {
  printf "%s" "$1" | sed "s/'/\\\\'/g"
}

# .env をリテラル読み込み（値内の $ をシェル展開しない）
# KEY=value / KEY='value' / KEY="value" に対応。# 行・空行は無視。
load_dotenv() {
  local file="$1"
  local line key value

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue

    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"

    if [[ "$value" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi

    printf -v "$key" '%s' "$value"
    export "$key"
  done < "$file"
}

to_php_bool() {
  case "${1,,}" in
    true|1|yes|on) echo 'true' ;;
    *) echo 'false' ;;
  esac
}

remove_legacy_guard_block() {
  if grep -q 'WPMS_DISABLE_WP_MAIL_SMTP' "$CONFIG_FILE" && ! grep -qF "$GUARD_BEGIN_MARKER" "$CONFIG_FILE"; then
    awk '
      /\/\/ ローカル開発時は WPMS_DISABLE_WP_MAIL_SMTP/ { skip=1; next }
      skip && /define\(.WPMS_DISABLE_WP_MAIL_SMTP., true\);/ { skip=0; next }
      skip==0 { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new"
    mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
    echo "ℹ️  旧形式の WP Mail SMTP ガードを削除しました"
  fi
}

remove_marked_block() {
  local begin_marker="$1"
  local end_marker="$2"
  local label="$3"

  if grep -qF "$begin_marker" "$CONFIG_FILE"; then
    awk -v begin="$begin_marker" -v end="$end_marker" '
      index($0, begin) == 1 { skip=1; next }
      index($0, end) == 1 { skip=0; next }
      skip==0 { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new"
    mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
    echo "ℹ️  ${label}を削除しました"
  fi
}

remove_wp_mail_smtp_blocks() {
  remove_marked_block "$SMTP_BEGIN_MARKER" "$SMTP_END_MARKER" "WP Mail SMTP 設定"
  remove_marked_block "$GUARD_BEGIN_MARKER" "$GUARD_END_MARKER" "WP Mail SMTP ガード"
  remove_legacy_guard_block
  # 旧 CF7 sender ブロック（廃止済み）
  if grep -qF '/** BEGIN WPMS-CF7-SENDER' "$CONFIG_FILE"; then
    remove_marked_block '/** BEGIN WPMS-CF7-SENDER' '/** END WPMS-CF7-SENDER */' "WP Mail SMTP CF7 sender 優先（旧）"
  fi
}

insert_blocks() {
  local block_file="$1"

  if grep -q '管理画面からテーマ・プラグインの編集を禁止' "$CONFIG_FILE"; then
    awk -v bf="$block_file" '
      /管理画面からテーマ・プラグインの編集を禁止/ && !done {
        while ((getline line < bf) > 0) print line
        close(bf)
        done=1
      }
      { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new" && mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
  elif grep -q "define('DISALLOW_FILE_EDIT'" "$CONFIG_FILE"; then
    awk -v bf="$block_file" '
      /define\(.DISALLOW_FILE_EDIT., true\);/ && !done {
        while ((getline line < bf) > 0) print line
        close(bf)
        done=1
      }
      { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new" && mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
  elif grep -q "define( 'WP_DEBUG'" "$CONFIG_FILE"; then
    awk -v bf="$block_file" '
      /define\( .WP_DEBUG./ && !done {
        while ((getline line < bf) > 0) print line
        close(bf)
        done=1
      }
      { print }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.new" && mv "${CONFIG_FILE}.new" "$CONFIG_FILE"
  else
    echo "${ESC}[1;31mwp-config.php に挿入位置が見つかりません${ESC}[m" >&2
    return 1
  fi
}

if [ "${1:-}" = '--remove' ]; then
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "${ESC}[1;31mwp-config.php が見つかりません（WordPress ルートで実行してください）${ESC}[m" >&2
    exit 1
  fi
  remove_wp_mail_smtp_blocks
  echo "✅ WP Mail SMTP 関連の設定を削除しました"
  exit 0
fi

ENV_FILE="${1:-${path}/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "${ESC}[1;31m設定ファイルが見つかりません: ${ENV_FILE}${ESC}[m" >&2
  usage
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "${ESC}[1;31mwp-config.php が見つかりません（WordPress ルートで実行してください）${ESC}[m" >&2
  exit 1
fi

load_dotenv "$ENV_FILE"

required_vars=(WPMS_SMTP_HOST WPMS_SMTP_USER WPMS_SMTP_PASS)
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "${ESC}[1;31m必須項目が未設定です: ${var}（${ENV_FILE}）${ESC}[m" >&2
    exit 1
  fi
done

WPMS_SMTP_PORT="${WPMS_SMTP_PORT:-587}"
WPMS_SSL="${WPMS_SSL:-tls}"
WPMS_SMTP_AUTH="${WPMS_SMTP_AUTH:-true}"
WPMS_SMTP_AUTOTLS="${WPMS_SMTP_AUTOTLS:-true}"
WPMS_MAIL_FROM="${WPMS_MAIL_FROM:-}"
WPMS_MAIL_FROM_NAME="${WPMS_MAIL_FROM_NAME:-}"

WPMS_SMTP_AUTH_PHP=$(to_php_bool "$WPMS_SMTP_AUTH")
WPMS_SMTP_AUTOTLS_PHP=$(to_php_bool "$WPMS_SMTP_AUTOTLS")

HOST=$(escape_php_string "$WPMS_SMTP_HOST")
USER=$(escape_php_string "$WPMS_SMTP_USER")
PASS=$(escape_php_string "$WPMS_SMTP_PASS")
SSL=$(escape_php_string "$WPMS_SSL")

FROM_LINES=""
if [ -n "$WPMS_MAIL_FROM" ]; then
  FROM=$(escape_php_string "$WPMS_MAIL_FROM")
  FROM_NAME=$(escape_php_string "$WPMS_MAIL_FROM_NAME")
  FROM_LINES=$(cat <<EOF

define('WPMS_MAIL_FROM', '${FROM}');
define('WPMS_MAIL_FROM_FORCE', true);
define('WPMS_MAIL_FROM_NAME', '${FROM_NAME}');
define('WPMS_MAIL_FROM_NAME_FORCE', true);
EOF
)
fi

remove_wp_mail_smtp_blocks

BLOCK_FILE=$(mktemp)
cat > "$BLOCK_FILE" <<EOF

${GUARD_BEGIN_MARKER} (scripts/wp/wp-config-smtp.sh) */
// ローカル開発時は WPMS_DISABLE_WP_MAIL_SMTP=true で WP Mail SMTP 定数を無効化（MailHog へフォールバック）
if (filter_var(getenv('WPMS_DISABLE_WP_MAIL_SMTP') ?: '', FILTER_VALIDATE_BOOLEAN)) {
	define('WPMS_DISABLE_WP_MAIL_SMTP', true);
}
${GUARD_END_MARKER}
${SMTP_BEGIN_MARKER} (scripts/wp/wp-config-smtp.sh) */
if (!defined('WPMS_DISABLE_WP_MAIL_SMTP') || !WPMS_DISABLE_WP_MAIL_SMTP) {
define('WPMS_ON', true);
define('WPMS_MAILER', 'smtp');
define('WPMS_SMTP_HOST', '${HOST}');
define('WPMS_SMTP_PORT', ${WPMS_SMTP_PORT});
define('WPMS_SSL', '${SSL}');
define('WPMS_SMTP_AUTH', ${WPMS_SMTP_AUTH_PHP});
define('WPMS_SMTP_USER', '${USER}');
define('WPMS_SMTP_PASS', '${PASS}');
define('WPMS_SMTP_AUTOTLS', ${WPMS_SMTP_AUTOTLS_PHP});${FROM_LINES}
}
${SMTP_END_MARKER}
EOF

if ! insert_blocks "$BLOCK_FILE"; then
  rm -f "$BLOCK_FILE"
  exit 1
fi

rm -f "$BLOCK_FILE"

echo "${ESC}[1;32m✅ wp-config.php に WP Mail SMTP ガードと設定を追加しました${ESC}[m"
if [ -n "$WPMS_MAIL_FROM" ]; then
  echo "ℹ️  送信元は WPMS_MAIL_FROM / WPMS_MAIL_FROM_NAME 定数を使用します"
else
  echo "ℹ️  送信元は CF7 の sender を優先します（wp-mail-smtp-sender.php を読み込み中の場合）"
fi
echo "ℹ️  ローカル開発では WPMS_DISABLE_WP_MAIL_SMTP=true により SMTP 接続定数は無効です"
echo "ℹ️  本番反映時は wp-config.php を手動アップロードしてください"
