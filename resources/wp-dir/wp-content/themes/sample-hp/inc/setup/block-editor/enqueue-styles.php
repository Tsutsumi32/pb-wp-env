<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * ブロックエディタ用 CSS（wp-block-styles.css）
 *
 * フロント / 管理画面で同一 CSS を読み込む
 * SCSS: src/scss/wp-block-styles.scss
 *************************************************/

/**
 * wp-block-styles.css を enqueue する
 */
function sample_hp_enqueue_wp_block_styles(): void
{
    $style_path = get_template_directory() . '/dist/css/wp-block-styles.css';
    if (!is_readable($style_path)) {
        return;
    }

    wp_enqueue_style(
        'sample-hp-wp-block-styles',
        get_template_directory_uri() . '/dist/css/wp-block-styles.css',
        [],
        (string) filemtime($style_path)
    );
}

/**
 * ブロックエディタ（管理画面）用
 */
function sample_hp_enqueue_wp_block_styles_for_editor(): void
{
    if (!is_admin()) {
        return;
    }

    sample_hp_enqueue_wp_block_styles();
}
add_action('enqueue_block_assets', 'sample_hp_enqueue_wp_block_styles_for_editor');
