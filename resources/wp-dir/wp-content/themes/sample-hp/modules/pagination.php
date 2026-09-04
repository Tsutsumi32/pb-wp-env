<?php

/**
 * block pagination（アーカイブページネーション）
 *
 * @param array $args {
 *     @type int    $current         現在ページ
 *     @type int[]  $pages           表示するページ番号
 *     @type array  $page_urls       ページ番号 => URL
 *     @type string $first_url       最初のページ URL
 *     @type string $prev_url        前のページ URL
 *     @type string $next_url        次のページ URL
 *     @type string $last_url        最後のページ URL
 *     @type bool   $first_disabled  最初へが非活性か
 *     @type bool   $prev_disabled   前へが非活性か
 *     @type bool   $next_disabled   次へが非活性か
 *     @type bool   $last_disabled   最後へが非活性か
 * }
 */
if (!defined('ABSPATH')) {
    exit;
}

$current        = (int) ($args['current'] ?? 1);
$pages          = $args['pages'] ?? [];
$page_urls      = $args['page_urls'] ?? [];
$first_url      = (string) ($args['first_url'] ?? '');
$prev_url       = (string) ($args['prev_url'] ?? '');
$next_url       = (string) ($args['next_url'] ?? '');
$last_url       = (string) ($args['last_url'] ?? '');
$first_disabled = !empty($args['first_disabled']);
$prev_disabled  = !empty($args['prev_disabled']);
$next_disabled  = !empty($args['next_disabled']);
$last_disabled  = !empty($args['last_disabled']);

if (!is_array($pages) || $pages === []) {
    return;
}

$chevron_src = esc_url(
    get_template_directory_uri() . '/assets/images/svg/common_pagination_chevron.svg'
);

$first_class = 'bl_pagination_button __step' . ($first_disabled ? ' is_disabled' : '');
$prev_class  = 'bl_pagination_button' . ($prev_disabled ? ' is_disabled' : '');
$next_class  = 'bl_pagination_button' . ($next_disabled ? ' is_disabled' : '');
$last_class  = 'bl_pagination_button __step' . ($last_disabled ? ' is_disabled' : '');
?>
<nav class="bl_pagination" aria-label="ページネーション">
    <div class="bl_pagination_nav">
        <?php if ($first_disabled) : ?>
            <span class="<?php echo htmlspecialchars($first_class, ENT_QUOTES, 'UTF-8'); ?>" aria-disabled="true" aria-label="最初のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </span>
        <?php else : ?>
            <a href="<?php echo esc_url($first_url); ?>" class="<?php echo htmlspecialchars($first_class, ENT_QUOTES, 'UTF-8'); ?>" aria-label="最初のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </a>
        <?php endif; ?>
        <?php if ($prev_disabled) : ?>
            <span class="<?php echo htmlspecialchars($prev_class, ENT_QUOTES, 'UTF-8'); ?>" aria-disabled="true" aria-label="前のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </span>
        <?php else : ?>
            <a href="<?php echo esc_url($prev_url); ?>" class="<?php echo htmlspecialchars($prev_class, ENT_QUOTES, 'UTF-8'); ?>" aria-label="前のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </a>
        <?php endif; ?>
    </div>
    <!-- /.bl_pagination_nav -->
    <div class="bl_pagination_numbers">
        <?php foreach ($pages as $page_num) : ?>
            <?php
            $page_num     = (int) $page_num;
            $is_current   = $page_num === $current;
            $number_class = 'bl_pagination_number';
            if ($is_current) {
                $number_class .= ' __active';
            }
            $page_url = (string) ($page_urls[$page_num] ?? '');
            ?>
            <?php if ($is_current) : ?>
                <span
                    class="<?php echo htmlspecialchars($number_class, ENT_QUOTES, 'UTF-8'); ?>"
                    aria-current="page">
                    <?php echo esc_html((string) $page_num); ?>
                </span>
            <?php else : ?>
                <a
                    href="<?php echo esc_url($page_url); ?>"
                    class="<?php echo htmlspecialchars($number_class, ENT_QUOTES, 'UTF-8'); ?>">
                    <?php echo esc_html((string) $page_num); ?>
                </a>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
    <!-- /.bl_pagination_numbers -->
    <div class="bl_pagination_nav __next">
        <?php if ($last_disabled) : ?>
            <span class="<?php echo htmlspecialchars($last_class, ENT_QUOTES, 'UTF-8'); ?>" aria-disabled="true" aria-label="最後のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </span>
        <?php else : ?>
            <a href="<?php echo esc_url($last_url); ?>" class="<?php echo htmlspecialchars($last_class, ENT_QUOTES, 'UTF-8'); ?>" aria-label="最後のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </a>
        <?php endif; ?>
        <?php if ($next_disabled) : ?>
            <span class="<?php echo htmlspecialchars($next_class, ENT_QUOTES, 'UTF-8'); ?>" aria-disabled="true" aria-label="次のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </span>
        <?php else : ?>
            <a href="<?php echo esc_url($next_url); ?>" class="<?php echo htmlspecialchars($next_class, ENT_QUOTES, 'UTF-8'); ?>" aria-label="次のページ">
                <img
                    src="<?php echo $chevron_src; ?>"
                    alt=""
                    width="15"
                    height="19"
                    loading="lazy">
            </a>
        <?php endif; ?>
    </div>
    <!-- /.bl_pagination_nav -->
</nav>
<!-- /.bl_pagination -->