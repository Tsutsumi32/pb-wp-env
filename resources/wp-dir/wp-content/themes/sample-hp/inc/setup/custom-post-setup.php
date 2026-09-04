<?php

/***************************************************
    カスタム投稿タイプ設定
 ****************************************************/
function custom_post_setup()
{
    // カスタム投稿設定
    foreach (Post::getAll() as $slug => $post) {
        $settings           = $post['post_type_settings'];
        $has_single         = Post::hasSingle($slug);
        $has_archive        = !empty($settings['has_archive']);
        $is_front_queryable = $has_single || $has_archive;
        register_post_type($slug, [
            'labels' => [
                'menu_name'          => $settings['label'],
                'all_items'          => $settings['label'] . '一覧',
                'add_new'            => '新規追加',
                'search_items'       => $settings['label'] . 'を検索',
                'not_found'          => $settings['label'] . 'は見つかりませんでした。',
                'not_found_in_trash' => 'ゴミ箱に' . $settings['label'] . 'はありませんでした。',
            ],
            'public' => true,
            // アーカイブあり、または詳細ありの場合はフロントクエリを有効化
            // 詳細なし（has_single false）は custom_post_disable_single_page() で 404 にする
            'publicly_queryable'         => $is_front_queryable,
            'query_var'                  => $is_front_queryable,
            'show_in_rest'               => true,
            'show_ui'                    => true,
            'supports'                   => $settings['supports'],
            'has_archive'                => $settings['has_archive'],
            'hierarchical'               => false,
            'menu_position'              => $settings['menu_position'],
            'menu_icon'                  => 'dashicons-portfolio',
            'ys_show_works_publish_date' => 'both',
            // 詳細なしの CPT は /{slug}/{name}/page/{n}/ を作らない。
            // タクソノミーと同じプレフィックスだとカテゴリのページ送りと衝突するため。
            'rewrite' => [
                'slug'       => $slug,
                'with_front' => false,
                'pages'      => $has_single,
                'feeds'      => $has_single,
            ],
        ]);

        if ($has_archive) {
            $post_base = preg_quote((string) $slug, '#');
            add_rewrite_rule(
                $post_base . '/page/?([0-9]{1,})/?$',
                'index.php?post_type=' . $slug . '&paged=$matches[1]',
                'top'
            );
        }

        // タクソノミ―設定（単体/複数どちらの定義にも対応）
        $cats = $post['category_settings'] ?? [];
        if (!empty($cats) && isset($cats['slug'])) {
            $cats = [$cats];
        }

        foreach ($cats as $cat) {
            $taxonomy_slug = $cat['slug'] ?? '';

            if (empty($taxonomy_slug)) {
                continue;
            }

            $meta_box_cb = $cat['meta_box_cb'] ?? true;
            $has_archive = array_key_exists('has_archive', $cat)
                ? (bool) $cat['has_archive']
                : true;

            $taxonomy_args = [
                'labels' => [
                    'name'         => $cat['label'] ?? '',
                    'menu_name'    => $cat['label'] ?? '',
                    'add_new_item' => ($cat['label'] ?? '') . 'を追加',
                ],
                'public'             => true,
                'publicly_queryable' => $has_archive,
                'hierarchical'       => true,
                // meta_box_cb 非表示時はブロックエディター右サイドバーからも隠す（ACF taxonomy で選択）
                'show_in_rest' => array_key_exists('show_in_rest', $cat)
                    ? (bool) $cat['show_in_rest']
                    : (bool) $meta_box_cb,
                'show_admin_column' => true,
            ];

            if (!$meta_box_cb) {
                $taxonomy_args['meta_box_cb'] = false;
            }

            if ($has_archive) {
                // /{投稿タイプスラッグ}/{タームスラッグ}/ 形式（例: /news/notice/）
                $rewrite_slug             = $cat['rewrite']['slug'] ?? $slug;
                $taxonomy_args['rewrite'] = [
                    'slug'       => $rewrite_slug,
                    'with_front' => $cat['rewrite']['with_front'] ?? false,
                ];
            } else {
                // 分類用途のみ（フロントのタクソノミー一覧 URL は作らない）
                $taxonomy_args['rewrite'] = false;
            }

            register_taxonomy($taxonomy_slug, $slug, $taxonomy_args);

            if (!$has_archive) {
                continue;
            }

            $rewrite_base = preg_quote((string) $rewrite_slug, '#');
            add_rewrite_rule(
                $rewrite_base . '/([^/]+)/page/?([0-9]{1,})/?$',
                'index.php?' . $taxonomy_slug . '=$matches[1]&paged=$matches[2]',
                'top'
            );
        }
    }
}
add_action('init', 'custom_post_setup');

