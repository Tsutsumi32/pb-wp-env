<?php

/**
 * サイト内メッセージ・文言の一元管理
 *
 * 【秩序】
 * - 用途ごとに「カテゴリ」を定義する（定数 CATEGORY_* と $message_categories のキーを一致させる）
 * - 各カテゴリは query_param（GET でキーを渡すときのパラメータ名。不要なら null）と items（キー => 連想配列）を持つ
 * - 取得は Message::messageExists / getMessage / getMessageKeyFromRequest にカテゴリを渡して統一する
 */
class Message
{
    // -------------------------------------------------------------------------
    // カテゴリ識別子（$message_categories のキーと一致）
    // -------------------------------------------------------------------------

    /** エラー固定ページ（page-error.php）用 */
    public const CATEGORY_ERROR_PAGE = 'error_page';

    /** UI 共通ラベル等（クエリでは参照しない例。items を追記して利用） */
    public const CATEGORY_UI_LABEL = 'ui_label';

    // -------------------------------------------------------------------------
    // エラー固定ページ用のキー・クエリ名
    // -------------------------------------------------------------------------

    /** エラー画面でメッセージ種別を渡すクエリパラメータ名 */
    public const ERROR_MESSAGE_QUERY_KEY = 'msg';

    /** クエリ値: お問い合わせ（メール送信失敗など） */
    public const ERROR_MSG_KEY_CONTACT_MAIL_FAILED = 'contact_mail_failed';

    /**
     * @var array<string, array{query_param: ?string, items: array<string, array<string, mixed>>}>
     */
    private static $message_categories = [
        self::CATEGORY_ERROR_PAGE => [
            'query_param' => self::ERROR_MESSAGE_QUERY_KEY,
            'items'       => [
                self::ERROR_MSG_KEY_CONTACT_MAIL_FAILED => [
                    'title'       => 'お問い合わせエラー',
                    'description' => 'お問い合わせの送信に失敗しました。',
                    'headline'    => 'ERROR!',
                    'body_html'   => 'お問い合わせの送信に失敗しました。<br>大変お手数をおかけいたしますが、<br class="hp_hidden_default_sp">しばらくたってから再度送信をお願いいたします。',
                ],
            ],
        ],
        self::CATEGORY_UI_LABEL => [
            'query_param' => null,
            'items'       => [
                // 例: 'form_submit' => ['text' => '送信する'],
            ],
        ],
    ];

    /**
     * カテゴリが登録されているか
     */
    public static function categoryExists(string $category): bool
    {
        return isset(self::$message_categories[$category]);
    }

    /**
     * 指定カテゴリ・キーのメッセージが定義されているか
     */
    public static function messageExists(string $category, string $key): bool
    {
        return $key !== '' && self::getMessage($category, $key) !== null;
    }

    /**
     * メッセージ定義を取得（構造はカテゴリごとに異なり得る）
     *
     * @return array<string, mixed>|null
     */
    public static function getMessage(string $category, string $key): ?array
    {
        $config = self::getCategoryConfig($category);
        if ($config === null) {
            return null;
        }

        return $config['items'][$key] ?? null;
    }

    /**
     * カテゴリに紐づくクエリパラメータ名を取得（URL 組み立て用）。未設定時は null
     */
    public static function getCategoryQueryParam(string $category): ?string
    {
        $config = self::getCategoryConfig($category);
        if ($config === null) {
            return null;
        }
        $param = $config['query_param'];
        if ($param === null || $param === '') {
            return null;
        }

        return $param;
    }

    /**
     * 現在リクエストのクエリから、指定カテゴリのメッセージキーを取得する
     * - カテゴリに query_param が無いときは常に空文字
     * - 未指定のときは空文字（呼び出し側で messageExists と突き合わせる想定）
     * - wp_unslash / sanitize_text_field で正規化
     *
     * @return string クエリ値。未指定・未登録カテゴリ時は ''
     */
    public static function getMessageKeyFromRequest(string $category): string
    {
        $param = self::getCategoryQueryParam($category);
        if ($param === null) {
            return '';
        }
        if (!isset($_GET[$param])) {
            return '';
        }

        return sanitize_text_field(wp_unslash((string) $_GET[$param]));
    }

    /**
     * @return array{query_param: ?string, items: array<string, array<string, mixed>>}|null
     */
    private static function getCategoryConfig(string $category): ?array
    {
        return self::$message_categories[$category] ?? null;
    }
}
