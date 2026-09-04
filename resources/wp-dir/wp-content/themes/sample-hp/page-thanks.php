<?php
if (!defined('ABSPATH')) {
    exit();
}

//  お問合せ画面からでない場合リダイレクト
$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
if (
    empty($referer) ||
    (
        strpos($referer, get_page_url(Page::CONTACT)) === false
        //&& strpos($referer, get_page_url(Page::DOWNLOAD)) === false
    )
) {
    // リダイレクト
    wp_redirect(esc_url(home_url('/')));
    exit;
}

get_header();
?>
<main class="ly_main __col">
    <div class="un_thanks">
        <p class="un_thanks_head">Thank you for <br class="hp_hidden_default_sp">your inquiry.</p>
        <p class="un_thanks_text">
            お問い合わせを受け付けました。<br>内容を確認の上、担当者より<br class="hp_hidden_default_sp">ご連絡いたしますので、<br class="hp_hidden_default_sp">今しばらくお待ちください。
        </p>
        <div class="un_thanks_btn">
            <a href="<?php echo esc_url(home_url('/')); ?>" class="el_btn">
                <p class="el_btn_text">トップへ戻る</p>
                <span class="el_btn_icon"></span>
            </a>
        </div>
    </div>
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
