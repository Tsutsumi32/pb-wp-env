<?php

if (!defined('ABSPATH')) {
    exit();
}

/************************************************
 * ACFフィールドクラス
 *************************************************/
class AcfField
{
    // ACFフィールドグループキー名(使用する投稿スラッグを使用する)
    public const NEWS_ACF = Post::NEWS;

    // フィールドグループの、各フィールドのスラッグのプレフィクス
    public const NEWS_ACF_PREFIX = 'news_';

    // 固定ページ（例: サンプル1）
    public const SAMPLE1_ACF        = Page::SAMPLE1;
    public const SAMPLE1_ACF_PREFIX = 'sample1_';

    /**
     * カスタム投稿・公開固定ページ向けの ACF フィールド定義
     *
     * キー: Post::XXX や Page::XXX などの設定キー
     * 値: 各フィールドの配列（slug / label / type など）
     * init() 内の $acf_fields に代入され、getField() で参照する
     */
    protected static array $acf_fields = [];

    /**
     * カスタム投稿・公開固定ページ向けの ACF フィールドグループ定義
     *
     * キー: Post::XXX や Page::XXX などの設定キー
     * 値: グループ設定（slug / label / items / location_type など）
     * init() 内の $acf_settings に代入され、acf-setup.php が DB 同期の元データとして使う
     */
    protected static array $acf_settings = [];

    /**
     * CPT 紐づけ非公開固定ページ向けの ACF フィールド定義
     *
     * キー: CptPageSettings の設定キー
     * 値: 各フィールドの配列
     * CptPageSettings とセットで使い、管理専用の非公開固定ページに紐づける
     */
    protected static array $acf_page_settings_fields = [];

    /**
     * CPT 紐づけ非公開固定ページ向けの ACF フィールドグループ定義
     *
     * キー: CptPageSettings の設定キー
     * 値: グループ設定（location_type => page_template など）
     * getAllPageSettings() 経由で acf-setup.php に渡され、$acf_settings と同様に同期される
     */
    protected static array $acf_page_settings = [];

