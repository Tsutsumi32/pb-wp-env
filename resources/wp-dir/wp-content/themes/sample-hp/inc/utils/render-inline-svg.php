<?php

/**
 * SVG インライン出力関数
 *
 * テーマ配下の SVG ファイルを読み込み、HTML にインライン出力します。
 * サニタイズと、ルート <svg> への属性付与に対応します。
 *
 * render_inline_svg([
 *   'fileName'   => 'dec_top_mv_line.svg',
 *   'class'      => 'un_mv_lineSvg',
 *   'ariaHidden' => true,
 *   'role'       => 'img',
 *   'ariaLabel'  => '説明テキスト',
 * ]);
 *
 * @param array<string, mixed> $attributes
 */
function render_inline_svg(array $attributes): void
{
    $fileName = (string) ($attributes['fileName'] ?? '');

    if ($fileName === '') {
        echo '<!-- render_inline_svg: fileName属性が必要です -->';
        return;
    }

    $fileName = basename($fileName);

    if (pathinfo($fileName, PATHINFO_EXTENSION) !== 'svg') {
        echo '<!-- render_inline_svg: fileNameには.svg拡張子が必要です -->';
        return;
    }

    $baseDir = defined('SVG_BASE_DIR')
        ? SVG_BASE_DIR
        : get_template_directory() . '/assets/images/svg';
    $filePath = rtrim($baseDir, '/') . '/' . $fileName;

    $realPath = realpath($filePath);
    $realBase = realpath($baseDir);

    if ($realPath === false || $realBase === false || !str_starts_with($realPath, $realBase)) {
        echo '<!-- render_inline_svg: SVGファイルが見つかりません -->';
        return;
    }

    $svg = file_get_contents($realPath);

    if ($svg === false || trim($svg) === '') {
        echo '<!-- render_inline_svg: SVGファイルを読み込めません -->';
        return;
    }

    $svg = preg_replace('/<\?xml[^>]*\?>/i', '', $svg);
    $svg = trim((string) $svg);

    $svg = render_inline_svg_apply_root_attributes($svg, $attributes);
    $svg = render_inline_svg_sanitize($svg);

    if ($svg === '') {
        echo '<!-- render_inline_svg: サニタイズ後に出力できるSVGがありません -->';
        return;
    }

    echo $svg;
}

/**
 * テーマ管理の静的 SVG 向けサニタイズ
 *
 * wp_kses は SVG タグ名の小文字化や stroke="url(#id)" の除去で
 * グラデーション参照が壊れるため、危険要素のみ除去する。
 */
function render_inline_svg_sanitize(string $svg): string
{
    $svg = preg_replace('/<script[\s\S]*?<\/script>/i', '', $svg);
    $svg = preg_replace('/<foreignObject[\s\S]*?<\/foreignObject>/i', '', $svg);
    $svg = preg_replace('/\s(on[a-z]+)\s*=\s*(["\']).*?\2/i', '', $svg);
    $svg = preg_replace('/\s(xlink:href|href)\s*=\s*(["\'])\s*javascript:[^\2]*\2/i', '', $svg);

    return trim($svg);
}

/**
 * @param array<string, mixed> $attributes
 */
function render_inline_svg_apply_root_attributes(string $svg, array $attributes): string
{
    $hasRootAttributes = (array_key_exists('class', $attributes) &&
            is_string($attributes['class']) &&
            trim($attributes['class']) !== '') ||
        array_key_exists('ariaHidden', $attributes) ||
        (!empty($attributes['role']) && is_string($attributes['role'])) ||
        (!empty($attributes['ariaLabel']) && is_string($attributes['ariaLabel']));

    if (!$hasRootAttributes) {
        return $svg;
    }

    $dom                     = new DOMDocument();
    $dom->preserveWhiteSpace = true;
    $dom->formatOutput       = false;

    if (@$dom->loadXML($svg, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING) === false) {
        return $svg;
    }

    $svgElement = $dom->getElementsByTagName('svg')->item(0);

    if (!($svgElement instanceof DOMElement)) {
        return $svg;
    }

    if (array_key_exists('class', $attributes) && is_string($attributes['class'])) {
        $class = trim($attributes['class']);
        if ($class !== '') {
            $existingClass = trim($svgElement->getAttribute('class'));
            $mergedClass   = $existingClass !== '' ? $existingClass . ' ' . $class : $class;
            $svgElement->setAttribute('class', $mergedClass);
        }
    }

    if (array_key_exists('ariaHidden', $attributes)) {
        $svgElement->setAttribute('aria-hidden', $attributes['ariaHidden'] ? 'true' : 'false');
    }

    if (!empty($attributes['role']) && is_string($attributes['role'])) {
        $svgElement->setAttribute('role', $attributes['role']);
    }

    if (!empty($attributes['ariaLabel']) && is_string($attributes['ariaLabel'])) {
        $svgElement->setAttribute('aria-label', $attributes['ariaLabel']);
    }

    $output = $dom->saveXML($svgElement);

    if ($output === false) {
        return $svg;
    }

    return preg_replace('/<\?xml[^>]*\?>\s*/i', '', $output) ?: $svg;
}
