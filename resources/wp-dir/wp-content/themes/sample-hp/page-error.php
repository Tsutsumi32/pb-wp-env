<?php
if (!defined('ABSPATH')) {
    exit();
}

$error_message_category = Message::CATEGORY_ERROR_PAGE;
$error_message_key      = Message::getMessageKeyFromRequest($error_message_category);
if (!Message::messageExists($error_message_category, $error_message_key)) {
    wp_safe_redirect(home_url('/'));
    exit;
}

$error_message = Message::getMessage($error_message_category, $error_message_key);
if ($error_message === null) {
    wp_safe_redirect(home_url('/'));
    exit;
}

get_header();
?>

<main class="ly_main">
    <div class="ly_container __m">
        <div class="un_wrap">
            <h1 class="un_title"><?php echo esc_html($error_message['headline']); ?></h1>
            <div class="un_message">
                <p class="un_text"><?php echo wp_kses_post($error_message['body_html']); ?></p>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="un_link">トップページへ</a>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>
