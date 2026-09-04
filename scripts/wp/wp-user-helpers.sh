#!/bin/bash
#===============================================
# WordPress ユーザー操作の共通処理
#===============================================

# フロント表示時の管理バー（ツールバー）を非表示にする
# $1: ログイン名
disable_admin_toolbar() {
    local login_name="$1"
    local user_id

    user_id=$(wp user get "${login_name}" --field=ID --allow-root)
    wp user meta update "${user_id}" show_admin_bar_front false --allow-root
}

# 管理者ユーザーを作成または更新する
# $1: 検索用ログイン名（*_OLD があればそちらを渡す）
# $2: パスワード（空なら既存ユーザー更新時はスキップ）
# $3: メールアドレス（空なら既存ユーザー更新時はスキップ）
# $4: 設定後のログイン名（空なら $1 と同じ扱い。変更時のみ --user_login を付与）
ensure_admin_user() {
    local lookup_name="$1"
    local user_pass="$2"
    local user_mail="$3"
    local target_login="${4:-$1}"

    if [ -z "${lookup_name}" ]; then
        echo "エラー: ユーザー名（検索用）が未設定です"
        exit 1
    fi

    if wp user get "${lookup_name}" --field=ID --allow-root 2>/dev/null; then
        local user_id current_login
        user_id=$(wp user get "${lookup_name}" --field=ID --allow-root)
        current_login=$(wp user get "${lookup_name}" --field=user_login --allow-root)

        local -a update_args=()
        if [ -n "${user_pass}" ]; then
            update_args+=(--user_pass="${user_pass}")
        fi
        if [ -n "${user_mail}" ]; then
            update_args+=(--user_email="${user_mail}")
        fi
        if [ -n "${target_login}" ] && [ "${target_login}" != "${current_login}" ]; then
            update_args+=(--user_login="${target_login}")
        fi

        if [ "${#update_args[@]}" -eq 0 ]; then
            echo "ℹ️  ユーザー「${lookup_name}」は存在しますが、更新対象の項目がありません（.env で未設定の項目は上書きしません）"
        else
            update_args+=(--role=administrator)
            wp user update "${user_id}" "${update_args[@]}" --allow-root
            echo "ℹ️  ユーザー「${lookup_name}」を更新しました（ID: ${user_id}）"
        fi
    else
        if [ -z "${target_login}" ] || [ -z "${user_pass}" ] || [ -z "${user_mail}" ]; then
            echo "エラー: 新規作成にはログイン名・パスワード・メールアドレスがすべて必要です"
            exit 1
        fi
        wp user create "${target_login}" "${user_mail}" \
            --user_pass="${user_pass}" \
            --role=administrator \
            --allow-root
        echo "✅ ユーザー「${target_login}」を作成しました"
    fi

    disable_admin_toolbar "${target_login}"
}

# 指定ユーザーを削除し、コンテンツ（投稿・メディア等）を別ユーザーへ引き継ぐ
# $1: 引き継ぎ先ユーザー名, $2: 削除対象ユーザー名
remove_user_with_reassign() {
    local keep_name="$1"
    local remove_name="$2"

    if [ -z "${remove_name}" ]; then
        echo "ℹ️  削除対象ユーザー名が未設定のため削除をスキップします"
        return 0
    fi

    if [ "${keep_name}" = "${remove_name}" ]; then
        echo "ℹ️  同一ユーザー名のため削除をスキップします"
        return 0
    fi

    if ! wp user get "${remove_name}" --field=ID --allow-root 2>/dev/null; then
        echo "ℹ️  ユーザー「${remove_name}」は存在しないため削除をスキップします"
        return 0
    fi

    local keep_id remove_id
    keep_id=$(wp user get "${keep_name}" --field=ID --allow-root)
    remove_id=$(wp user get "${remove_name}" --field=ID --allow-root)

    if [ "${keep_id}" = "${remove_id}" ]; then
        echo "ℹ️  同一ユーザーIDのため削除をスキップします"
        return 0
    fi

    wp user delete "${remove_id}" --reassign="${keep_id}" --yes --allow-root
    echo "✅ ユーザー「${remove_name}」を削除し、コンテンツを「${keep_name}」へ引き継ぎました"
}
