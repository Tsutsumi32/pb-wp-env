<?php

/**
 * 外部プラグイン（CDN・ローカル JS/CSS）の定義と読み込み
 *
 * 追加時は self::$plugins に assets を position ごとに定義する。
 * - head           … 共通 CSS の後・ページ CSS の前
 * - before_page_js … ページ JS の前
 * - after_page_js  … ページ JS の後
 *
 * pages => '*' のとき pages の指定に関わらず全画面で読み込む。
 */
class AssetsPlugins
{
    /**
     * @var array<string, array{
     *   enabled?: bool,
     *   pages: list<string>|'*',
     *   assets: array<string, list<array{
     *     type: 'style'|'script',
     *     handle: string,
     *     src: string,
     *     version?: string,
     *   }>>,
     * }>
     */
    private static $plugins = [
        'swiper' => [
            'enabled' => false,
            'pages'   => [Page::TOP],
            'assets'  => [
                'head' => [
                    [
                        'type'    => 'style',
                        'handle'  => 'swiper-style',
                        'src'     => 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
                        'version' => '11',
                    ],
                ],
                'before_page_js' => [
                    [
                        'type'    => 'script',
                        'handle'  => 'swiper-js',
                        'src'     => 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
                        'version' => '11',
                    ],
                ],
            ],
        ],
        'yubinbango' => [
            'enabled' => false,
            'pages'   => [Page::CONTACT],
            'assets'  => [
                'after_page_js' => [
                    [
                        'type'    => 'script',
                        'handle'  => 'yubinbango-js',
                        'src'     => 'https://yubinbango.github.io/yubinbango/yubinbango.js',
                        'version' => 'yubinbangouscript',
                    ],
                ],
            ],
        ],
        'scrollHint' => [
            'enabled' => false,
            'pages'   => [],
            'assets'  => [
                'head' => [
                    [
                        'type'    => 'style',
                        'handle'  => 'scrollhint-style',
                        'src'     => 'https://unpkg.com/scroll-hint@latest/css/scroll-hint.css',
                        'version' => '8',
                    ],
                ],
                'before_page_js' => [
                    [
                        'type'    => 'script',
                        'handle'  => 'scrollhint-js',
                        'src'     => 'https://unpkg.com/scroll-hint@latest/js/scroll-hint.min.js',
                        'version' => '8',
                    ],
                ],
            ],
        ],
    ];

    /**
     * 指定 position のアセットを wp_enqueue する
     *
     * @param 'head'|'before_page_js'|'after_page_js' $position
     * @param array{page_script_handle?: string}      $options after_page_js 時にページ JS ハンドルを渡す
     */
    public static function enqueue(string $pageId, string $position, array $options = []): void
    {
        if ($pageId === '') {
            return;
        }

        foreach (self::collectAssets($pageId, $position) as $asset) {
            if ($asset['type'] === 'style') {
                self::enqueueStyle($asset, $position);
                continue;
            }
            self::enqueueScript($asset, $position, $options['page_script_handle'] ?? '');
        }
    }

    /**
     * 指定 position で enqueue される script ハンドル一覧（ページ JS の依存に使う）
     *
     * @param 'before_page_js'|'after_page_js' $position
     * @return list<string>
     */
    public static function getScriptHandles(string $pageId, string $position): array
    {
        if ($pageId === '') {
            return [];
        }

        $handles = [];
        foreach (self::collectAssets($pageId, $position) as $asset) {
            if ($asset['type'] === 'script') {
                $handles[] = $asset['handle'];
            }
        }

        return $handles;
    }

    /**
     * @param 'head'|'before_page_js'|'after_page_js' $position
     * @return list<array{type: string, handle: string, src: string, version?: string}>
     */
    private static function collectAssets(string $pageId, string $position): array
    {
        $assets = [];
        foreach (self::$plugins as $plugin) {
            if (($plugin['enabled'] ?? true) !== true) {
                continue;
            }
            $pages = $plugin['pages'] ?? [];
            if ($pages !== '*' && !in_array($pageId, $pages, true)) {
                continue;
            }
            foreach ($plugin['assets'][$position] ?? [] as $asset) {
                $assets[] = $asset;
            }
        }

        return $assets;
    }

    /**
     * @param array{type: string, handle: string, src: string, version?: string} $asset
     * @param 'head'|'before_page_js'|'after_page_js'                         $position
     */
    private static function enqueueStyle(array $asset, string $position): void
    {
        $deps = $position === 'head' ? ['style-common'] : [];
        wp_enqueue_style($asset['handle'], $asset['src'], $deps, $asset['version'] ?? null, 'all');
    }

    /**
     * @param array{type: string, handle: string, src: string, version?: string} $asset
     * @param 'head'|'before_page_js'|'after_page_js'                         $position
     */
    private static function enqueueScript(
        array $asset,
        string $position,
        string $pageScriptHandle
    ): void {
        $deps = [];
        if ($position === 'after_page_js' && $pageScriptHandle !== '') {
            $deps[] = $pageScriptHandle;
        }

        wp_enqueue_script($asset['handle'], $asset['src'], $deps, $asset['version'] ?? null, true);
    }
}
