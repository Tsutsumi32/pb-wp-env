<?php

/**
 * アーカイブ一覧へ戻る URL を解決する
 *
 * 一覧 → 詳細の遷移時はカテゴリ・ページ番号を維持し、
 * トップ等からの遷移時はアーカイブ先頭へ戻す。
 */

/** 一覧状態: カテゴリ（タームスラッグ） */
const ARCHIVE_BACK_CAT_QUERY_KEY = 'arc_cat';

/** 一覧状態: ページ番号 */
const ARCHIVE_BACK_PAGED_QUERY_KEY = 'arc_paged';

/** 一覧へ戻った際のスクロール先アンカー（categorySearch / pagination と共通） */
const ARCHIVE_BACK_ANCHOR_ID = 'search';

/**
 * カテゴリ検索で利用する先頭タクソノミーを取得
 */
function archive_back_get_primary_taxonomy(string $post_type): string
{
    $categories = Post::getCategorySettings($post_type) ?? [];

    return (string) ($categories[0]['slug'] ?? '');
}

/**
 * パスを比較用に正規化する
 */
function archive_back_normalize_path(string $path): string
{
    $normalized = untrailingslashit($path);

    return $normalized === '' ? '/' : $normalized;
}

/**
 * 指定パスがアーカイブ基底パス、またはそのページネーション配下か
 */
function archive_back_path_matches_archive(string $path, string $archive_base_path): bool
{
    $path         = archive_back_normalize_path($path);
    $archive_path = archive_back_normalize_path($archive_base_path);

    if ($path === $archive_path) {
        return true;
    }

    return str_starts_with($path, $archive_path . '/page/');
}

/**
 * 投稿タイプに紐づくアーカイブ URL の基底パス一覧を取得
 *
 * @return string[]
 */
function archive_back_collect_archive_base_paths(string $post_type): array
{
    if (!Post::exists($post_type)) {
        return [];
    }

    $paths = [];

    $archive_link = get_post_type_archive_link($post_type);
    if (is_string($archive_link) && $archive_link !== '') {
        $archive_path = wp_parse_url($archive_link, PHP_URL_PATH);
        if (is_string($archive_path) && $archive_path !== '') {
            $paths[] = archive_back_normalize_path($archive_path);
        }
    }

    foreach (Post::getCategorySettings($post_type) ?? [] as $category) {
        $taxonomy = (string) ($category['slug'] ?? '');
        if ($taxonomy === '') {
            continue;
        }

        $terms = get_terms([
            'taxonomy'   => $taxonomy,
            'hide_empty' => false,
        ]);
        if (!is_array($terms) || is_wp_error($terms)) {
            continue;
        }

        foreach ($terms as $term) {
            if (!$term instanceof WP_Term) {
                continue;
            }

            $term_link = get_term_link($term);
            if (is_wp_error($term_link) || !is_string($term_link) || $term_link === '') {
                continue;
            }

            $term_path = wp_parse_url($term_link, PHP_URL_PATH);
            if (!is_string($term_path) || $term_path === '') {
                continue;
            }

            $paths[] = archive_back_normalize_path($term_path);
        }
    }

    return array_values(array_unique($paths));
}

/**
 * 同一サイト内のアーカイブ URL か検証する（Referer フォールバック用）
 */
function archive_back_is_valid_archive_url(string $url, string $post_type): bool
{
    if ($url === '' || !Post::exists($post_type)) {
        return false;
    }

    $parsed = wp_parse_url($url);
    if (!is_array($parsed) || empty($parsed['host'])) {
        return false;
    }

    $home = wp_parse_url(home_url('/'));
    if (!is_array($home) || empty($home['host'])) {
        return false;
    }

    if (strcasecmp((string) $parsed['host'], (string) $home['host']) !== 0) {
        return false;
    }

    $path = archive_back_normalize_path((string) ($parsed['path'] ?? '/'));

    foreach (archive_back_collect_archive_base_paths($post_type) as $archive_base_path) {
        if (archive_back_path_matches_archive($path, $archive_base_path)) {
            return true;
        }
    }

    return false;
}

/**
 * 投稿タイプで利用可能なタームスラッグか検証する
 */
function archive_back_is_valid_term_slug(string $post_type, string $term_slug): bool
{
    if ($term_slug === '' || $term_slug === 'all' || !Post::exists($post_type)) {
        return false;
    }

    $taxonomy = archive_back_get_primary_taxonomy($post_type);
    if ($taxonomy === '') {
        return false;
    }

    $term = get_term_by('slug', $term_slug, $taxonomy);
    if (!$term || is_wp_error($term)) {
        return false;
    }

    $term_settings = Post::getTermSettings($post_type)[$taxonomy] ?? [];
    foreach ($term_settings as $setting) {
        if ((string) ($setting['slug'] ?? '') === $term_slug) {
            return true;
        }
    }

    return false;
}

/**
 * 現在の一覧画面の状態を取得する
 *
 * @return array{term_slug: string, paged: int}
 */
function archive_back_get_current_list_state(string $post_type): array
{
    $term_slug = '';
    $taxonomy  = archive_back_get_primary_taxonomy($post_type);

    if ($taxonomy !== '' && is_tax($taxonomy)) {
        $queried_term = get_queried_object();
        if ($queried_term instanceof WP_Term) {
            $term_slug = $queried_term->slug;
        }
    }

    return [
        'term_slug' => $term_slug,
        'paged'     => max(1, (int) get_query_var('paged')),
    ];
}

