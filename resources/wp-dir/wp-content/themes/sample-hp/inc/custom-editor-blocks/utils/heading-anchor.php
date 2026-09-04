<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * 見出し2（core/heading level 2）のアンカー ID 管理
 *
 * 投稿コンテンツを parse_blocks し、出現順に一意 ID を割り当てる。
 * 目次ブロックと render_block フィルターで同じ ID を共有する。
 *************************************************/
class SampleHp_Heading_Anchor
{
    /** @var array<int, array{text: string, anchor: string, id: string}> */
    private static array $headings = [];

    private static int $prepared_post_id = 0;

    private static int $render_index = 0;

    /**
     * 投稿コンテンツから見出し2一覧とアンカー ID を事前計算する
     */
    public static function prepare(int $post_id, string $content): void
    {
        if (self::$prepared_post_id === $post_id && self::$headings !== []) {
            return;
        }

        self::$headings         = [];
        self::$prepared_post_id = $post_id;
        self::$render_index     = 0;

        $raw_headings = self::collect_h2_from_blocks(parse_blocks($content));
        $used_slugs   = [];

        foreach ($raw_headings as $heading) {
            $id = self::make_anchor_id($heading['text'], $heading['anchor'], $used_slugs);
            if ($id === '') {
                continue;
            }

            self::$headings[] = [
                'text'   => $heading['text'],
                'anchor' => $heading['anchor'],
                'id'     => $id,
            ];
        }
    }

    /**
     * render_block 用: 次の見出し2に割り当て済みの ID を返す
     */
    public static function next_render_id(): string
    {
        $heading = self::$headings[self::$render_index] ?? null;
        if ($heading === null) {
            return '';
        }

        self::$render_index++;

        return $heading['id'];
    }

    /**
     * 目次ブロック用: 割り当て済み見出し2一覧を返す
     *
     * @return array<int, array{text: string, id: string}>
     */
    public static function get_headings(): array
    {
        $items = [];
        foreach (self::$headings as $heading) {
            $items[] = [
                'text' => $heading['text'],
                'id'   => $heading['id'],
            ];
        }

        return $items;
    }

    /**
     * render_block の走査位置を先頭に戻す
     */
    public static function reset_render_index(): void
    {
        self::$render_index = 0;
    }

    /**
     * @param array<int, array<string, mixed>> $blocks
     * @return array<int, array{text: string, anchor: string}>
     */
    public static function collect_h2_from_blocks(array $blocks): array
    {
        $headings = [];

        foreach ($blocks as $block) {
            if (!is_array($block)) {
                continue;
            }

            $block_name = $block['blockName'] ?? null;
            if ($block_name === 'core/heading') {
                $level = isset($block['attrs']['level']) ? (int) $block['attrs']['level'] : 2;
                if ($level === 2) {
                    $text = self::extract_heading_text($block);
                    if ($text !== '') {
                        $headings[] = [
                            'text'   => $text,
                            'anchor' => isset($block['attrs']['anchor'])
                                ? (string) $block['attrs']['anchor']
                                : '',
                        ];
                    }
                }
            }

            $inner_blocks = $block['innerBlocks'] ?? [];
            if (is_array($inner_blocks) && $inner_blocks !== []) {
                $headings = array_merge($headings, self::collect_h2_from_blocks($inner_blocks));
            }
        }

        return $headings;
    }

    /**
     * @param array<string, mixed> $block
     */
    private static function extract_heading_text(array $block): string
    {
        $inner_html = isset($block['innerHTML']) ? (string) $block['innerHTML'] : '';
        if ($inner_html !== '') {
            return trim(wp_strip_all_tags($inner_html));
        }

        $inner_content = $block['innerContent'] ?? [];
        if (!is_array($inner_content)) {
            return '';
        }

        $text = '';
        foreach ($inner_content as $chunk) {
            if (!is_string($chunk)) {
                continue;
            }
            $text .= $chunk;
        }

        return trim(wp_strip_all_tags($text));
    }

    /**
     * @param array<string, int> $used_slugs
     */
    private static function make_anchor_id(
        string $text,
        string $manual_anchor,
        array &$used_slugs
    ): string {
        $base = $manual_anchor !== '' ? sanitize_title($manual_anchor) : sanitize_title($text);
        if ($base === '') {
            $base = 'section';
        }

        if (!isset($used_slugs[$base])) {
            $used_slugs[$base] = 1;

            return $base;
        }

        $used_slugs[$base]++;

        return $base . '-' . $used_slugs[$base];
    }

    /**
     * 見出しタグの開始部分に id 属性を付与する
     */
    public static function inject_id_into_heading_tag(string $html, string $id): string
    {
        if ($id === '') {
            return $html;
        }

        $id_attr = ' id="' . esc_attr($id) . '"';

        if (preg_match('/\sid=(["\']).*?\1/i', $html)) {
            return (string) preg_replace('/\sid=(["\']).*?\1/i', $id_attr, $html, 1);
        }

        return (string) preg_replace('/<h2\b/i', '<h2' . $id_attr, $html, 1);
    }
}