    /**
     * 初期化処理：フィールドと設定を動的に構築
     */
    public static function init(): void
    {
        // 各フィールドの設定定義
        // 利用できる主な設定キー（acf_item）:
        // - slug: 必須。フィールドキー兼name（例: sample_detail）
        // - label: ラベル名
        // - type: フィールドタイプ（未指定時 text）
        // - instruction: 管理画面の説明文（acf-setup 側で instructions に変換）
        // - required: 必須指定（0|1）
        // - default_value: デフォルト値
        // - placeholder: プレースホルダー
        // - choices: select/radio/checkbox などの選択肢
        /*
            [
                'pdf' => 'PDF',
                'external' => '外部サイト',
                'form' => 'ダウンロードフォーム'
            ]
        */
        // - conditional_logic: 表示制御
        /*
            [
                [
                    [
                        'field' => self::PRODUCT_PREFIX . 'catalog_type',
                        'operator' => '==',
                        'value' => 'pdf',
                    ],
                ],
            ],
        */
        // - allow_null: 空許容（0|1）
        // - multiple: 複数選択（0|1）
        // - mime_types: ファイル系フィールドの拡張子（例: 'pdf,docx'）
        // - taxonomy: taxonomy タイプ利用時の対象タクソノミー
        // - default_taxnomy_slug: taxonomyの場合の初期値にあてるtaxonomyスラッグ
        // - field_type: taxonomy の表示UI（checkbox/multi_select/radio/select）
        // - save_terms: taxonomy の保存連動（0|1）オフにすると、保存してもacfの値としてしか扱えない
        // - load_terms: taxonomy の読込連動（0|1）(連携状態の場合default_valueは使えない)
        // - return_format: プログラム上での扱い方を指定 (例:id or object)
        //
        // 固定ページ向けフィールドを追加する場合:
        // 1. Page::XXX 定数をキーに $acf_fields へフィールド定義を追加
        // 2. $acf_settings に location_type => 'page', page_slug => Page::XXX を指定
        //
        // CPT 紐づけ非公開固定ページ向けフィールドを追加する場合:
        // 1. CptPageSettings に設定を追加
        // 2. $acf_page_settings_fields / $acf_page_settings にフィールド定義を追加
        // 3. location_type => 'page_template' で管理専用 page-*.php を指定
        //
        // ACF 同期モード（config.php UDS_ACF_CODE_SYNC_DEV_MODE）:
        // - true（コード制御）: コード定義のみ DB に同期。コード外のグループは削除される
        // - false（配信）: 管理画面の DB 設定のみ有効。コード変更は反映されない
        self::$acf_fields = [
            self::NEWS_ACF => [
                [
                    'slug'          => self::NEWS_ACF_PREFIX . 'taxonomy',
                    'label'         => 'カテゴリ',
                    'type'          => 'taxonomy',
                    'required'      => 1,
                    'taxonomy'      => Post::NEWS_TAXONOMY,
                    'field_type'    => 'radio',
                    'save_terms'    => 1,
                    'load_terms'    => 1,
                    'return_format' => 'id',
                ],
                [
                    'slug'  => self::NEWS_ACF_PREFIX . 'image',
                    'label' => 'サムネイル画像',
                    'type'  => 'image',
                ],
                [
                    'slug'              => self::NEWS_ACF_PREFIX . 'content',
                    'label'             => '本文',
                    'type'              => 'textarea',
                    'instruction'       => '',
                    'default_value'     => '',
                    'placeholder'       => '',
                    'conditional_logic' => '',
                ],
            ],
            self::SAMPLE1_ACF => [
                [
                    'slug'  => self::SAMPLE1_ACF_PREFIX . 'lead',
                    'label' => 'リード文',
                    'type'  => 'textarea',
                ],
                [
                    'slug'          => self::SAMPLE1_ACF_PREFIX . 'news',
                    'label'         => '関連お知らせ',
                    'type'          => 'post_object',
                    'post_type'     => [Post::NEWS],
                    'return_format' => 'object',
                    'multiple'      => 1,
                    'allow_null'    => 1,
                    'ui'            => 1,
                ],
            ],
        ];

        self::$acf_page_settings_fields = [];

        // ACF 設定定義(フィールドグループ・フィールドを生成)
        // カスタム投稿: location_type 省略時は post_type
        // 固定ページ: location_type => 'page', page_slug => Page::XXX（pages.php のスラッグ）
        self::$acf_settings = [
            self::NEWS_ACF => [
                'slug'      => self::NEWS_ACF_PREFIX . 'field',
                'label'     => 'サンプル_設定項目',
                'post_type' => self::NEWS_ACF,
                'items'     => self::getField(self::NEWS_ACF),
                'thumbnail' => 'news_image', // 管理画面上の一覧上に表示される画像のキー名
            ],
            self::SAMPLE1_ACF => [
                'slug'          => self::SAMPLE1_ACF_PREFIX . 'field',
                'label'         => 'サンプル1_設定項目',
                'location_type' => 'page',
                'page_slug'     => self::SAMPLE1_ACF,
                'items'         => self::getField(self::SAMPLE1_ACF),
            ],
        ];

        self::$acf_page_settings = [];
    }

    /**
     * 指定ページ設定の ACF フィールドを取得
     */
    public static function getPageSettingsField(string $key): ?array
    {
        return self::$acf_page_settings_fields[$key] ?? null;
    }

    /**
     * すべてのページ設定定義を取得
     *
     * @return array<string, array<string, mixed>>
     */
    public static function getAllPageSettings(): array
    {
        return self::$acf_page_settings;
    }

    /**
     * 指定投稿タイプの ACF フィールドを取得
     */
    public static function getField(string $key): ?array
    {
        return self::$acf_fields[$key] ?? null;
    }

    /**
     * 指定投稿タイプの ACF 設定を取得
     */
    public static function getSetting(string $key): ?array
    {
        return self::$acf_settings[$key] ?? null;
    }

    /**
     * すべてのフィールド定義を取得
     */
    public static function getAllFields(): array
    {
        return self::$acf_fields;
    }

    /**
     * すべての設定定義を取得
     */
    public static function getAllSettings(): array
    {
        return self::$acf_settings;
    }
}