add_action('save_post', function ($post_id) {
    if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
        return;
    }

    $post_type = get_post_type($post_id);
    if (empty($post_type)) {
        return;
    }

    // 対象のカスタム投稿タイプに紐づく category_settings を参照して
    // ターム未設定のタクソノミーに default のタームを自動付与する
    $category_settings = Post::getCategorySettings($post_type) ?? [];
    foreach ($category_settings as $category_setting) {
        $taxonomy_slug     = $category_setting['slug'] ?? '';
        $default_term_slug = $category_setting['default'] ?? '';

        if ($taxonomy_slug === '' || $default_term_slug === '') {
            continue;
        }

        // 未設定なら default を付与（すでにタームがある場合は何もしない）
        if (!has_term('', $taxonomy_slug, $post_id)) {
            if (!taxonomy_exists($taxonomy_slug)) {
                continue;
            }

            $default_term = get_term_by('slug', $default_term_slug, $taxonomy_slug);
            if ($default_term) {
                wp_set_object_terms($post_id, $default_term->term_id, $taxonomy_slug);
            }
        }
    }
});

/**
 * /{投稿タイプ}/{slug}/ が個別投稿ルールより先にタクソノミーとして解決されるよう調整する。
 * 同一プレフィックスの rewrite では CPT 個別投稿ルールが優先されるため、
 * 該当 slug の投稿が無い場合のみターム一覧へ振り分ける。
 *
 * /{投稿タイプ}/{term}/page/{n}/ も CPT 側に取られることがあるため、
 * ページ番号をアーカイブ用の paged へ載せ替える。
 */
function custom_post_resolve_taxonomy_request(array $query_vars): array
{
    foreach (Post::getAll() as $post_type_slug => $post) {
        if (empty($query_vars[$post_type_slug]) || !is_string($query_vars[$post_type_slug])) {
            continue;
        }

        $slug  = $query_vars[$post_type_slug];
        $paged = 0;

        // CPT 名として「term/page/N」が丸ごと入るケース
        if (preg_match('#^([^/]+)/page/([0-9]+)$#', $slug, $matches)) {
            $slug  = $matches[1];
            $paged = (int) $matches[2];
        }

        $existing_post = get_page_by_path($slug, OBJECT, $post_type_slug);
        if ($existing_post instanceof WP_Post) {
            continue;
        }

        $category_settings = Post::getCategorySettings($post_type_slug) ?? [];
        foreach ($category_settings as $category_setting) {
            $taxonomy_slug = $category_setting['slug'] ?? '';
            if ($taxonomy_slug === '') {
                continue;
            }

            if (!Post::taxonomyHasArchive($post_type_slug, $taxonomy_slug)) {
                continue;
            }

            $term = get_term_by('slug', $slug, $taxonomy_slug);
            if (!($term instanceof WP_Term)) {
                continue;
            }

            // CPT の multipage 用 page が付いている場合はアーカイブの paged に変換
            if ($paged < 1 && isset($query_vars['page']) && $query_vars['page'] !== '') {
                $paged = (int) $query_vars['page'];
            }
            if ($paged < 1 && isset($query_vars['paged']) && $query_vars['paged'] !== '') {
                $paged = (int) $query_vars['paged'];
            }

            $query_vars[$taxonomy_slug] = $slug;
            $query_vars['post_type']    = $post_type_slug;
            if ($paged > 1) {
                $query_vars['paged'] = $paged;
            } else {
                unset($query_vars['paged']);
            }

            unset(
                $query_vars[$post_type_slug],
                $query_vars['name'],
                $query_vars['pagename'],
                $query_vars['page']
            );

            return $query_vars;
        }
    }

    return $query_vars;
}
add_filter('request', 'custom_post_resolve_taxonomy_request');

/**
 * has_single が false のカスタム投稿タイプの詳細URLへのアクセスを 404 にする。
 */
function custom_post_disable_single_page(): void
{
    if (!is_singular()) {
        return;
    }

    $post_type = get_post_type();
    if ($post_type === false || !Post::exists($post_type) || Post::hasSingle($post_type)) {
        return;
    }

    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    nocache_headers();
}
add_action('template_redirect', 'custom_post_disable_single_page');
