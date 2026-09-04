<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * JSON インポート投稿の手動編集保護
 *************************************************/

foreach (array_keys(Post::getAll()) as $post_type) {
    add_action(
        "save_post_{$post_type}",
        function ($post_id, $post, $update) {
            if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
                return;
            }
            if (wp_is_post_revision($post_id)) {
                return;
            }
            if (!is_admin()) {
                return;
            }
            if (!isset($_POST['post_ID']) || (int) $_POST['post_ID'] !== (int) $post_id) {
                return;
            }

            update_post_meta($post_id, '_manual_edit', 1);
        },
        10,
        3
    );
}
