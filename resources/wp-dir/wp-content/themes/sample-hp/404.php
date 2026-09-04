<?php
if (!defined('ABSPATH')) {
    exit();
}
get_header();
?>

<main class="ly_main">
    <div class="ly_container __m">
        <div class="un_wrap">
            <span class="un_status">404</span>
            <h1 class="un_statusLabel">Not Found</h1>
            <div class="un_message">
                <p class="un_text">お探しのページは見つかりませんでした。</p>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="un_link">トップページへ</a>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>
