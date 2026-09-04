<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * コアブロックのブロックスタイル登録・制限
 *
 * スタイル定義: src/scss/wp-block-editor/ → dist/css/wp-block-styles.css
 * 仕様書（管理画面）も本ファイルの定義を参照する
 *************************************************/

/**
 * テーマが追加するブロックスタイル
 *
 * @return array<string, list<array{name: string, label: string}>>
 */
function sample_hp_get_registered_core_block_styles(): array
{
    return [
        'core/button' => [
            [
                'name'  => 'secondary',
                'label' => 'Secondary',
            ],
        ],
    ];
}

/**
 * コア標準のうち非表示にするブロックスタイル
 *
 * @return array<string, list<array{name: string, label: string}>>
 */
function sample_hp_get_disallowed_core_block_styles(): array
{
    return [
        'core/button' => [
            [
                'name'  => 'fill',
                'label' => '塗りつぶし',
            ],
            [
                'name'  => 'outline',
                'label' => '枠線',
            ],
        ],
        'core/image' => [
            [
                'name'  => 'rounded',
                'label' => '角丸',
            ],
        ],
    ];
}

/**
 * コアブロックのブロックスタイルを登録
 */
function sample_hp_register_core_block_styles(): void
{
    foreach (sample_hp_get_registered_core_block_styles() as $block_name => $styles) {
        foreach ($styles as $style) {
            register_block_style($block_name, $style);
        }
    }
}
add_action('init', 'sample_hp_register_core_block_styles');

/**
 * コア標準の不要なブロックスタイルを削除
 */
function sample_hp_unregister_core_block_styles(): void
{
    foreach (sample_hp_get_disallowed_core_block_styles() as $block_name => $styles) {
        foreach ($styles as $style) {
            unregister_block_style($block_name, $style['name']);
        }
    }
}
add_action('init', 'sample_hp_unregister_core_block_styles', 20);

/**
 * ブロックエディタでコア標準の不要スタイルを非表示にする（JS）
 */
function sample_hp_enqueue_block_editor_style_restrictions(): void
{
    $script_file = 'block-styles.js';
    $script_path = sample_hp_block_editor_js_path($script_file);
    if (!is_readable($script_path)) {
        return;
    }

    $disallowed = [];
    foreach (sample_hp_get_disallowed_core_block_styles() as $block_name => $styles) {
        $disallowed[$block_name] = array_values(array_map(
            static fn (array $style): string => $style['name'],
            $styles
        ));
    }

    wp_enqueue_script(
        'sample-hp-block-editor-styles',
        sample_hp_block_editor_js_uri($script_file),
        ['wp-blocks', 'wp-dom-ready', 'wp-hooks'],
        (string) filemtime($script_path),
        true
    );

    wp_localize_script('sample-hp-block-editor-styles', 'sampleHpBlockStyleRestrictions', [
        'disallowed' => $disallowed,
    ]);
}
add_action(
    'enqueue_block_editor_assets',
    'sample_hp_enqueue_block_editor_style_restrictions'
);
