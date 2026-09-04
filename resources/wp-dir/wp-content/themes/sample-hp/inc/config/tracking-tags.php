<?php

/**
 * GTM・アナリティクス等の計測タグ定義と出力
 *
 * 出力位置は次の2つに分ける。
 * - head   … `<head>` 内の上部（charset / viewport の直後）
 * - body_start … `<body>` 開始直後（他の要素より前）
 *
 * 設定方法:
 * 1. 定数 GTM_CONTAINER_ID / GA4_MEASUREMENT_ID を設定する（標準スニペットを自動生成）
 * 2. または wp-config.php に GTM_CONTAINER_ID / GA_MEASUREMENT_ID を define する
 * 3. または $headTags / $bodyStartTags に任意の HTML を追加する
 *
 * 出力の有無はホスト名から自動判定する（localhost / .local / .test / プライベート IP ではオフ）。
 * 本番でも止めたい場合のみ FORCE_DISABLED を true にする。
 *
 * GTM 利用時は GA4 を GTM 側で配信するのが一般的なため、GA4 定数は GTM 未使用時のみ使う。
 */
class TrackingTags
{
    /**
     * 強制オフ。true のとき開発・本番を問わず出力しない。
     * 通常は false（ホスト名から自動判定。ローカル開発では出力しない）。
     */
    public const FORCE_DISABLED = false;

    /**
     * Google Tag Manager コンテナ ID（例: GTM-XXXXXXX）
     * 設定時は head / body_start に標準スニペットを自動出力する
     */
    public const GTM_CONTAINER_ID = '';

    /**
     * Google Analytics 4 測定 ID（例: G-XXXXXXXXXX）
     * GTM 未使用時のみ head に gtag を出力する
     */
    public const GA4_MEASUREMENT_ID = '';

    /**
     * head 内に出力する追加タグ（上から順に連結）
     *
     * @var list<string>
     */
    private static $headTags = [
        // 例: Meta Pixel 等をそのまま貼り付け
    ];

    /**
     * body 開始直後に出力する追加タグ（上から順に連結）
     *
     * @var list<string>
     */
    private static $bodyStartTags = [
        // 例: GTM noscript 以外の body 直後タグ
    ];

    /**
     * 計測タグを出力するか（本番ホストのみ。FORCE_DISABLED で常時オフ可）
     */
    public static function isEnabled(): bool
    {
        if (self::FORCE_DISABLED) {
            return false;
        }

        return app_mode() === 'production';
    }

    /**
     * @param 'head'|'body_start' $position
     */
    public static function render(string $position): void
    {
        if (!self::isEnabled()) {
            return;
        }

        $tags = self::collectTags($position);
        if ($tags === []) {
            return;
        }

        echo '    ' . implode("\n    ", $tags) . "\n";
    }

    public static function getGtmContainerId(): string
    {
        if (defined('GTM_CONTAINER_ID') && is_string(GTM_CONTAINER_ID) && GTM_CONTAINER_ID !== '') {
            return GTM_CONTAINER_ID;
        }

        return trim(self::GTM_CONTAINER_ID);
    }

    public static function getGa4MeasurementId(): string
    {
        if (defined('GA_MEASUREMENT_ID') && is_string(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== '') {
            return GA_MEASUREMENT_ID;
        }

        if (defined('GA4_MEASUREMENT_ID') && is_string(GA4_MEASUREMENT_ID) && GA4_MEASUREMENT_ID !== '') {
            return GA4_MEASUREMENT_ID;
        }

        return trim(self::GA4_MEASUREMENT_ID);
    }

    /**
     * @param 'head'|'body_start' $position
     * @return list<string>
     */
    private static function collectTags(string $position): array
    {
        $tags = [];

        if ($position === 'head') {
            $gtmId = self::getGtmContainerId();
            if ($gtmId !== '') {
                $tags[] = self::buildGtmHeadTag($gtmId);
            }

            $ga4Id = self::getGa4MeasurementId();
            if ($ga4Id !== '' && $gtmId === '') {
                $tags[] = self::buildGa4HeadTag($ga4Id);
            }

            foreach (self::$headTags as $tag) {
                $trimmed = trim($tag);
                if ($trimmed !== '') {
                    $tags[] = $trimmed;
                }
            }

            return $tags;
        }

        if ($position === 'body_start') {
            $gtmId = self::getGtmContainerId();
            if ($gtmId !== '') {
                $tags[] = self::buildGtmBodyStartTag($gtmId);
            }

            foreach (self::$bodyStartTags as $tag) {
                $trimmed = trim($tag);
                if ($trimmed !== '') {
                    $tags[] = $trimmed;
                }
            }
        }

        return $tags;
    }

    private static function buildGtmHeadTag(string $containerId): string
    {
        $id = htmlspecialchars($containerId, ENT_QUOTES, 'UTF-8');

        return '<!-- Google Tag Manager -->' .
            "\n" .
            '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':' .
            'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],' .
            'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=' .
            '\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);' .
            '})(window,document,\'script\',\'dataLayer\',\'' .
            $id .
            '\');</script>' .
            "\n" .
            '<!-- End Google Tag Manager -->';
    }

    private static function buildGtmBodyStartTag(string $containerId): string
    {
        $id = htmlspecialchars($containerId, ENT_QUOTES, 'UTF-8');

        return '<!-- Google Tag Manager (noscript) -->' .
            "\n" .
            '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' .
            $id .
            '" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>' .
            "\n" .
            '<!-- End Google Tag Manager (noscript) -->';
    }

    private static function buildGa4HeadTag(string $measurementId): string
    {
        $id = htmlspecialchars($measurementId, ENT_QUOTES, 'UTF-8');

        return '<!-- Google tag (gtag.js) -->' .
            "\n" .
            '<script async src="https://www.googletagmanager.com/gtag/js?id=' .
            $id .
            '"></script>' .
            "\n" .
            '<script>' .
            'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' .
            'gtag(\'js\',new Date());gtag(\'config\',\'' .
            $id .
            '\');' .
            '</script>';
    }
}
