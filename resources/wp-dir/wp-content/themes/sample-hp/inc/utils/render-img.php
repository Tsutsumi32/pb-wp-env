<?php

/**
 * レスポンシブ画像出力関数
 *
 * このファイルでは、PC用とSP用の画像を適切な形式（AVIF、WebP、圧縮版）で出力する処理を定義します。
 * pictureタグとsourceタグを使用して、最適な画像形式を自動選択します。
 *
 * 新仕様（推奨）:
 * render_img([
 *   'fileName' => 'main.jpg', // 末尾は元ファイル名（拡張子含む）
 *   'alt' => 'メイン画像',
 *   'width' => '1000', // source（デフォルト）側のwidth/height
 *   'height' => '1000',
 *   'loading' => 'lazy', // eager|lazy|auto（省略時 eager）
 *   'responsive' => [
 *     'sp' => [ 'width' => '1200', 'height' => '600' ], // 存在時: PCファースト（spは _sp を参照）
 *     'pc' => [ 'width' => '1200', 'height' => '600' ], // 存在時: SPファースト（pcは _pc を参照）
 *   ],
 * ]);
 */
// AVIF を出力するかどうか
// false の場合、<source type="image/avif" ...> は一切出力しません。
if (!defined('RENDER_IMG_ENABLE_AVIF')) {
    define('RENDER_IMG_ENABLE_AVIF', false);
}

