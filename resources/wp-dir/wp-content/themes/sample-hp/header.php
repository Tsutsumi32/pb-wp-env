<?php if (!defined('ABSPATH')) {
    exit();
} ?>

<!DOCTYPE HTML>
<html <?php language_attributes(); ?>>

<head prefix="og:http://ogp.me/ns#">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php
// 番号・アドレス検知防止
?>
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="address=no">
    <?php
// リファラ情報の送信制御
?>
    <meta name="referrer" content="strict-origin-when-cross-origin">

    <?php
    // GTM・アナリティクス等（head 内・上部）
    require_once __DIR__ . '/inc/meta/tracking-tags.php';
    // index
    require_once __DIR__ . '/inc/meta/noindex.php';
    // タイトル
    require_once __DIR__ . '/inc/meta/title.php';
    // ディスクリプション
    require_once __DIR__ . '/inc/meta/description.php';
    // OGP
    require_once __DIR__ . '/inc/meta/ogp.php';
    // フォント
    require_once __DIR__ . '/inc/meta/font.php';
    // ファビコン
    require_once __DIR__ . '/inc/meta/favicon.php';
    // カラー
    require_once __DIR__ . '/inc/meta/theme-color.php';
    ?>

    <?php wp_head(); ?>
</head>

<body data-page="<?php echo esc_attr(get_current_slug()); ?>" class="<?php echo esc_attr(
    'page_' . sanitize_html_class(get_current_slug()),
); ?>">
    <?php
    // GTM noscript 等（body 開始直後）
    require_once __DIR__ . '/inc/meta/tracking-tags-body.php';
    ?>
<noscript>
    <div class="noJs"></div>
    <p style="height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; text-align: center; position: relative; z-index: 999999;">本サイトをご利用の際は、<br>javascriptを有効にしてください</p>
</noscript>
<?php
// 訪問セッション
?>
    <script>
        (function() {
            const countKey = 'already_visited_app_count';
            const revisitClass = 'is_alreadyVisit';
            const body = document.body;

            function getVisitCount() {
                try {
                    return parseInt(sessionStorage.getItem(countKey) || '0', 10) || 0;
                } catch {
                    return 0;
                }
            }

            function applyRevisitClassIfNeeded() {
                if (getVisitCount() >= 1) {
                    body.classList.add(revisitClass);
                }
            }

            function incrementVisitCount() {
                try {
                    const count = getVisitCount();
                    sessionStorage.setItem(countKey, String(count + 1));
                } catch {}
            }

            /** タブ内 2 回目以降なら class 付与 → 表示回数を加算 */
            function runVisitSession() {
                applyRevisitClassIfNeeded();
                incrementVisitCount();
            }

            runVisitSession();

            // BFCache: インライン script は再実行されない
            window.addEventListener(
                'pageshow',
                (event) => {
                    if (event.persisted) {
                        applyRevisitClassIfNeeded();
                    }
                },
                true
            );

            // Chrome prerender: アクティブ化時に sessionStorage がリセットされることがある
            if (document.prerendering) {
                document.addEventListener('prerenderingchange', runVisitSession, {
                    once: true,
                });
            }
        })();
    </script>

    <div
        class="el_loading"
        data-loading
        role="status"
        aria-live="polite"
        aria-busy="false"
        aria-label="処理中"
    ></div>

    <header class="header" data-module="header">
        ヘッダー
    </header>
