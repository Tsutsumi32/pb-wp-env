<?php
/**
 * ファビコン出力
 *
 * OS / ブラウザの prefers-color-scheme に応じて出し分けます。
 * media 属性なしの .ico は全モードに適用されるため出力しません。
 */
$favicon_base = get_template_directory_uri() . '/assets/settings/';
?>
<link rel="icon" type="image/x-icon" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon-dark.ico',
    ENT_QUOTES,
    'UTF-8',
); ?>" media="(prefers-color-scheme: dark)" />
<link rel="icon" type="image/x-icon" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon.ico',
    ENT_QUOTES,
    'UTF-8',
); ?>" media="(prefers-color-scheme: light)" />
<link rel="icon" type="image/png" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon-dark-96x96.png',
    ENT_QUOTES,
    'UTF-8',
); ?>" sizes="96x96" media="(prefers-color-scheme: dark)" />
<link rel="icon" type="image/png" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon-96x96.png',
    ENT_QUOTES,
    'UTF-8',
); ?>" sizes="96x96" media="(prefers-color-scheme: light)" />
<link rel="icon" type="image/svg+xml" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon-dark.svg',
    ENT_QUOTES,
    'UTF-8',
); ?>" media="(prefers-color-scheme: dark)" />
<link rel="icon" type="image/svg+xml" href="<?php echo htmlspecialchars(
    $favicon_base . 'favicon.svg',
    ENT_QUOTES,
    'UTF-8',
); ?>" media="(prefers-color-scheme: light)" />
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo htmlspecialchars(
    $favicon_base . 'apple-touch-icon.png',
    ENT_QUOTES,
    'UTF-8',
); ?>" />
<link rel="manifest" href="<?php echo htmlspecialchars(
    $favicon_base . 'site.webmanifest',
    ENT_QUOTES,
    'UTF-8',
); ?>" />
