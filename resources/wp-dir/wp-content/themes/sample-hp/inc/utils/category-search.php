<?php

/**
 * カテゴリ検索（select）を出力
 *
 * @param array{
 *   post_type: string,
 *   taxonomy: string,
 *   anchor_id?: string,
 *   label?: string,
 * } $args
 */
function render_category_search(array $args): void
{
    $post_type = (string) ($args['post_type'] ?? '');
    $taxonomy  = (string) ($args['taxonomy'] ?? '');
    $anchor_id = (string) ($args['anchor_id'] ?? 'search');
    $label     = (string) ($args['label'] ?? 'カテゴリー');

    if ($post_type === '' || $taxonomy === '') {
        return;
    }

    $archive_url = get_post_type_archive_link($post_type);
    if (!$archive_url) {
        return;
    }

    $category_terms        = Post::getTermSettings($post_type)[$taxonomy] ?? [];
    $current_category_slug = 'all';

    if (is_tax($taxonomy)) {
        $queried_term = get_queried_object();
        if ($queried_term instanceof WP_Term) {
            $current_category_slug = $queried_term->slug;
        }
    }

    usort($category_terms, static function (array $a, array $b): int {
        return ((int) ($a['order'] ?? 0)) <=> ((int) ($b['order'] ?? 0));
    });

    $resolve_category_url = static function (string $slug) use (
        $archive_url,
        $anchor_id,
        $taxonomy
    ): string {
        if ($slug === 'all') {
            return append_url_fragment((string) $archive_url, $anchor_id);
        }

        $term = get_term_by('slug', $slug, $taxonomy);
        if (!$term || is_wp_error($term)) {
            return append_url_fragment((string) $archive_url, $anchor_id);
        }

        $link = get_term_link($term);
        $url  = is_wp_error($link) ? (string) $archive_url : (string) $link;

        return append_url_fragment($url, $anchor_id);
    };

    $select_id = 'category-search';
    ?>
    <div class="un_categorySearch" id="<?php echo esc_attr(
        $anchor_id,
    ); ?>" data-module="categorySearch">
        <label class="un_categorySearch_label" for="<?php echo esc_attr($select_id); ?>">
            <?php echo esc_html($label); ?>
        </label>
        <div class="un_categorySearch_field">
            <select
                id="<?php echo esc_attr($select_id); ?>"
                class="un_categorySearch_select is_active"
                name="category"
                data-feature="selectActiveState"
            >
                <?php foreach ($category_terms as $term_setting): ?>
                    <?php
                    $term_slug  = (string) ($term_setting['slug'] ?? '');
                    $term_label = (string) ($term_setting['label'] ?? '');
                    if ($term_slug === '' || $term_label === '') {
                        continue;
                    }
                    ?>
                    <option
                        value="<?php echo esc_url($resolve_category_url($term_slug)); ?>"
                        <?php selected($current_category_slug, $term_slug); ?>
                    >
                        <?php echo esc_html($term_label); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <span class="un_categorySearch_icon" aria-hidden="true"></span>
        </div>
        <!-- /.un_categorySearch_field -->
    </div>
    <!-- /.un_categorySearch -->
    <?php
}
