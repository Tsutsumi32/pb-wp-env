<?php
/************************************************
 * タイトル出力
 *
 * 整形ルールは Page::getFormattedDocumentTitle() に集約し、ogp.php の og:title と一致させます。
 * prefix / suffix は pages.php の $documentTitleAffix で管理します。
 *************************************************/
$title = Page::getFormattedDocumentTitle();
?>
<title><?php echo $title; ?></title>
