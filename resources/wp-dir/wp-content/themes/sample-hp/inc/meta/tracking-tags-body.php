<?php

/**
 * 計測タグ出力（body 開始直後）
 *
 * GTM noscript 等は inc/config/tracking-tags.php で定義する（body 開始直後用）。
 */
?>
<?php TrackingTags::render('body_start'); ?>
