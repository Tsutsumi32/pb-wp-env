<?php

/**
 * WP-CLI: コード定義の ACF フィールドグループを DB へ強制同期
 *
 * 使い方（コンテナ内・テーマルート基準）:
 *   wp eval-file wp-content/themes/{theme}/inc/wp-cli/sync-acf-from-code.php --allow-root
 *
 * UDS_ACF_CODE_SYNC_DEV_MODE に関係なく実行できる（配信モード初回の DB 投入等）。
 */

if (!class_exists('AcfField')) {
    echo "[ERROR] AcfField クラスが読み込まれていません。テーマが有効か確認してください。\n";
    exit(1);
}

if (!function_exists('acf_import_field_group')) {
    echo "[ERROR] ACF が有効化されていないか、acf_import_field_group が利用できません。\n";
    exit(1);
}

AcfField::init();

if (!function_exists('uds_acf_sync_field_groups_from_code')) {
    echo "[ERROR] uds_acf_sync_field_groups_from_code が見つかりません。acf-setup.php を確認してください。\n";
    exit(1);
}

$settings = AcfField::getAllSettings();
if ($settings === []) {
    echo "[WARN] 同期対象の ACF 設定がありません。\n";
    exit(0);
}

uds_acf_sync_field_groups_from_code(true);

echo 'ACF フィールドグループをコード定義どおり DB へ同期しました（' .
    count($settings) .
    " 件）。\n";
