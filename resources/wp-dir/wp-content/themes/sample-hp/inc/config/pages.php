<?php

/************************************************
 * 固定ページクラス
 *************************************************/
class Page
{
    // 各画面キー一覧(スラッグ)
    public const TOP            = 'top';
    public const SAMPLE1        = 'sample1';
    public const SAMPLE2        = 'sample2';
    public const CONTACT        = 'contact';
    public const CONTACT_THANKS = 'thanks';
    /** 汎用エラー固定ページのスラッグ */
    public const ERROR = 'error';
    /** 404 時の画面キー（実ページスラッグとは別。WP固定ページは不要） */
    public const NOT_FOUND = 'not-found';

    /**
     * ドキュメントタイトル（<title> / og:title）に付ける文字列の設定。
     * SITE_NAME とは独立して指定する（og:site_name は引き続き SITE_NAME）。
     *
     * - text: 付ける文字列。空文字ならページタイトルのみ
     * - position: 'prefix'（先頭）または 'suffix'（末尾）
     * - separator: text とページタイトルの区切り
     *
     * @var array{text: string, position: string, separator: string}
     */
    protected static $documentTitleAffix = [
        'text'      => SITE_NAME,
        'position'  => 'suffix',
        'separator' => ' | ',
    ];

    // 各画面の情報　※ key = slugとする
    protected static $pages = [
        self::TOP => [
            'title'       => 'ホーム', // タイトル
            'description' => 'トップページです', // ディスクリプション
            'parent'      => null, // 親スラッグ
            'breadcrumbs' => [], // パンくず nameとslugの配列
            'noindex'     => false, // noindex設定 tureでnoindex
            'assets_name' => null, // css jsのファイル名 nullならキー名 指定した場合指定名
            // ブロックエディタで許可するブロック（未設定時は allowed-blocks.php の共通設定を使用）
        ],
        self::SAMPLE1 => [
            'title'       => 'サンプル1',
            'description' => 'サンプル1',
            'parent'      => null,
            'breadcrumbs' => [
                ['name' => 'ホーム', 'slug' => self::TOP],
                ['name' => 'サンプル1', 'slug' => null],
            ],
            'noindex'     => false,
            'assets_name' => 'sample',
        ],
        self::SAMPLE2 => [
            'title'       => 'サンプル2',
            'description' => 'サンプル2',
            'parent'      => self::SAMPLE1,
            'breadcrumbs' => [
                ['name' => 'ホーム', 'slug' => self::TOP],
                ['name' => 'サンプル1', 'slug' => self::SAMPLE1],
                ['name' => 'サンプル2', 'slug' => null],
            ],
            'noindex'     => false,
            'assets_name' => 'sample',
        ],
        self::CONTACT => [
            'title'       => 'お問い合わせ',
            'description' => '',
            'parent'      => null,
            'breadcrumbs' => [],
            'noindex'     => false,
            'assets_name' => null,
        ],
        self::CONTACT_THANKS => [
            'title'       => 'お問い合わせ完了',
            'description' => '',
            'parent'      => null,
            'breadcrumbs' => [],
            'noindex'     => true,
            'assets_name' => 'contact',
        ],
        self::ERROR => [
            'title'       => 'エラーが発生しました。',
            'description' => 'エラーが発生しました。',
            'parent'      => null,
            'breadcrumbs' => [],
            'noindex'     => true,
            'assets_name' => 'error',
        ],
        self::NOT_FOUND => [
            'title'       => '404 NOT FOUND',
            'description' => 'ページが見つかりませんでした',
            'parent'      => null,
            'breadcrumbs' => [],
            'noindex'     => true,
            'assets_name' => 'error',
        ],
    ];

    /**
     * 固定ページ共通のグループブロック（core/group）バリエーション
     *
     * null … allowed-blocks.php へフォールバック
     * array … 全固定ページに適用
     *
     * 設定例:
     * protected static ?array $group_variations = ['group', 'group-row'];
     */
    protected static ?array $group_variations = null;

    /**
     * 画面情報取得
     */
    public static function get(string $key): ?array
    {
        return self::$pages[$key] ?? null;
    }

