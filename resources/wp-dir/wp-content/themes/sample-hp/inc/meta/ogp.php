<?php
/************************************************
 * OGPの出力
 *
 * og:title は Page::getFormattedDocumentTitle() により title.php と同一の文字列になる。
 *************************************************/
// タイトル
$title = Page::getFormattedDocumentTitle();

// ディスクリプション
$description = Page::getDescription(get_current_slug());
if (empty($description)) {
    $description = Post::getDescription(get_current_slug());
}
if (is_single()) {
    $description = get_the_excerpt();
}
?>
<meta property="og:title" content="<?php echo $title; ?>">
<meta property="og:description" content="<?php echo $description; ?>">
<meta property="og:image" content="<?php echo get_template_directory_uri(); ?>/assets/settings/ogp.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<?php if (is_single()): ?>
    <meta property="og:type" content="article">
<?php else: ?>
    <meta property="og:type" content="website">
<?php endif; ?>
<meta property="og:url" content="<?php echo get_pagenum_link(); ?>">
<meta property="og:site_name" content="<?php echo SITE_NAME; ?>">
