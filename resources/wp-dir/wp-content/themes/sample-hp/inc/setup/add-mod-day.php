<?php

/***************************************************
    管理画面に最終更新日の表示
 ****************************************************/
function add_posts_column($columns)
{
    $new_columns = [];
    $check       = false;

    foreach ($columns as $name => $display_name) {
        if ($display_name == 'ID') {
            $new_columns['last_modified'] = '更新日';
            $check                        = true;
        }
        $new_columns[$name] = $display_name;
    }

    if (!$check) {
        $new_columns['last_modified'] = '更新日';
    }

    return $new_columns;
}

function show_last_modified_column($column_name, $post_id)
{
    if ($column_name === 'last_modified') {
        echo get_the_modified_date('Y-m-d H:i', $post_id);
    }
}

// カラム追加
add_filter('manage_edit-post_columns', 'add_posts_column');
add_filter('manage_edit-page_columns', 'add_posts_column');
foreach (Post::getAll() as $slug => $post) {
    add_filter('manage_edit-' . $slug . '_columns', 'add_posts_column');
}

// カラム内容表示
add_action('manage_post_posts_custom_column', 'show_last_modified_column', 10, 2);
add_action('manage_page_posts_custom_column', 'show_last_modified_column', 10, 2);
foreach (Post::getAll() as $slug => $post) {
    add_action("manage_{$slug}_posts_custom_column", 'show_last_modified_column', 10, 2);
}
