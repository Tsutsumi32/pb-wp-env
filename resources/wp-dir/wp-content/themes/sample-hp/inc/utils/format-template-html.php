<?php

/**
 * 開発者管理のテンプレート用 HTML 文字列を出力用に整形する。
 *
 * 静的配列・テンプレート内リテラル専用。ユーザー入力・CMS 由来の値には使わない。
 *
 * @param string $html 意図的なマークアップ（br 等）を含む文字列
 */
function format_template_html(string $html): string
{
    return strip_tags($html, '<br><span><strong><em><small>');
}
