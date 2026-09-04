<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/../code-sync-dev-mode.php';

/***************************************************
taxonomy-terms-order の設定
 ****************************************************/

/**
 * taxonomy-terms-order のサブメニューを制御
 *
 * コード制御モード: メニューを非表示
 * 配信モード      : ラベルを「カテゴリの表示順変更」に変更
 */
add_action('admin_menu', 'custom_taxonomy_order_submenu_label', 999);
function custom_taxonomy_order_submenu_label()
{
    global $submenu;

    if (!class_exists('Post')) {
        return;
    }

    $is_code_sync_mode = uds_term_order_is_code_sync_dev_mode();

    foreach (Post::getAll() as $post_type_slug => $config) {
        $parent = 'edit.php?post_type=' . $post_type_slug;
        if (!isset($submenu[$parent])) {
            continue;
        }

        foreach ($submenu[$parent] as $key => $details) {
            $label = $details[0] ?? '';
            if ($label !== 'タクソノミーの並び順' && $label !== 'Taxonomy Order' && $label !== 'カテゴリの表示順変更') {
                continue;
            }

            if ($is_code_sync_mode) {
                unset($submenu[$parent][$key]);
                continue;
            }

            $submenu[$parent][$key][0] = 'カテゴリの表示順変更';
        }
    }
}

/**
 * posts.php の term_settings.order を term_order に反映（コード制御モード時のみ）
 */
add_action(
    'init',
    function () {
        if (!uds_term_order_is_code_sync_dev_mode() || !class_exists('Post')) {
            return;
        }

        global $wpdb;

        foreach (Post::getAll() as $post_type_key => $post) {
            $term_settings_by_tax = Post::getTermSettings($post_type_key) ?? [];

            foreach ($term_settings_by_tax as $taxonomy_slug => $terms) {
                if (empty($taxonomy_slug) || !taxonomy_exists($taxonomy_slug)) {
                    continue;
                }
                if (empty($terms) || !is_array($terms)) {
                    continue;
                }

                foreach ($terms as $term_setting) {
                    $term_slug = $term_setting['slug'] ?? '';
                    $order     = $term_setting['order'] ?? null;

                    if ($term_slug === '' || $order === null) {
                        continue;
                    }

                    $term_obj = get_term_by('slug', $term_slug, $taxonomy_slug);
                    if (!$term_obj || empty($term_obj->term_id)) {
                        continue;
                    }

                    $wpdb->update(
                        $wpdb->terms,
                        ['term_order' => (int) $order],
                        ['term_id' => (int) $term_obj->term_id],
                        ['%d'],
                        ['%d']
                    );
                }
            }
        }
    },
    20
);
