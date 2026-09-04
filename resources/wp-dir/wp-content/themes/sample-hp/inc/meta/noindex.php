<?php
/************************************************
 * noindexの設定出力
 *************************************************/
$noindex = Page::getNoindex(get_current_slug());
if (empty($description)) {
    $noindex = Post::getNoindex(get_current_slug());
}
?>
<?php if ($noindex === true): ?>
    <meta name="robots" content="noindex nofollow" />
<?php elseif (isset($_GET['category']) && !empty($_GET['category'])): ?>
    <meta name="robots" content="noindex, follow" />
<?php endif; ?>
