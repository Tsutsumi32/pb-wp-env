<?php
if (!defined('ABSPATH')) {
    exit;
}
get_header();

$post_type         = Post::NEWS;
$category_settings = Post::getCategorySettings($post_type) ?? [];
$acf_fields        = AcfField::getField($post_type) ?? [];
$field_slugs       = array_column($acf_fields, 'slug');
$image_key         = in_array('news_image', $field_slugs, true) ? 'news_image' : '';
$detail_key        = in_array('news_detail', $field_slugs, true) ? 'news_detail' : '';
?>
<main class="ly_main">
    <style>
        .sample-single {
            max-width: 860px;
            margin: 0 auto;
            padding: 40px 20px 72px;
        }
        .sample-single__title {
            margin: 0 0 10px;
            font-size: 34px;
            line-height: 1.35;
        }
        .sample-single__meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 0 0 24px;
            padding: 0;
            list-style: none;
            color: #374151;
            font-size: 13px;
        }
        .sample-single__meta li {
            border: 1px solid #d1d5db;
            border-radius: 999px;
            padding: 3px 10px;
        }
        .sample-single__image {
            margin: 0 0 24px;
            border-radius: 12px;
            overflow: hidden;
            background: #f3f4f6;
        }
        .sample-single__image img {
            width: 100%;
            height: auto;
            display: block;
        }
        .sample-single__body {
            line-height: 1.9;
            color: #1f2937;
        }
        .sample-single__body p {
            margin: 0;
            white-space: pre-line;
        }
    </style>

    <section class="sample-single">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
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

                if ($image_id <= 0 && $image_url === '' && isset($image_field['sizes']) && is_array($image_field['sizes'])) {
                    $size = $image_field['sizes']['large'] ?? null;
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
            <article>
                <h1 class="sample-single__title"><?php the_title(); ?></h1>
                <ul class="sample-single__meta">
                    <li>更新日: <?php echo esc_html(get_the_modified_date('Y.m.d')); ?></li>
                    <?php foreach (array_unique($terms_text) as $label) : ?>
                        <li><?php echo esc_html($label); ?></li>
                    <?php endforeach; ?>
                </ul>

                <?php if ($image_id > 0 || $image_url !== '') : ?>
                    <figure class="sample-single__image">
                        <?php
                        if ($image_id > 0) {
                            echo wp_get_attachment_image($image_id, 'large');
                        } elseif ($image_url !== '') {
                            echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr(get_the_title()) . '" />';
                        }
            ?>
                    </figure>
                <?php endif; ?>

                <?php if ($detail !== '') : ?>
                    <div class="sample-single__body">
                        <p><?php echo esc_html($detail); ?></p>
                    </div>
                <?php endif; ?>
            </article>
        <?php endwhile; endif; ?>
        <a href="<?php echo get_archive_back_url(Post::NEWS); ?>" class="el_button __noIcon">
            一覧へ戻る
        </a>
    </section>
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
