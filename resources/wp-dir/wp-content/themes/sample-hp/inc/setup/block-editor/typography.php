<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/../../config/admin-style.php';

/************************************************
 * ブロックエディタ本文のフォント系統（.editor-styles-wrapper）
 *
 * コア reset（block-library/reset.min.css）が serif を指定するため、
 * admin-style.php の ADMIN_STYLE_BLOCK_EDITOR_FONT_* で上書きする。
 *************************************************/

/**
 * ブロックエディタ用フォントスタック一覧を返す
 *
 * @return array<string, string>
 */
function sample_hp_get_block_editor_font_stacks(): array
{
    return [
        'sans'  => ADMIN_STYLE_BLOCK_EDITOR_FONT_STACK_SANS,
        'serif' => ADMIN_STYLE_BLOCK_EDITOR_FONT_STACK_SERIF,
    ];
}

/**
 * admin-style.php の ADMIN_STYLE_BLOCK_EDITOR_FONT_FAMILY を検証して返す
 */
function sample_hp_resolve_block_editor_font_family(): string
{
    $family = ADMIN_STYLE_BLOCK_EDITOR_FONT_FAMILY;
    $stacks = sample_hp_get_block_editor_font_stacks();

    if (!array_key_exists($family, $stacks)) {
        return 'sans';
    }

    return $family;
}

/**
 * ブロックエディタ本文エリアの font-family を上書きする CSS を出力
 */
function sample_hp_enqueue_block_editor_typography(): void
{
    $family_key = sample_hp_resolve_block_editor_font_family();
    $stacks     = sample_hp_get_block_editor_font_stacks();
    $font_stack = $stacks[$family_key];

    $css = sprintf('.editor-styles-wrapper{font-family:%s !important;}', $font_stack);

    wp_register_style('sample-hp-block-editor-typography', false, [], null);
    wp_enqueue_style('sample-hp-block-editor-typography');
    wp_add_inline_style('sample-hp-block-editor-typography', $css);
}
add_action('enqueue_block_editor_assets', 'sample_hp_enqueue_block_editor_typography', 20);
