<?php
if (!defined('ABSPATH')) {
    exit;
}
get_header();

$post_type         = Post::NEWS;
$post_config       = Post::get($post_type) ?? [];
$archive_title     = $post_config['title'] ?? post_type_archive_title('', false);
$archive_desc      = $post_config['description'] ?? '';
$category_settings = Post::getCategorySettings($post_type) ?? [];

$acf_fields  = AcfField::getField($post_type) ?? [];
$field_slugs = array_column($acf_fields, 'slug');
$image_key   = in_array('news_image', $field_slugs, true) ? 'news_image' : '';
$detail_key  = in_array('news_content', $field_slugs, true) ? 'news_content' : '';
?>
<main class="ly_main">
    <style>
        .sample-archive {
            max-width: 980px;
            margin: 0 auto;
            padding: 40px 20px 72px;
        }
        .sample-archive__head {
            margin-bottom: 32px;
        }
        .sample-archive__title {
            margin: 0 0 8px;
            font-size: 32px;
            line-height: 1.3;
        }
        .sample-archive__desc {
            margin: 0;
            color: #4b5563;
        }
        .sample-archive__list {
            display: grid;
            gap: 20px;
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .sample-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
        }
        .sample-card__inner {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 16px;
            text-decoration: none;
            color: inherit;
            padding: 16px;
        }
        .sample-card__thumb {
            width: 100%;
            aspect-ratio: 4 / 3;
            border-radius: 8px;
            overflow: hidden;
            background: #f3f4f6;
        }
        .sample-card__thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .sample-card__body h2 {
            margin: 0 0 8px;
            font-size: 20px;
            line-height: 1.4;
        }
        .sample-card__meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 0 0 8px;
            padding: 0;
            list-style: none;
        }
        .sample-card__meta li {
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 999px;
            padding: 2px 10px;
            color: #374151;
        }
        .sample-card__text {
            margin: 0;
            color: #4b5563;
            line-height: 1.8;
        }
        .sample-archive__pager {
            margin-top: 28px;
        }
        @media (max-width: 767px) {
            .sample-card__inner {
                grid-template-columns: 1fr;
            }
        }
    </style>

    <section class="sample-archive">
        <header class="sample-archive__head">
            <h1 class="sample-archive__title"><?php echo esc_html($archive_title); ?></h1>
            <?php if ($archive_desc !== '') : ?>
                <p class="sample-archive__desc"><?php echo esc_html($archive_desc); ?></p>
            <?php endif; ?>
        </header>

        <?php if (have_posts()) : ?>
            <ul class="sample-archive__list">
                <?php while (have_posts()) : the_post(); ?>
                    <?php
                    $image_field = $image_key !== '' ? get_field($image_key, get_the_ID()) : null;
                    $image_id    = 0;
                    $image_url   = '';

                    // ACF image の return_format は "id" / "array" / "object" 等でブレるため吸収する
                    if (is_array($image_field) && isset($image_field[0]) && !isset($image_field['ID']) && !isset($image_field['id']) && !isset($image_field['url'])) {
                        $image_field = $image_field[0];
                    }

                    if (is_numeric($image_field)) {
                        $image_id = (int) $image_field;
                    } elseif (is_array($image_field)) {
                        $image_id  = (int) ($image_field['ID'] ?? $image_field['id'] ?? 0);
                        $image_url = (string) ($image_field['url'] ?? '');

                        // サイズ別URLだけ返ってくるケースもある
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

                    $detail     = $detail_key !== '' ? (string) get_field($detail_key, get_the_ID()) : '';
                    $terms_text = [];
                    foreach ($category_settings as $taxonomy_cfg) {
                        $taxonomy_slug = $taxonomy_cfg['slug'] ?? '';
                        if ($taxonomy_slug === '') {
                            continue;
                        }
                        $terms = get_the_terms(get_the_ID(), $taxonomy_slug);
                        if (empty($terms) || is_wp_error($terms)) {
                            continue;
                        }
                        foreach ($terms as $term) {
                            $terms_text[] = $term->name;
                        }
                    }
                    ?>
                    <li class="sample-card">
                        <a class="sample-card__inner" href="<?php echo get_archive_item_url(Post::NEWS, get_the_ID()); ?>">
                            <div class="sample-card__thumb">
                                <?php
                                if ($image_id > 0) {
                                    echo wp_get_attachment_image($image_id, 'medium_large');
                                } elseif ($image_url !== '') {
                                    echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr(get_the_title()) . '" />';
                                }
                    ?>
                            </div>
                            <div class="sample-card__body">
                                <h2><?php the_title(); ?></h2>
                                <?php if (!empty($terms_text)) : ?>
                                    <ul class="sample-card__meta">
                                        <?php foreach (array_unique($terms_text) as $label) : ?>
                                            <li><?php echo esc_html($label); ?></li>
                                        <?php endforeach; ?>
                                    </ul>
                                <?php endif; ?>
                                <?php if ($detail !== '') : ?>
                                    <p class="sample-card__text"><?php echo esc_html(wp_trim_words($detail, 40, '...')); ?></p>
                                <?php endif; ?>
                            </div>
                        </a>
                    </li>
                <?php endwhile; ?>
            </ul>

            <div class="sample-archive__pager">
                <?php
                    global $wp_query;
                    the_pagination($wp_query);
                ?>
            </div>
        <?php else : ?>
            <p>投稿はまだありません。</p>
        <?php endif; ?>
    </section>
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
