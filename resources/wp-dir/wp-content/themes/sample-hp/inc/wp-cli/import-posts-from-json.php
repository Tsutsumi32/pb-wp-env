<?php

/*****************************************************************
 * WP-CLI: テーマ内 JSON / CSV からカスタム投稿をインポートする
 *
 * 使い方:
 *   wp eval-file import-posts-from-json.php news --allow-root
 *   wp eval-file import-posts-from-json.php news dev --allow-root
 *****************************************************************/

$post_type  = $args[0] ?? '';
$import_env = $args[1] ?? getenv('WP_IMPORT_ENV');

if (!is_string($post_type) || $post_type === '') {
    echo "投稿タイプを指定してください。\n";
    echo "例: wp eval-file import-posts-from-json.php news --allow-root\n";
    echo "例: wp eval-file import-posts-from-json.php news dev --allow-root\n";
    exit(1);
}

if (!is_string($import_env) || $import_env === '') {
    $import_env = 'prod';
}

require_once get_theme_file_path('inc/utils/import-posts-from-json.php');

try {
    (new ThemePostJsonImporter($post_type, $import_env))->run();
} catch (Throwable $e) {
    echo '[ERROR] ' . $e->getMessage() . "\n";
    exit(1);
}
