<?php

if (!defined('ABSPATH')) {
    exit();
}

/**
 * 設定用非公開固定ページの ID を取得する
 */
function get_cpt_page_settings_page_id(string $settings_key): int
{
    $page_slug = CptPageSettings::getPageSlug($settings_key);
    if ($page_slug === null || $page_slug === '') {
        return 0;
    }

    $page = get_page_by_path($page_slug, OBJECT, 'page');
    if (!($page instanceof WP_Post)) {
        return 0;
    }

    return (int) $page->ID;
}

/**
 * 設定用非公開固定ページを確保する
 */
function ensure_cpt_page_setting_page(string $settings_key): int
{
    $setting = CptPageSettings::get($settings_key);
    if ($setting === null) {
        return 0;
    }

    $page_title    = (string) ($setting['page_title'] ?? '');
    $page_slug     = (string) ($setting['page_slug'] ?? '');
    $page_template = (string) ($setting['page_template'] ?? '');
    if ($page_slug === '' || $page_template === '') {
        return 0;
    }

    $page_id = get_cpt_page_settings_page_id($settings_key);
    if ($page_id > 0) {
        $page = get_post($page_id);
        if ($page instanceof WP_Post) {
            $update_args = ['ID' => $page_id];

            if ($page_title !== '' && $page->post_title !== $page_title) {
                $update_args['post_title'] = $page_title;
            }

            $current_template = (string) get_page_template_slug($page_id);
            if ($current_template !== $page_template) {
                $update_args['page_template'] = $page_template;
            }

            if (count($update_args) > 1) {
                wp_update_post($update_args);
            }

            update_post_meta($page_id, '_wp_page_template', $page_template);
        }

        return $page_id;
    }

    $inserted_id = wp_insert_post(
        [
            'post_title'   => $page_title !== '' ? $page_title : $page_slug,
            'post_name'    => $page_slug,
            'post_type'    => 'page',
            'post_status'  => 'private',
            'post_content' => '',
        ],
        true
    );

    if (is_wp_error($inserted_id)) {
        return 0;
    }

    $page_id = (int) $inserted_id;
    update_post_meta($page_id, '_wp_page_template', $page_template);

    return $page_id;
}

/**
 * 全設定用非公開固定ページを確保する
 */
function ensure_cpt_page_settings_pages(): void
{
    foreach (array_keys(CptPageSettings::getAll()) as $settings_key) {
        ensure_cpt_page_setting_page($settings_key);
    }
}

/**
 * CPT メニュー配下に設定画面への導線を追加する
 */
function register_cpt_page_settings_admin_menus(): void
{
    global $submenu;

    foreach (CptPageSettings::getAll() as $settings_key => $setting) {
        $page_id = get_cpt_page_settings_page_id($settings_key);
        if ($page_id <= 0) {
            continue;
        }

        $post_type = (string) ($setting['post_type'] ?? '');
        if ($post_type === '') {
            continue;
        }

        $parent_slug = 'edit.php?post_type=' . $post_type;
        $edit_url    = 'post.php?post=' . $page_id . '&action=edit';
        $menu_label  = CptPageSettings::getAdminMenuLabel($settings_key) ?? '';
        $capability  = CptPageSettings::getCapability($settings_key);

        if ($menu_label === '') {
            continue;
        }

        if (!isset($submenu[$parent_slug]) || !is_array($submenu[$parent_slug])) {
            continue;
        }

        $submenu[$parent_slug][] = [$menu_label, $capability, $edit_url, $menu_label];
    }
}
add_action('admin_menu', 'register_cpt_page_settings_admin_menus', 99);

/**
 * 設定用固定ページ編集時に親 CPT メニューをアクティブ表示する
 *
 * @param string|null $parent_file
 * @return string|null
 */
function highlight_cpt_menu_on_page_settings_edit(?string $parent_file): ?string
{
    global $post;
    if (!($post instanceof WP_Post)) {
        return $parent_file;
    }

    $settings_key = CptPageSettings::getKeyByPageId((int) $post->ID);
    if ($settings_key === null) {
        return $parent_file;
    }

    $post_type = CptPageSettings::getPostType($settings_key);
    if ($post_type === null || $post_type === '') {
        return $parent_file;
    }

    return 'edit.php?post_type=' . $post_type;
}
add_filter('parent_file', 'highlight_cpt_menu_on_page_settings_edit');

/**
 * @param string|null $submenu_file
 * @return string|null
 */
function highlight_cpt_page_settings_submenu(?string $submenu_file): ?string
{
    global $post;
    if (!($post instanceof WP_Post)) {
        return $submenu_file;
    }

    $settings_key = CptPageSettings::getKeyByPageId((int) $post->ID);
    if ($settings_key === null) {
        return $submenu_file;
    }

    $page_id = (int) $post->ID;
    if ($page_id <= 0) {
        return $submenu_file;
    }

    return 'post.php?post=' . $page_id . '&action=edit';
}
add_filter('submenu_file', 'highlight_cpt_page_settings_submenu');

/**
 * 固定ページ一覧から設定用ページを除外する
 *
 * @param WP_Query $query
 */
function exclude_cpt_page_settings_from_pages_list(WP_Query $query): void
{
    if (!is_admin() || !$query->is_main_query()) {
        return;
    }

    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->id !== 'edit-page') {
        return;
    }

    $exclude_ids = (array) $query->get('post__not_in');
    foreach (array_keys(CptPageSettings::getAll()) as $settings_key) {
        $page_id = get_cpt_page_settings_page_id($settings_key);
        if ($page_id > 0) {
            $exclude_ids[] = $page_id;
        }
    }

    if ($exclude_ids === []) {
        return;
    }

    $query->set('post__not_in', array_values(array_unique(array_map('intval', $exclude_ids))));
}
add_action('pre_get_posts', 'exclude_cpt_page_settings_from_pages_list');

/**
 * 設定用固定ページのフロント閲覧を禁止する
 */
function block_cpt_page_settings_frontend(): void
{
    if (!is_page()) {
        return;
    }

    $page = get_queried_object();
    if (!($page instanceof WP_Post)) {
        return;
    }

    if (CptPageSettings::getKeyByPageSlug((string) $page->post_name) === null) {
        return;
    }

    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    nocache_headers();
}
add_action('template_redirect', 'block_cpt_page_settings_frontend');

/**
 * 設定用固定ページはクラシック編集画面を使う
 *
 * @param bool    $use_block_editor
 * @param WP_Post $post
 * @return bool
 */
function use_classic_editor_for_cpt_page_settings(bool $use_block_editor, WP_Post $post): bool
{
    if (CptPageSettings::getKeyByPageId((int) $post->ID) !== null) {
        return false;
    }

    return $use_block_editor;
}
add_filter('use_block_editor_for_post', 'use_classic_editor_for_cpt_page_settings', 10, 2);

/**
 * 設定用固定ページでは本文エディタ等を非表示にする
 */
function hide_editor_on_cpt_page_settings_screen(): void
{
    $post_id = isset($_GET['post']) ? (int) $_GET['post'] : 0;
    if ($post_id <= 0) {
        return;
    }

    if (CptPageSettings::getKeyByPageId($post_id) === null) {
        return;
    }

    remove_post_type_support('page', 'editor');
    remove_post_type_support('page', 'thumbnail');
    remove_post_type_support('page', 'excerpt');
    remove_post_type_support('page', 'comments');
}
add_action('load-post.php', 'hide_editor_on_cpt_page_settings_screen');

add_action(
    'after_setup_theme',
    static function (): void {
        ensure_cpt_page_settings_pages();
    },
    20
);
