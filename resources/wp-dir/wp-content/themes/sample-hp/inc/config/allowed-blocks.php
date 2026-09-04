<?php

/************************************************
 * ブロックエディタ共通設定
 *
 * 固定ページ・カスタム投稿すべてに共通で適用する allowed_blocks
 * pages.php / posts.php に個別設定がある場合はそちらを優先
 *************************************************/
class AllowedBlocks
{
    /**
     * 共通の許可ブロック一覧
     *
     * null … 共通制限なし（個別設定のみ有効）
     * array … 全編集画面のデフォルト制限
     */
    protected static ?array $blocks = [
        'core/paragraph', // 段落
        'core/heading', // 見出し
        'core/list', // リスト
        'core/list-item', // リスト（子ブロック）
        'core/quote', // 引用
        'core/table', // テーブル
        'core/image', // 画像
        'core/buttons', // ボタン
        'core/button', // ボタン（子ブロック）
        'core/spacer', // スペーサー
        'core/html', // カスタムHTML
        'core/group', // グループ（$group_variations と併用）
        'core/embed', // 埋め込み（$embed_variations と併用）
        'custom-block/table-of-contents', // 目次
        // 'custom-block/post-card', // 記事カード
        // 'custom-block/link-card', // リンクカード
        'custom-block/description-list', // 説明リスト
    ];

    /**
     * グループブロック（core/group）で許可するバリエーション名
     *
     * null … 制限なし（横並び・縦積み・グリッドも表示）
     * array … 指定したバリエーションのみ（インサーター表示）
     *
     * 主な variation name 例:
     * group, group-row, group-stack, group-grid
     *
     * @see https://developer.wordpress.org/block-editor/reference-guides/core-blocks/#group
     */
    protected static ?array $group_variations = ['group'];

    /**
     * 埋め込みブロック（core/embed）で許可するバリエーション名
     *
     * null … 制限なし（すべての埋め込みサービス）
     * array … 指定したサービスのみ（インサーター表示 + oEmbed 制限）
     *         先頭を isDefault にし、汎用「埋め込み」はインサーター非表示
     *
     * 主な variation name 例:
     * youtube, vimeo, twitter, instagram, facebook, tiktok, spotify, ...
     *
     * @see https://developer.wordpress.org/block-editor/reference-guides/core-blocks/#embed
     */
    protected static ?array $embed_variations = ['youtube'];

    /**
     * embed_variations 名と oEmbed プロバイダー URL パターンの対応
     * oEmbed 側の制限に使用（パターン文字列に含まれるかで判定）
     *
     * @var array<string, array<string>>
     */
    protected static array $embed_oembed_matchers = [
        'youtube' => ['youtube', 'youtu.be'],
    ];

    /**
     * 共通 allowed_blocks を取得
     *
     * @return array<string>|null
     */
    public static function get(): ?array
    {
        return self::$blocks;
    }

    /**
     * グループバリエーションの許可リストを取得
     *
     * @return array<string>|null null の場合は制限なし
     */
    public static function getGroupVariations(): ?array
    {
        return self::normalizeNames(self::$group_variations);
    }

    /**
     * 埋め込みバリエーションの許可リストを取得
     *
     * @return array<string>|null null の場合は制限なし
     */
    public static function getEmbedVariations(): ?array
    {
        return self::normalizeNames(self::$embed_variations);
    }

    /**
     * oEmbed プロバイダー制限用のマッチャー一覧を取得
     *
     * @return array<string>|null
     */
    public static function getEmbedOembedMatchers(): ?array
    {
        $variations = self::getEmbedVariations();
        if ($variations === null) {
            return null;
        }

        return self::buildOembedMatchers($variations);
    }

    /**
     * embed_variations 名から oEmbed マッチャー一覧を生成
     *
     * @param array<string> $variations
     * @return array<string>|null
     */
    public static function buildOembedMatchers(array $variations): ?array
    {
        $matchers = [];
        foreach ($variations as $name) {
            foreach (self::$embed_oembed_matchers[$name] ?? [] as $matcher) {
                $matchers[] = $matcher;
            }
        }

        return $matchers === [] ? null : array_values(array_unique($matchers));
    }

    /**
     * @param array<string>|null $names
     * @return array<string>|null
     */
    public static function normalizeNames(?array $names): ?array
    {
        if ($names === null) {
            return null;
        }

        $normalized = [];
        foreach ($names as $name) {
            if (!is_string($name) || $name === '') {
                continue;
            }
            $normalized[] = $name;
        }

        return $normalized;
    }
}