    /**
     * 指定キーの存在チェック
     */
    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::$pages);
    }

    /**
     * タイトル取得
     */
    public static function getTitle(string $key): ?string
    {
        return self::get($key)['title'] ?? null;
    }

    /**
     * <title> / og:title 用の表示文字列を返す。
     * - ページタイトルが空、または affix と同一なら affix のみ
     * - affix が空ならページタイトルのみ
     * - それ以外: position に応じて prefix / suffix を付与
     *
     * @param string $pageTitle ページ固有のタイトル
     * @param string $affixText 前後に付ける文字列
     * @param string $position 'prefix' | 'suffix'
     * @param string $separator affix とページタイトルの区切り
     */
    public static function formatDocumentTitle(
        string $pageTitle,
        string $affixText,
        string $position = 'prefix',
        string $separator = ' | '
    ): string {
        $position = $position === 'suffix' ? 'suffix' : 'prefix';

        if ($pageTitle === '' || ($affixText !== '' && $pageTitle === $affixText)) {
            return $affixText !== '' ? $affixText : $pageTitle;
        }

        if ($affixText === '') {
            return $pageTitle;
        }

        if ($position === 'suffix') {
            return $pageTitle . $separator . $affixText;
        }

        return $affixText . $separator . $pageTitle;
    }

    /**
     * title タグおよび og:title と同一の整形済み文字列
     * （$documentTitleAffix と Page/Post のタイトル解決を内部で参照）
     *
     * @param string|null $key 画面キー。未指定時は get_current_slug()
     */
    public static function getFormattedDocumentTitle(?string $key = null): string
    {
        $key   = $key ?? (string) (get_current_slug() ?? '');
        $affix = self::$documentTitleAffix;

        // トップは affix のみ（従来どおり SITE_NAME のみ）
        $pageTitle = '';
        if (!is_home() && !is_front_page()) {
            $pageTitle = (string) (self::getTitle($key) ?? '');
            if ($pageTitle === '') {
                $pageTitle = (string) (Post::getTitle($key) ?? '');
            }
            if (is_single()) {
                $pageTitle = (string) get_the_title();
            }
        }

        return self::formatDocumentTitle(
            $pageTitle,
            (string) ($affix['text'] ?? ''),
            (string) ($affix['position'] ?? 'prefix'),
            (string) ($affix['separator'] ?? ' | ')
        );
    }

    /**
     * ディスクリプション取得
     */
    public static function getDescription(string $key): ?string
    {
        return self::get($key)['description'] ?? null;
    }

    /**
     * パンくず情報取得
     */
    public static function getBreadcrumbs(string $key): array
    {
        return self::get($key)['breadcrumbs'] ?? [];
    }

    /**
     * noindex取得
     */
    public static function getNoindex(string $key): bool
    {
        return self::get($key)['noindex'] ?? false;
    }

    /**
     * 親画面スラッグ取得
     */
    public static function getParent(string $key): ?string
    {
        return self::get($key)['parent'] ?? null;
    }

    /**
     * asset名の取得
     */
    public static function getAssetsName(string $key): ?string
    {
        return self::get($key)['assets_name'] ?? null;
    }

    /**
     * ブロックエディタで許可するブロック一覧を取得
     *
     * @return array<string>|null 未設定時は null（制限なし）
     */
    public static function getAllowedBlocks(string $key): ?array
    {
        $page = self::get($key);
        if ($page === null || !array_key_exists('allowed_blocks', $page)) {
            return null;
        }

        return BlockEditor::normalizeBlocks($page['allowed_blocks']);
    }

    /**
     * 埋め込みブロックで許可するバリエーション名を取得
     *
     * @return array<string>|null 未設定時は null（共通設定へフォールバック）
     */
    public static function getEmbedVariations(string $key): ?array
    {
        $page = self::get($key);
        if ($page === null || !array_key_exists('embed_variations', $page)) {
            return null;
        }

        return AllowedBlocks::normalizeNames($page['embed_variations']);
    }

    /**
     * 固定ページ共通のグループブロックバリエーション名を取得
     *
     * @return array<string>|null 未設定時は null（共通設定へフォールバック）
     */
    public static function getGroupVariations(): ?array
    {
        return AllowedBlocks::normalizeNames(self::$group_variations);
    }

    /**
     * 全情報取得
     */
    public static function getAll(): array
    {
        return self::$pages;
    }

    /**
     * WP-CLI用のページ定義（タイトル, スラッグ, 親スラッグ）を配列にし、1行ずつ文字列として出力する
     */
    public static function forCli()
    {
        $output = [];

        foreach (self::getAll() as $key => $data) {
            // 404 専用の仮想キー（固定ページとして作成しない）
            if ($key === self::NOT_FOUND) {
                continue;
            }
            $output[] = implode(':', [
                $data['title'],
                // スラッグ
                $key,
                $data['parent'] ?? '',
            ]);
        }

        foreach ($output as $line) {
            echo $line . PHP_EOL;
        }
    }
}
