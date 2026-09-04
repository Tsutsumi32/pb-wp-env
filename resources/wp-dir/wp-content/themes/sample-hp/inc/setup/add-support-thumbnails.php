<?php

/***************************************************
    アイキャッチ設定の有効化
 ****************************************************/
add_action('after_setup_theme', function () {
    add_theme_support('post-thumbnails');
});

/***************************************************
    管理画面の一覧にアイキャッチ表示
 * （Post:: post_type_settings.supports に thumbnail がある投稿タイプのみ）
 ****************************************************/
foreach (Post::getPostTypeSlugsWithThumbnailSupport() as $post_type) {
    add_filter("manage_{$post_type}_posts_columns", 'add_my_columns');
    add_action("manage_{$post_type}_posts_custom_column", 'display_my_columns', 10, 2);
}

function add_my_columns($columns)
{
    $columns['thumbnail'] = 'アイキャッチ';
    return $columns;
}
function display_my_columns($column, $post_id)
{
    if ('thumbnail' === $column) {
        echo get_the_post_thumbnail($post_id, [80, 80]) ?: '－';
    }
}
