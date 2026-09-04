<?php

require_once dirname(__DIR__) . '/setup/block-editor/enqueue-styles.php';

/***************************************************
    CSS・JS読み込み
 *
 * 読み込み順:
 *   global CSS → 共通 CSS → プラグイン CSS（head）→ ページ CSS
 *   プラグイン JS（before_page_js）→ ページ JS → プラグイン JS（after_page_js）
 *
 * 外部プラグインは inc/config/assets-plugins.php（AssetsPlugins）で定義
 ****************************************************/

/**
 * 画面キーから CSS/JS のファイル名を解決する
 */
function sample_hp_resolve_assets_file_name(?string $slug): ?string
{
    if ($slug === null || $slug === '') {
        return null;
    }

    $file_name   = $slug;
    $assets_name = Page::getAssetsName($slug);
    if (empty($assets_name)) {
        $assets_name = Post::getAssetsName($slug);
    }
    if (!empty($assets_name)) {
        $file_name = $assets_name;
    }

    return $file_name;
}

/**
 * テーマのアセットを一括 enqueue
 */
function enqueue_theme_assets(): void
{
    $page_id = get_current_slug();
    if ($page_id === null || $page_id === '') {
        return;
    }

    $file_name = sample_hp_resolve_assets_file_name($page_id);
    if ($file_name === null) {
        return;
    }

    $theme_dir = get_template_directory();
    $theme_uri = get_template_directory_uri();
    $version   = date('YmdHi');

    // global CSS
    wp_enqueue_style(
        'style-global',
        $theme_uri . '/dist/css/global.css',
        [],
        $version,
        'all'
    );

    // 共通 CSS
    wp_enqueue_style(
        'style-common',
        $theme_uri . '/dist/css/common.css',
        ['style-global'],
        $version,
        'all'
    );

    // ブロックエディタ用 CSS（カスタムブロック / core ブロックスタイル）
    sample_hp_enqueue_wp_block_styles();

    // プラグイン CSS（共通 CSS の後・ページ CSS の前）
    AssetsPlugins::enqueue($page_id, 'head');

    // ページ CSS
    $css_file_path = $theme_dir . '/dist/css/' . $file_name . '.css';
    if (file_exists($css_file_path)) {
        wp_enqueue_style(
            'style' . $file_name,
            $theme_uri . '/dist/css/' . $file_name . '.css',
            ['style-common'],
            $version,
            'all'
        );
    }

    // プラグイン JS（ページ JS の前）
    AssetsPlugins::enqueue($page_id, 'before_page_js');
    $before_js_deps = AssetsPlugins::getScriptHandles($page_id, 'before_page_js');

    // ページ JS
    $js_file_path = $theme_dir . '/dist/js/' . $file_name . '.js';
    if (!file_exists($js_file_path)) {
        $file_name = 'commonPage';
    }
    $js_handle = 'script' . $file_name;
    wp_enqueue_script(
        $js_handle,
        $theme_uri . '/dist/js/' . $file_name . '.js',
        $before_js_deps,
        $version,
        true
    );
    wp_localize_script($js_handle, 'themeData', [
        'themeUrl' => $theme_uri,
        'ajax_url' => admin_url('admin-ajax.php'),
    ]);

    // プラグイン JS（ページ JS の後）
    AssetsPlugins::enqueue($page_id, 'after_page_js', [
        'page_script_handle' => $js_handle,
    ]);
}
add_action('wp_enqueue_scripts', 'enqueue_theme_assets');
