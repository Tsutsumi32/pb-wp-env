<?php
/************************************************
 * パンくずリスト出力
 *************************************************/
// 現在のスラッグ
$current_slug = get_current_slug();

// 現在のページ情報に設定されたパンくず情報
$current_bred = [];
if ($current_slug !== null) {
    if (Page::exists($current_slug)) {
        $current_bred = Page::getBreadcrumbs($current_slug);
    } elseif (Post::exists($current_slug)) {
        $current_bred = Post::getBreadcrumbs($current_slug);
    }
}

// 画面側から上書きする場合は「$override_bred に定義する」
if (isset($override_bred)) {
    $current_bred = $override_bred;
}

// パンくず項目を name / slug 形式に正規化し、HOME重複を除外
$breadcrumb_items = [];
foreach ($current_bred as $item) {
    if (is_array($item) && isset($item['name'])) {
        $slug = $item['slug'] ?? null;
        if ($slug === Page::TOP) {
            continue;
        }
        $breadcrumb_items[] = [
            'name' => $item['name'],
            'slug' => $slug,
        ];
        continue;
    }

    if (is_string($item) && $item !== Page::TOP) {
        $breadcrumb_items[] = [
            'name' => !empty(Post::getTitle($item))
                ? Post::getTitle($item)
                : Page::getTitle($item) ?? $item,
            'slug' => $item,
        ];
    }
}

$position = 1;
?>

<div class="ly_container __flexPage">
    <nav class="bl_breadCrumbsWrap" aria-label="パンくずリスト" data-bread-crumbs-wrap>
        <ol
            class="bl_breadCrumbs js_bred"
            data-module="breadCrumbs"
            itemscope
            itemtype="http://schema.org/BreadcrumbList"
        >
            <li
                class="bl_breadCrumbs_list js_bredList"
                data-bread-crumbs-item
                itemscope
                itemprop="itemListElement"
                itemtype="http://schema.org/ListItem"
            >
                <a class="bl_breadCrumbs_item js_bredItem" itemprop="item" href="<?php echo esc_url(
                    home_url('/'),
                ); ?>">
                    <span itemprop="name" data-bread-crumbs-item-text>TOP</span>
                </a>
                <meta itemprop="position" content="1" />
            </li>

            <?php foreach ($breadcrumb_items as $index => $item): ?>
                <?php
                $position++;
                $name       = $item['name'];
                $slug       = $item['slug'];
                $total      = count($breadcrumb_items);
                $is_current = !is_single() && ($slug === null || $index === $total - 1);

                if ($is_current) {
                    $url = '';
                } elseif ($slug !== null) {
                    $url = get_page_url($slug);
                } elseif (is_single() && $current_slug !== null) {
                    $url = get_page_url($current_slug);
                } else {
                    $url = '';
                }
                ?>
                <li
                    class="bl_breadCrumbs_list js_bredList"
                    data-bread-crumbs-item
                    itemscope
                    itemprop="itemListElement"
                    itemtype="http://schema.org/ListItem"
                >
                    <?php if ($is_current): ?>
                        <span class="bl_breadCrumbs_item js_bredItem" itemprop="item">
                            <span itemprop="name" data-bread-crumbs-item-text><?php echo esc_html($name); ?></span>
                        </span>
                    <?php else: ?>
                        <a class="bl_breadCrumbs_item js_bredItem" itemprop="item" href="<?php echo $url; ?>">
                            <span itemprop="name" data-bread-crumbs-item-text><?php echo esc_html($name); ?></span>
                        </a>
                    <?php endif; ?>
                    <meta itemprop="position" content="<?php echo $position; ?>" />
                </li>
            <?php endforeach; ?>

            <?php if (is_single()): ?>
                <?php $position++; ?>
                <li
                    class="bl_breadCrumbs_list js_bredList"
                    data-bread-crumbs-item
                    itemscope
                    itemprop="itemListElement"
                    itemtype="http://schema.org/ListItem"
                >
                    <span class="bl_breadCrumbs_item js_bredItem" itemprop="item">
                        <span itemprop="name" data-bread-crumbs-item-text><?php echo esc_html(get_the_title()); ?></span>
                    </span>
                    <meta itemprop="position" content="<?php echo $position; ?>" />
                </li>
            <?php endif; ?>
        </ol>
    </nav>
    <!-- /.bl_breadCrumbsWrap -->
</div>
<!-- /.ly_container -->
