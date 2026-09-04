<?php
if (!defined('ABSPATH')) {
    exit();
}
get_header();

// お問い合わせフォームを表示（title クエリは環境依存のため shortcode 側で解決）
$form_shortcode = '[contact-form-7 title="お問い合わせ"]';
?>
<main class="ly_main">
    <div class="un_wrapper">
        <div class="un_contact" data-form-validator-page="input">
            <?php
                echo do_shortcode($form_shortcode);
            ?>
        </div>
        <?php get_template_part('modules/contact', 'confirm'); ?>
    </div>
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
