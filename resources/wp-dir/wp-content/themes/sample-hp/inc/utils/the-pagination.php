<?php

if (!defined('ABSPATH')) {
    exit();
}

/***************************************************
    共通ページネーション
 ****************************************************/

/**
 * URL にフラグメント（#id）を付与する
 */
function append_url_fragment(string $url, string $fragment = ''): string
{
    if ($fragment === '' || $url === '' || $url === '#') {
        return $url;
    }

    $fragment = ltrim($fragment, '#');

    return preg_replace('/#.*$/', '', $url) . '#' . $fragment;
}

/**
 * 表示するページ番号（最大5件）を返す
 *
 * 先頭は奇数ページに揃え、表示中の3つ目を選ぶと窓が2つ進む
 * （1〜2ページ目: 1-5、3〜4ページ目: 3-7 …）。
 * 末尾に差し掛かる場合は、常に最後の max_display 件を表示する
 * （例: 全20ページなら 16-20）。
 *
 * @return int[]
 */
function get_pagination_page_numbers(int $current, int $total, int $max_display = 5): array
{
    if ($total < 1) {
        return [];
    }

    $current     = max(1, min($current, $total));
    $max_display = max(1, $max_display);

    if ($total <= $max_display) {
        return range(1, $total);
    }

    $start = ($current % 2 === 1) ? $current : $current - 1;
    if ($start < 1) {
        $start = 1;
    }

    $end = $start + $max_display - 1;
    if ($end > $total) {
        $end   = $total;
        $start = $total - $max_display + 1;
    }

    return range($start, $end);
}

/**
 * 現在のアーカイブ（投稿タイプ / タクソノミー）のページ URL を返す
 */
function get_archive_pagenum_link(int $pagenum): string
{
    $pagenum = max(1, $pagenum);
    $base    = '';

    if (is_tax() || is_category() || is_tag()) {
        $term = get_queried_object();
        if ($term instanceof WP_Term) {
            $term_link = get_term_link($term);
            if (!is_wp_error($term_link)) {
                $base = (string) $term_link;
            }
        }
    } elseif (is_post_type_archive()) {
        $post_type = get_query_var('post_type');
        if (is_array($post_type)) {
            $post_type = $post_type[0] ?? '';
        }
        if (is_string($post_type) && $post_type !== '') {
            $archive_link = get_post_type_archive_link($post_type);
            if (is_string($archive_link) && $archive_link !== '') {
                $base = $archive_link;
            }
        }
    }

    if ($base === '') {
        return get_pagenum_link($pagenum);
    }

    $base = trailingslashit($base);
    if ($pagenum === 1) {
        return $base;
    }

    global $wp_rewrite;
    $pagination_base = isset($wp_rewrite->pagination_base) ? (string) $wp_rewrite->pagination_base : 'page';

    return $base . user_trailingslashit($pagination_base . '/' . $pagenum, 'paged');
}

/**
 * アーカイブ用ページネーションを出力する
 *
 * @param WP_Query|null $query
 */
function the_pagination($query = null, string $fragment = '')
{
    global $wp_query;

    if (!($query instanceof WP_Query)) {
        $query = $wp_query;
    }

    if (!($query instanceof WP_Query)) {
        return;
    }

    $paged = $query->get('paged');
    if ($paged === '' || $paged === null) {
        $paged = get_query_var('paged');
    }
    $current = max(1, (int) $paged);

    $total = (int) $query->max_num_pages;
    if ($total <= 1) {
        return;
    }

    $pages = get_pagination_page_numbers($current, $total);
    if ($pages === []) {
        return;
    }

    $is_first = $current <= 1;
    $is_last  = $current >= $total;

    $first_url = $is_first ? '' : append_url_fragment(get_archive_pagenum_link(1), $fragment);
    $prev_url  = $is_first ? '' : append_url_fragment(get_archive_pagenum_link($current - 1), $fragment);
    $next_url  = $is_last ? '' : append_url_fragment(get_archive_pagenum_link($current + 1), $fragment);
    $last_url  = $is_last ? '' : append_url_fragment(get_archive_pagenum_link($total), $fragment);

    $page_urls = [];
    foreach ($pages as $page_num) {
        $page_urls[$page_num] = append_url_fragment(get_archive_pagenum_link((int) $page_num), $fragment);
    }

    get_template_part(
        'modules/blocks/pagination',
        null,
        [
            'current'        => $current,
            'pages'          => $pages,
            'page_urls'      => $page_urls,
            'first_url'      => $first_url,
            'prev_url'       => $prev_url,
            'next_url'       => $next_url,
            'last_url'       => $last_url,
            'first_disabled' => $is_first,
            'prev_disabled'  => $is_first,
            'next_disabled'  => $is_last,
            'last_disabled'  => $is_last,
        ]
    );
}