function render_img(array $attributes): void
{
    $hasExtension = function (string $path): bool {
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        return is_string($ext) && $ext !== '';
    };

    // ===== 共通: パス構築 =====
    $buildPaths = function (string $src): array {
        $info     = pathinfo($src);
        $dirname  = ($info['dirname'] ?? '.') !== '.' ? $info['dirname'] . '/' : '';
        $basename = $info['filename'] ?? '';
        $ext      = $info['extension'] ?? '';

        return [
            'webp'        => IMAGE_BASE_URI . '/' . IMAGE_DIR_WEBP . '/' . $dirname . $basename . '.webp',
            'avif'        => IMAGE_BASE_URI . '/' . IMAGE_DIR_AVIF . '/' . $dirname . $basename . '.avif',
            'compression' => IMAGE_BASE_URI .
                '/' .
                IMAGE_DIR_COMPRESSION .
                '/' .
                $dirname .
                $basename .
                '.' .
                $ext,
        ];
    };

    $withSuffix = function (string $fileName, string $suffix): string {
        // 末尾に _sp / _pc を入れる（拡張子の前）
        $info     = pathinfo($fileName);
        $dirname  = ($info['dirname'] ?? '.') !== '.' ? $info['dirname'] . '/' : '';
        $basename = $info['filename'] ?? '';
        $ext      = $info['extension'] ?? '';
        return $dirname . $basename . $suffix . '.' . $ext;
    };

    $extractDimensions = function (array $dims): string {
        $out = '';
        foreach (['width', 'height'] as $dim) {
            if (!empty($dims[$dim])) {
                $out .= sprintf(' %s="%s"', $dim, htmlspecialchars((string) $dims[$dim]));
            }
        }
        return $out;
    };

    // ===== loading 属性 =====
    $loadingCandidate = $attributes['loading'] ?? 'eager';
    $loadingCandidate = is_string($loadingCandidate)
        ? strtolower(trim($loadingCandidate))
        : 'eager';
    $allowedLoading = ['eager', 'lazy', 'auto'];
    $loading        = in_array($loadingCandidate, $allowedLoading, true) ? $loadingCandidate : 'eager';

    $enableAvif = (bool) (defined('RENDER_IMG_ENABLE_AVIF') ? RENDER_IMG_ENABLE_AVIF : false);

    // ===== 新仕様: fileName + responsive =====
    if (array_key_exists('fileName', $attributes)) {
        $fileName = (string) ($attributes['fileName'] ?? '');
        $alt      = (string) ($attributes['alt'] ?? '');

        if ($fileName === '') {
            echo '<!-- fileName属性が必要です -->';
            return;
        }
        if (!$hasExtension($fileName)) {
            echo '<!-- fileNameには拡張子付きのファイル名が必要です（例: main.jpg） -->';
            return;
        }

        $defaultDims = [
            'width'  => $attributes['width'] ?? '',
            'height' => $attributes['height'] ?? '',
        ];
        $defaultDimsStr = $extractDimensions($defaultDims);

        $responsive  = is_array($attributes['responsive'] ?? null) ? $attributes['responsive'] : [];
        $spDimsInput = is_array($responsive['sp'] ?? null) ? $responsive['sp'] : null;
        $pcDimsInput = is_array($responsive['pc'] ?? null) ? $responsive['pc'] : null;

        $hasSp = $spDimsInput && (!empty($spDimsInput['width']) || !empty($spDimsInput['height']));
        $hasPc = $pcDimsInput && (!empty($pcDimsInput['width']) || !empty($pcDimsInput['height']));

        // mode決定:
        // - responsive.sp がある場合: PCファースト（spは _sp）
        // - responsive.pc がある場合: SPファースト（pcは _pc）
        // - 両方ある場合は sp 優先（pc側は無視）
        $mode = $hasSp ? 'sp' : ($hasPc ? 'pc' : 'none');

        // picture で source/img 全体をラップ（どの分岐でも閉じタグを出す）
        echo '<picture>';

        if ($mode === 'sp') {
            if ($spDimsInput) {
                $spPaths      = $buildPaths($withSuffix($fileName, IMAGE_SUFFIX_SP));
                $spDimsStr    = $extractDimensions($spDimsInput);
                $breakpointSp = BREAKPOINT_SP;
                if ($enableAvif) {
                    echo <<<HTML
                    <source srcset="{$spPaths['avif']}" type="image/avif" media="(max-width: {$breakpointSp}px)"{$spDimsStr}>
                    HTML;
                }
                echo <<<HTML
                <source srcset="{$spPaths['webp']}" type="image/webp" media="(max-width: {$breakpointSp}px)"{$spDimsStr}>
                HTML;
            }

            // img と default（media無し）source はPC側を使用
            // responsive 設定があっても、default（img と media無し）はサフィックスを付けない
            // （呼び出し側が渡す $fileName が default 側の基準画像名になる）
            $pcBasePaths = $buildPaths($fileName);
            if ($enableAvif) {
                echo <<<HTML
                <source srcset="{$pcBasePaths['avif']}" type="image/avif"{$defaultDimsStr}>
                HTML;
            }
            echo <<<HTML
            <source srcset="{$pcBasePaths['webp']}" type="image/webp"{$defaultDimsStr}>
            HTML;

            // imgはPC側（base）を使用
            $imgWidth  = $attributes['width'] ?? '';
            $imgHeight = $attributes['height'] ?? '';
            $wAttr     = !empty($imgWidth)
                ? sprintf(' width="%s"', htmlspecialchars((string) $imgWidth))
                : '';
            $hAttr = !empty($imgHeight)
                ? sprintf(' height="%s"', htmlspecialchars((string) $imgHeight))
                : '';
            $altAttr = $alt !== '' ? sprintf(' alt="%s"', htmlspecialchars($alt)) : ' alt=""';
            echo sprintf(
                '<img src="%s"%s%s%s loading="%s">',
                htmlspecialchars($pcBasePaths['compression']),
                $wAttr,
                $hAttr,
                $altAttr,
                htmlspecialchars($loading)
            );
            echo '</picture>';
            return;
        }

        if ($mode === 'pc') {
            if ($pcDimsInput) {
                $pcPaths      = $buildPaths($withSuffix($fileName, IMAGE_SUFFIX_PC));
                $pcDimsStr    = $extractDimensions($pcDimsInput);
                $breakpointPc = BREAKPOINT_PC;
                if ($enableAvif) {
                    echo <<<HTML
                    <source srcset="{$pcPaths['avif']}" type="image/avif" media="(min-width: {$breakpointPc}px)"{$pcDimsStr}>
                    HTML;
                }
                echo <<<HTML
                <source srcset="{$pcPaths['webp']}" type="image/webp" media="(min-width: {$breakpointPc}px)"{$pcDimsStr}>
                HTML;
            }

            // img と default（media無し）source はSP側を使用
            // responsive 設定があっても、default（img と media無し）はサフィックスを付けない
            // （呼び出し側が渡す $fileName が default 側の基準画像名になる）
            $spBasePaths = $buildPaths($fileName);
            if ($enableAvif) {
                echo <<<HTML
                <source srcset="{$spBasePaths['avif']}" type="image/avif"{$defaultDimsStr}>
                HTML;
            }
            echo <<<HTML
            <source srcset="{$spBasePaths['webp']}" type="image/webp"{$defaultDimsStr}>
            HTML;

            // imgはSP側（base）を使用
            $imgWidth  = $attributes['width'] ?? '';
            $imgHeight = $attributes['height'] ?? '';
            $wAttr     = !empty($imgWidth)
                ? sprintf(' width="%s"', htmlspecialchars((string) $imgWidth))
                : '';
            $hAttr = !empty($imgHeight)
                ? sprintf(' height="%s"', htmlspecialchars((string) $imgHeight))
                : '';
            $altAttr = $alt !== '' ? sprintf(' alt="%s"', htmlspecialchars($alt)) : ' alt=""';
            echo sprintf(
                '<img src="%s"%s%s%s loading="%s">',
                htmlspecialchars($spBasePaths['compression']),
                $wAttr,
                $hAttr,
                $altAttr,
                htmlspecialchars($loading)
            );
            echo '</picture>';
            return;
        }

        // responsiveなし: ただの通常画像
        $basePaths = $buildPaths($fileName);
        if ($enableAvif) {
            echo <<<HTML
            <source srcset="{$basePaths['avif']}" type="image/avif"{$defaultDimsStr}>
            HTML;
        }
        echo <<<HTML
        <source srcset="{$basePaths['webp']}" type="image/webp"{$defaultDimsStr}>
        HTML;

        $imgWidth  = $attributes['width'] ?? '';
        $imgHeight = $attributes['height'] ?? '';
        $wAttr     = !empty($imgWidth)
            ? sprintf(' width="%s"', htmlspecialchars((string) $imgWidth))
            : '';
        $hAttr = !empty($imgHeight)
            ? sprintf(' height="%s"', htmlspecialchars((string) $imgHeight))
            : '';
        $altAttr = $alt !== '' ? sprintf(' alt="%s"', htmlspecialchars($alt)) : ' alt=""';
        echo sprintf(
            '<img src="%s"%s%s%s loading="%s">',
            htmlspecialchars($basePaths['compression']),
            $wAttr,
            $hAttr,
            $altAttr,
            htmlspecialchars($loading)
        );
        echo '</picture>';
        return;
    }
}