/**
 * リクエストから一覧状態を取得する
 *
 * @return array{term_slug: string, paged: int}|null
 */
function archive_back_parse_request_state(string $post_type): ?array
{
    $has_cat   = isset($_GET[ARCHIVE_BACK_CAT_QUERY_KEY]);
    $has_paged = isset($_GET[ARCHIVE_BACK_PAGED_QUERY_KEY]);

    if (!$has_cat && !$has_paged) {
        return null;
    }

    $term_slug = '';
    if ($has_cat) {
        $raw_cat = wp_unslash($_GET[ARCHIVE_BACK_CAT_QUERY_KEY]);
        if (!is_string($raw_cat) || $raw_cat === '' || $raw_cat === 'all') {
            return null;
        }

        $term_slug = sanitize_title($raw_cat);
        if (!archive_back_is_valid_term_slug($post_type, $term_slug)) {
            return null;
        }
    }

    $paged = 1;
    if ($has_paged) {
        $raw_paged = wp_unslash($_GET[ARCHIVE_BACK_PAGED_QUERY_KEY]);
        $paged     = max(1, (int) $raw_paged);
    }

    return [
        'term_slug' => $term_slug,
        'paged'     => $paged,
    ];
}

/**
 * 一覧状態からアーカイブ URL を組み立てる
 *
 * @param array{term_slug: string, paged: int} $state
 */
function archive_back_build_url_from_state(
    string $post_type,
    array $state,
    string $anchor_id = ARCHIVE_BACK_ANCHOR_ID
): string {
    $term_slug = (string) ($state['term_slug'] ?? '');
    $paged     = max(1, (int) ($state['paged'] ?? 1));
    $base_url  = get_page_url($post_type);

    if ($term_slug !== '' && archive_back_is_valid_term_slug($post_type, $term_slug)) {
        $taxonomy = archive_back_get_primary_taxonomy($post_type);
        $term     = get_term_by('slug', $term_slug, $taxonomy);
        if ($term && !is_wp_error($term)) {
            $term_link = get_term_link($term);
            if (!is_wp_error($term_link) && is_string($term_link) && $term_link !== '') {
                $base_url = $term_link;
            }
        }
    }

    if ($paged > 1) {
        $base_url = add_query_arg('paged', $paged, $base_url);
    }

    return esc_url(append_url_fragment($base_url, $anchor_id));
}

/**
 * 現在の画面が対象投稿タイプの一覧コンテキストか
 */
function archive_back_is_list_context(string $post_type): bool
{
    if (!Post::exists($post_type)) {
        return false;
    }

    if (is_post_type_archive($post_type)) {
        return true;
    }

    foreach (Post::getCategorySettings($post_type) ?? [] as $category) {
        $taxonomy = (string) ($category['slug'] ?? '');
        if ($taxonomy !== '' && is_tax($taxonomy)) {
            return true;
        }
    }

    return false;
}

/**
 * 詳細ページの「一覧へ戻る」URLを取得する
 *
 * 優先順位:
 * 1. クエリパラメータ arc_cat / arc_paged（一覧リンクから渡された状態）
 * 2. HTTP Referer（同一アーカイブ由来の遷移）
 * 3. 投稿タイプのアーカイブ URL
 *
 * @param array{
 *   anchor_id?: string,
 * } $args
 */
function get_archive_back_url(string $post_type_slug, array $args = []): string
{
    $anchor_id = (string) ($args['anchor_id'] ?? ARCHIVE_BACK_ANCHOR_ID);
    $fallback  = get_page_url($post_type_slug);

    $request_state = archive_back_parse_request_state($post_type_slug);
    if ($request_state !== null) {
        return archive_back_build_url_from_state($post_type_slug, $request_state, $anchor_id);
    }

    if (!empty($_SERVER['HTTP_REFERER'])) {
        $referer = wp_unslash($_SERVER['HTTP_REFERER']);
        if (
            is_string($referer)
            && $referer !== ''
            && archive_back_is_valid_archive_url(esc_url_raw($referer), $post_type_slug)
        ) {
            return esc_url(append_url_fragment(esc_url_raw($referer), $anchor_id));
        }
    }

    return esc_url(append_url_fragment($fallback, $anchor_id));
}

/**
 * 一覧から詳細へ遷移するリンク URL を取得する
 *
 * 一覧画面からの遷移時のみ arc_cat / arc_paged を付与する。
 */
function get_archive_item_url(string $post_type_slug, int $post_id): string
{
    $permalink = get_permalink($post_id);
    if (!is_string($permalink) || $permalink === '') {
        return '';
    }

    if (!archive_back_is_list_context($post_type_slug)) {
        return esc_url($permalink);
    }

    $state      = archive_back_get_current_list_state($post_type_slug);
    $query_args = [];

    if ($state['term_slug'] !== '') {
        $query_args[ARCHIVE_BACK_CAT_QUERY_KEY] = $state['term_slug'];
    }
    if ($state['paged'] > 1) {
        $query_args[ARCHIVE_BACK_PAGED_QUERY_KEY] = $state['paged'];
    }

    if ($query_args === []) {
        return esc_url($permalink);
    }

    return esc_url(add_query_arg($query_args, $permalink));
}
