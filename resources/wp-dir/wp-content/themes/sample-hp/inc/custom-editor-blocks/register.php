<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/setup/block-category.php';
require_once __DIR__ . '/setup/heading-anchor-setup.php';

/************************************************
 * ブロックエディタ用カスタムブロック登録
 *************************************************/

/**
 * テーマカスタムブロックを登録する
 */
function sample_hp_register_custom_blocks(): void
{
    $blocks = [
        'table-of-contents' => 'sample_hp_render_table_of_contents_block',
        'post-card'         => 'sample_hp_render_post_card_block',
        'link-card'         => 'sample_hp_render_link_card_block',
        'description-list'  => 'sample_hp_render_description_list_block',
    ];

    foreach ($blocks as $slug => $render_callback) {
        $block_dir = __DIR__ . '/' . $slug;
        if (!is_dir($block_dir)) {
            continue;
        }

        $render_file = $block_dir . '/render.php';
        if (is_readable($render_file)) {
            require_once $render_file;
        }

        if (!is_callable($render_callback)) {
            continue;
        }

        register_block_type($block_dir, [
            'render_callback' => $render_callback,
        ]);
    }
}
add_action('init', 'sample_hp_register_custom_blocks');

/**
 * カスタムブロックのスタイル
 *
 * dist/css/wp-block-styles.css（inc/setup/block-editor/enqueue-styles.php）
 */

/**
 * 記事カードブロック用のエディタ設定を渡す
 */
function sample_hp_localize_post_card_block_config(): void
{
    $script_path = __DIR__ . '/post-card/editor.js';
    $config_path = __DIR__ . '/post-card/config.php';
    if (!is_readable($script_path) || !is_readable($config_path)) {
        return;
    }

    require_once $config_path;

    wp_localize_script('custom-block-post-card-editor-script', 'customBlockPostCardConfig', [
        'postTypes' => PostCardBlockConfig::getPostTypeOptions(),
    ]);
}
add_action('enqueue_block_editor_assets', 'sample_hp_localize_post_card_block_config');
