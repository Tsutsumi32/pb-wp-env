<?php
/************************************************
 * ディスクリプション出力
 *************************************************/
$description = Page::getDescription(get_current_slug());
if (empty($description)) {
    $description = Post::getDescription(get_current_slug());
}
?>
<?php if (is_single()): ?>
    <meta name="description" content=<?php echo get_the_title(); ?>>
<?php else: ?>
    <meta name="description" content=<?php echo $description; ?>>
<?php endif; ?>
