<?php

/**
 * テキスト内のURLを自動的にリンク化する
 *
 * @param string $text リンク化するテキスト
 * @return string
 */
function auto_link_text(string $text): string
{
    // URLパターンを検出（http/httpsで始まるURL）
    $pattern = '/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i';

    // デフォルト属性を設定
    $attributes = [
        'target' => '_blank',
        'rel'    => 'noopener',
    ];

    // 属性をHTML文字列に変換
    $attr_string = '';
    foreach ($attributes as $key => $value) {
        $attr_string .=
            ' ' .
            htmlspecialchars((string) $key, ENT_QUOTES, 'UTF-8') .
            '="' .
            htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8') .
            '"';
    }

    // URLをリンクに変換
    $replacement = '<a href="$1"' .
        $attr_string .
        '></a>';
    $linked_text = preg_replace($pattern, $replacement, $text);

    return $linked_text;
}
