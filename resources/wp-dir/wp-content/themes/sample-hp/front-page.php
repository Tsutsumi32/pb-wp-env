<?php
if (!defined('ABSPATH')) {
    exit;
}
get_header();
?>
<main class="ly_main">
    <style>
        .top-sample {
            max-width: 980px;
            margin: 0 auto;
            padding: 40px 20px 72px;
        }

        .top-sample__head {
            margin-bottom: 22px;
        }

        .top-sample__logo {
            display: block;
            margin: 0 0 18px;
            max-width: min(100%, 420px);
            margin-inline: auto;
            margin-bottom: 100px;
            background-color: #fff;
            padding: 30px;
        }

        .top-sample__logo picture,
        .top-sample__logo img {
            display: block;
            width: 100%;
            height: auto;
        }

        .top-sample__title {
            margin: 0;
            font-size: 28px;
            line-height: 1.3;
        }

        .top-sample__list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
        }

        .top-sample-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
        }

        .top-sample-card__link {
            display: grid;
            grid-template-rows: auto 1fr;
            text-decoration: none;
            color: inherit;
            height: 100%;
        }

        .top-sample-card__thumb {
            width: 100%;
            aspect-ratio: 4 / 3;
            background: #f3f4f6;
            overflow: hidden;
        }

        .top-sample-card__thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .top-sample-card__body {
            padding: 14px 14px 16px;
        }

        .top-sample-card__body h2 {
            margin: 0 0 8px;
            font-size: 18px;
            line-height: 1.4;
        }

        .top-sample-card__text {
            margin: 0 0 10px;
            color: #4b5563;
            line-height: 1.8;
            font-size: 13px;
        }

        .top-sample-card__meta {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .top-sample-card__meta li {
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 999px;
            padding: 2px 10px;
            color: #374151;
        }

        .top-sample__more {
            margin-top: 22px;
            text-align: center;
        }

        .top-sample__more-link {
            display: inline-block;
            padding: 12px 22px;
            border-radius: 999px;
            border: 1px solid #d1d5db;
            background: #fff;
            color: #f3f4f6;
            text-decoration: none;
            font-size: 14px;
            line-height: 1;
        }

        .top-sample__more-link:hover {
            border-color: #9ca3af;
            background: #f9fafb;
        }

        @media (max-width: 900px) {
            .top-sample__list {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 560px) {
            .top-sample__list {
                grid-template-columns: 1fr;
            }
        }
    </style>

    <?php
    $post_type         = Post::NEWS;
    $post_config       = Post::get($post_type) ?? [];
    $top_title         = $post_config['title'] ?? 'サンプル';
    $category_settings = Post::getCategorySettings($post_type) ?? [];

    $acf_fields  = AcfField::getField($post_type) ?? [];
    $field_slugs = array_column($acf_fields, 'slug');
    $image_key   = in_array('news_image', $field_slugs, true) ? 'news_image' : '';
    $detail_key  = in_array('news_detail', $field_slugs, true) ? 'news_detail' : '';

    // サブクエリ：トップページ用に5件だけ取得
    $archive_cfg = Post::getArchiveQuery($post_type);
    $query_args  = [
        'post_type'      => $post_type,
        'posts_per_page' => 5,
        'orderby'        => $archive_cfg['orderby'] ?? 'modified',
        'order'          => strtoupper((string) ($archive_cfg['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC',
    ];
    $sub_query   = new WP_Query($query_args);
    $archive_url = get_post_type_archive_link($post_type) ?: '';
    ?>

    <section class="top-sample">
        <header class="top-sample__head">
            <div class="top-sample__logo">
                <?php
                render_img([
                    'fileName' => 'logo_ithingstudio_black.png',
                    'alt'      => SITE_NAME,
                    'width'    => '1892',
                    'height'   => '497',
                    'loading'  => 'eager',
                ]);
                ?>
            </div>
            <h1 class="top-sample__title"><?php echo esc_html($top_title); ?></h1>
        </header>
        <div class="top-sample__more">
            <a class="top-sample__more-link" href="<?php echo esc_url(home_url('/sample1/')); ?>">smple1ページへ👍</a>
        </div>

        <?php if ($sub_query->have_posts()) : ?>
            <ul class="top-sample__list">
                <?php while ($sub_query->have_posts()) : $sub_query->the_post(); ?>
                    <?php
                    $post_id = get_the_ID();

                    // ACF image は return_format により int / array / object 等が返る
                    $image_field = ($image_key !== '' && function_exists('get_field')) ? get_field($image_key, $post_id) : null;
                    $image_id    = 0;
                    $image_url   = '';

                    if (is_array($image_field) && isset($image_field[0]) && !isset($image_field['ID']) && !isset($image_field['id']) && !isset($image_field['url'])) {
                        $image_field = $image_field[0];
                    }
                    if (is_numeric($image_field)) {
                        $image_id = (int) $image_field;
                    } elseif (is_array($image_field)) {
                        $image_id  = (int) ($image_field['ID'] ?? $image_field['id'] ?? 0);
                        $image_url = (string) ($image_field['url'] ?? '');
                        if ($image_id <= 0 && $image_url === '' && isset($image_field['sizes']) && is_array($image_field['sizes'])) {
                            $size = $image_field['sizes']['medium_large'] ?? null;
                            if (is_array($size) && !empty($size['url'])) {
                                $image_url = (string) $size['url'];
                            }
                        }
                    } elseif (is_object($image_field)) {
                        $image_id  = (int) ($image_field->ID ?? $image_field->id ?? 0);
                        $image_url = (string) ($image_field->url ?? '');
                    }

                    $detail = ($detail_key !== '' && function_exists('get_field')) ? (string) get_field($detail_key, $post_id) : '';

                    $terms_text = [];
                    foreach ($category_settings as $taxonomy_cfg) {
                        $taxonomy_slug = $taxonomy_cfg['slug'] ?? '';
                        if ($taxonomy_slug === '') {
                            continue;
                        }
                        $terms = get_the_terms($post_id, $taxonomy_slug);
                        if (empty($terms) || is_wp_error($terms)) {
                            continue;
                        }
                        foreach ($terms as $term) {
                            $terms_text[] = $term->name;
                        }
                    }
                    $terms_text = array_unique($terms_text);
                    ?>

                    <li class="top-sample-card">
                        <a class="top-sample-card__link" href="<?php the_permalink(); ?>">
                            <div class="top-sample-card__thumb">
                                <?php
                                if ($image_id > 0) {
                                    echo wp_get_attachment_image($image_id, 'large');
                                } elseif ($image_url !== '') {
                                    echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr(get_the_title()) . '" />';
                                }
                                ?>
                            </div>
                            <div class="top-sample-card__body">
                                <h2><?php the_title(); ?></h2>
                                <?php if ($detail !== '') : ?>
                                    <p class="top-sample-card__text"><?php echo esc_html(wp_trim_words($detail, 25, '...')); ?></p>
                                <?php endif; ?>
                                <?php if (!empty($terms_text)) : ?>
                                    <ul class="top-sample-card__meta">
                                        <?php foreach ($terms_text as $label) : ?>
                                            <li><?php echo esc_html($label); ?></li>
                                        <?php endforeach; ?>
                                    </ul>
                                <?php endif; ?>
                            </div>
                        </a>
                    </li>
                <?php endwhile; ?>
            </ul>

            <?php if ($sub_query->found_posts > 5 && $archive_url !== '') : ?>
                <div class="top-sample__more">
                    <a class="top-sample__more-link" href="<?php echo esc_url($archive_url); ?>">もっと見る</a>
                </div>
            <?php endif; ?>
        <?php else : ?>
            <p>投稿はまだありません。</p>
        <?php endif; ?>
    </section>

    <?php wp_reset_postdata(); ?>
</main>
<?php get_footer(); ?>
