<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * CPT 紐づけ非公開固定ページ設定クラス
 *
 * カスタム投稿の管理メニュー配下に、設定用の非公開固定ページを
 * ぶら下げるための定義を管理する。
 *
 * 新規追加時:
 * 1. 本クラスに設定キーと定義を追加
 * 2. AcfField::$acf_page_settings_fields / $acf_page_settings にフィールドを追加
 * 3. 管理専用の page-*.php テンプレートを用意
 * 4. 必要に応じて表示用ユーティリティを追加
 *************************************************/
class CptPageSettings
{
    // 設定キー例（有効化時はコメントを外す）
    // public const NEWS_INVOICE = 'news-invoice';

    /**
     * @var array<string, array{
     *   page_slug: string,
     *   page_title: string,
     *   page_template: string,
     *   post_type: string,
     *   admin_menu_label: string,
     *   capability?: string,
     * }>
     */
    protected static array $settings = [
        // 設定例: お知らせ（news）に管理専用の設定画面を追加する場合
        // self::NEWS_INVOICE => [
        //     'page_slug'        => 'news-page-settings',              // 非公開固定ページのスラッグ
        //     'page_title'       => '指定請求書ダウンロード',            // 固定ページのタイトル
        //     'page_template'    => 'page-news-invoice-settings.php',  // 管理専用テンプレート（テーマ直下）
        //     'post_type'        => Post::NEWS,                        // 紐づけ先 CPT
        //     'admin_menu_label' => '指定請求書ダウンロード',            // CPT メニュー配下の表示名
        //     'capability'       => 'edit_pages',                      // 省略時も edit_pages
        // ],
        //
        // あわせて必要な作業:
        // - AcfField::$acf_page_settings_fields / $acf_page_settings に同一キーで定義を追加
        // - page-news-invoice-settings.php を作成（Template Name を page_template と一致させる）
        // - フロント表示が必要なら表示用ユーティリティを追加
    ];

    /**
     * 設定定義を取得
     *
     * @return array<string, array<string, mixed>>|null
     */
    public static function get(string $key): ?array
    {
        return self::$settings[$key] ?? null;
    }

    /**
     * 設定キーの存在チェック
     */
    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::$settings);
    }

    /**
     * 全設定定義を取得
     *
     * @return array<string, array<string, mixed>>
     */
    public static function getAll(): array
    {
        return self::$settings;
    }

    public static function getPageSlug(string $key): ?string
    {
        $value = self::get($key)['page_slug'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function getPageTitle(string $key): ?string
    {
        $value = self::get($key)['page_title'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function getPageTemplate(string $key): ?string
    {
        $value = self::get($key)['page_template'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function getPostType(string $key): ?string
    {
        $value = self::get($key)['post_type'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function getAdminMenuLabel(string $key): ?string
    {
        $setting = self::get($key);
        if ($setting === null) {
            return null;
        }

        return (string) ($setting['admin_menu_label'] ?? $setting['page_title'] ?? '');
    }

    public static function getCapability(string $key): string
    {
        return (string) (self::get($key)['capability'] ?? 'edit_pages');
    }

    /**
     * 指定投稿タイプに紐づく設定キー一覧
     *
     * @return array<int, string>
     */
    public static function getKeysByPostType(string $post_type): array
    {
        $keys = [];
        foreach (self::$settings as $key => $setting) {
            if (($setting['post_type'] ?? '') === $post_type) {
                $keys[] = $key;
            }
        }

        return $keys;
    }

    /**
     * ページスラッグから設定キーを逆引き
     */
    public static function getKeyByPageSlug(string $page_slug): ?string
    {
        foreach (self::$settings as $key => $setting) {
            if (($setting['page_slug'] ?? '') === $page_slug) {
                return $key;
            }
        }

        return null;
    }

    /**
     * 固定ページ ID から設定キーを逆引き
     */
    public static function getKeyByPageId(int $page_id): ?string
    {
        if ($page_id <= 0) {
            return null;
        }

        $page = get_post($page_id);
        if (!($page instanceof WP_Post) || $page->post_type !== 'page') {
            return null;
        }

        return self::getKeyByPageSlug((string) $page->post_name);
    }
}
