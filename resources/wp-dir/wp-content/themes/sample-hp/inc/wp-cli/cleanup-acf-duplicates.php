<?php

/**
 * WP-CLI: 同一 key の重複 ACF フィールドグループを削除
 *
 * 使い方:
 *   wp eval-file wp-content/themes/{theme}/inc/wp-cli/cleanup-acf-duplicates.php --allow-root
 */

if (!function_exists('uds_acf_get_field_group_post_ids_by_key')) {
    echo "[ERROR] acf-setup.php が読み込まれていません。\n";
    exit(1);
}

AcfField::init();

$keys = [];
foreach (AcfField::getAllSettings() as $setting) {
    if (empty($setting['slug'])) {
        continue;
    }
    $keys[] = uds_acf_group_key((string) $setting['slug']);
}

$keys = array_values(array_unique($keys));
if ($keys === []) {
    echo "[WARN] 対象 key がありません。\n";
    exit(0);
}

$total_deleted = 0;
foreach ($keys as $group_key) {
    $ids = uds_acf_get_field_group_post_ids_by_key($group_key);
    if (count($ids) <= 1) {
        echo "{$group_key}: 重複なし（" . count($ids) . " 件）\n";
        continue;
    }

    $keep_id = max($ids);
    $deleted = uds_acf_remove_duplicate_field_groups($group_key, $keep_id);
    $total_deleted += $deleted;
    echo "{$group_key}: {$deleted} 件削除、ID {$keep_id} を残しました\n";
}

$orphan_deleted = uds_acf_cleanup_orphan_fields();
if ($orphan_deleted > 0) {
    echo "孤立 acf-field を {$orphan_deleted} 件削除しました。\n";
}

echo "合計 {$total_deleted} 件の重複フィールドグループを削除しました。\n";
