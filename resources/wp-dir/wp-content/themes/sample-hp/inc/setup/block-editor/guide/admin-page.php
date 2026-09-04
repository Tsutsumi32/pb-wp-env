<?php

if (!defined('ABSPATH')) {
    exit();
}

require_once __DIR__ . '/collector.php';

/************************************************
 * コンテンツ編集ガイド（管理画面・編集者向け）
 *
 * - ブロック / 固定ページ / CPT / ACF / プラグインは設定から自動生成
 * - 補足メモはオプションに保存（コード変更不要）
 *************************************************/

const SAMPLE_HP_BLOCK_EDITOR_GUIDE_OPTION = 'sample_hp_block_editor_guide_notes';
const SAMPLE_HP_BLOCK_EDITOR_GUIDE_PAGE   = 'sample-hp-block-editor-guide';

/**
 * 管理画面メニューを追加
 */
function sample_hp_register_block_editor_guide_menu(): void
{
    add_menu_page(
        'コンテンツ編集ガイド',
        '編集ガイド',
        'edit_posts',
        SAMPLE_HP_BLOCK_EDITOR_GUIDE_PAGE,
        'sample_hp_render_block_editor_guide_page',
        'dashicons-book-alt',
        58
    );
}
add_action('admin_menu', 'sample_hp_register_block_editor_guide_menu');

/**
 * 補足メモの保存
 */
function sample_hp_handle_block_editor_guide_notes_save(): void
{
    if (!isset($_POST['sample_hp_block_editor_guide_notes_nonce'])) {
        return;
    }

    if (!current_user_can('manage_options')) {
        return;
    }

    check_admin_referer(
        'sample_hp_block_editor_guide_notes',
        'sample_hp_block_editor_guide_notes_nonce'
    );

    $notes = isset($_POST['sample_hp_block_editor_guide_notes'])
        ? wp_kses_post(wp_unslash((string) $_POST['sample_hp_block_editor_guide_notes']))
        : '';

    update_option(SAMPLE_HP_BLOCK_EDITOR_GUIDE_OPTION, $notes, false);

    wp_safe_redirect(
        add_query_arg(
            [
                'page'    => SAMPLE_HP_BLOCK_EDITOR_GUIDE_PAGE,
                'updated' => '1',
            ],
            admin_url('admin.php')
        )
    );
    exit();
}
add_action('admin_post_sample_hp_save_block_editor_guide_notes', 'sample_hp_handle_block_editor_guide_notes_save');

/**
 * 仕様書ページの簡易スタイル
 */
function sample_hp_enqueue_block_editor_guide_assets(string $hook_suffix): void
{
    if ($hook_suffix !== 'toplevel_page_' . SAMPLE_HP_BLOCK_EDITOR_GUIDE_PAGE) {
        return;
    }

    $css = <<<'CSS'
.sample-hp-block-guide {
  max-width: 960px;
}
.sample-hp-block-guide .sample-hp-block-guide__lead {
  margin: 0 0 1.5rem;
  color: #50575e;
  font-size: 14px;
  line-height: 1.7;
}
.sample-hp-block-guide .sample-hp-block-guide__toc {
  margin: 0 0 1.75rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #c3c4c7;
  border-radius: 4px;
}
.sample-hp-block-guide .sample-hp-block-guide__toc h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}
.sample-hp-block-guide .sample-hp-block-guide__toc ol {
  margin: 0;
  padding-left: 1.25rem;
}
.sample-hp-block-guide .sample-hp-block-guide__toc li + li {
  margin-top: 0.25rem;
}
.sample-hp-block-guide .sample-hp-block-guide__section {
  margin: 0 0 1.75rem;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid #c3c4c7;
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
}
.sample-hp-block-guide .sample-hp-block-guide__section h2 {
  margin: 0 0 0.75rem;
  padding: 0;
  font-size: 1.15rem;
}
.sample-hp-block-guide .sample-hp-block-guide__section h3 {
  margin: 1.25rem 0 0.5rem;
  font-size: 1rem;
}
.sample-hp-block-guide .sample-hp-block-guide__section p {
  margin: 0 0 0.75rem;
  line-height: 1.7;
}
.sample-hp-block-guide .sample-hp-block-guide__section p:last-child {
  margin-bottom: 0;
}
.sample-hp-block-guide .sample-hp-block-guide__notes {
  margin: 0;
  line-height: 1.7;
}
.sample-hp-block-guide .sample-hp-block-guide__notes > *:first-child {
  margin-top: 0;
}
.sample-hp-block-guide .sample-hp-block-guide__notes > *:last-child {
  margin-bottom: 0;
}
.sample-hp-block-guide table {
  margin: 0;
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}
.sample-hp-block-guide th,
.sample-hp-block-guide td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #dcdcde;
  text-align: left;
  vertical-align: top;
  line-height: 1.5;
  word-break: break-word;
}
.sample-hp-block-guide th {
  font-weight: 600;
  background: #f6f7f7;
}
.sample-hp-block-guide .sample-hp-block-guide__col-name {
  width: 9.5em;
}
.sample-hp-block-guide .sample-hp-block-guide__muted {
  color: #646970;
  font-size: 12px;
}
.sample-hp-block-guide .sample-hp-block-guide__badge {
  display: inline-block;
  margin: 0 0.25rem 0.25rem 0;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  background: #f0f0f1;
  color: #1d2327;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
}
.sample-hp-block-guide .sample-hp-block-guide__badge.is-ok {
  background: #edfaef;
  color: #0a7a28;
}
.sample-hp-block-guide .sample-hp-block-guide__badge.is-ng {
  background: #fcf0f1;
  color: #b32d2e;
}
.sample-hp-block-guide .sample-hp-block-guide__badge.is-warn {
  background: #fcf9e8;
  color: #9a6700;
}
.sample-hp-block-guide .sample-hp-block-guide__list {
  margin: 0;
  padding-left: 1.25rem;
}
.sample-hp-block-guide .sample-hp-block-guide__list li + li {
  margin-top: 0.35rem;
}
.sample-hp-block-guide .sample-hp-block-guide__card {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #dcdcde;
  border-radius: 4px;
  background: #fcfcfc;
}
.sample-hp-block-guide .sample-hp-block-guide__card:first-of-type {
  margin-top: 0.5rem;
}
.sample-hp-block-guide .sample-hp-block-guide__card h3 {
  margin: 0 0 0.4rem;
}
.sample-hp-block-guide textarea {
  width: 100%;
  min-height: 140px;
}
.sample-hp-block-guide .sample-hp-block-guide__actions {
  margin-top: 0.75rem;
}
CSS;

    wp_register_style('sample-hp-block-editor-guide', false, [], null);
    wp_enqueue_style('sample-hp-block-editor-guide');
    wp_add_inline_style('sample-hp-block-editor-guide', $css);
}
add_action('admin_enqueue_scripts', 'sample_hp_enqueue_block_editor_guide_assets');

/**
 * ガイドページを描画
 */
function sample_hp_render_block_editor_guide_page(): void
{
    if (!current_user_can('edit_posts')) {
        wp_die(esc_html__('このページを表示する権限がありません。', 'sample-hp'));
    }

    if (!function_exists('is_plugin_active')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    $data           = sample_hp_block_editor_guide_collect();
    $notes          = (string) get_option(SAMPLE_HP_BLOCK_EDITOR_GUIDE_OPTION, '');
    $can_edit_notes = current_user_can('manage_options');
    $updated        = isset($_GET['updated']) && (string) $_GET['updated'] === '1';

    $inserter_blocks = array_values(array_filter(
        $data['blocks'],
        static fn (array $block): bool => !$block['is_child']
    ));
    $child_blocks = array_values(array_filter(
        $data['blocks'],
        static fn (array $block): bool => $block['is_child']
    ));
    ?>
    <div class="wrap sample-hp-block-guide">
      <h1>コンテンツ編集ガイド</h1>
      <p class="sample-hp-block-guide__lead">
        このサイトで編集できる内容の一覧です。ブロック・固定ページ・カスタム投稿・カスタムフィールドなどの情報はテーマ設定から自動で反映されます。
      </p>

      <?php if ($updated) : ?>
        <div class="notice notice-success is-dismissible"><p>補足メモを保存しました。</p></div>
      <?php endif; ?>

      <nav class="sample-hp-block-guide__toc" aria-label="目次">
        <h2>目次</h2>
        <ol>
          <li><a href="#guide-notes">補足メモ</a></li>
          <li><a href="#guide-plugins">プラグイン（ACF / CF7）</a></li>
          <li><a href="#guide-pages">固定ページ</a></li>
          <li><a href="#guide-posts">カスタム投稿</a></li>
          <li><a href="#guide-acf">カスタムフィールド（ACF）</a></li>
          <li><a href="#guide-blocks">ブロックエディタ</a></li>
        </ol>
      </nav>

      <section id="guide-notes" class="sample-hp-block-guide__section">
        <h2>補足メモ</h2>
        <?php if ($notes !== '') : ?>
          <div class="sample-hp-block-guide__notes"><?php echo wp_kses_post(wpautop($notes)); ?></div>
        <?php else : ?>
          <p class="sample-hp-block-guide__muted">まだ補足メモはありません。</p>
        <?php endif; ?>

        <?php if ($can_edit_notes) : ?>
          <hr>
          <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="sample_hp_save_block_editor_guide_notes">
            <?php wp_nonce_field('sample_hp_block_editor_guide_notes', 'sample_hp_block_editor_guide_notes_nonce'); ?>
            <p><label for="sample_hp_block_editor_guide_notes"><strong>補足メモを編集</strong>（管理者のみ）</label></p>
            <textarea id="sample_hp_block_editor_guide_notes" name="sample_hp_block_editor_guide_notes" rows="8"><?php echo esc_textarea($notes); ?></textarea>
            <p class="sample-hp-block-guide__muted">HTML を使えます。運用上の注意や書き方のコツなど、手書きの説明を残せます。</p>
            <p class="sample-hp-block-guide__actions">
              <?php submit_button('補足メモを保存', 'secondary', 'submit', false); ?>
            </p>
          </form>
        <?php endif; ?>
      </section>

      <section id="guide-plugins" class="sample-hp-block-guide__section">
        <h2>プラグイン（ACF / CF7）</h2>
        <table>
          <thead>
            <tr>
              <th class="sample-hp-block-guide__col-name">項目</th>
              <th>利用</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach (['acf', 'cf7'] as $plugin_key) : ?>
              <?php
                $plugin      = $data['plugins'][$plugin_key];
                $badge_class = $plugin_key === 'cf7'
                    ? (!empty($plugin['configured']) ? 'is-ok' : 'is-ng')
                    : (!empty($plugin['active']) ? 'is-ok' : 'is-warn');
                $badge_label = $plugin_key === 'cf7'
                    ? (!empty($plugin['configured']) ? '利用する' : '利用しない')
                    : (!empty($plugin['active']) ? '利用中' : '未有効');
                ?>
              <tr>
                <th scope="row"><?php echo esc_html($plugin['label']); ?></th>
                <td>
                  <span class="sample-hp-block-guide__badge <?php echo esc_attr($badge_class); ?>">
                    <?php echo esc_html($badge_label); ?>
                  </span>
                </td>
                <td><?php echo esc_html($plugin['note']); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>

      <section id="guide-pages" class="sample-hp-block-guide__section">
        <h2>固定ページ</h2>
        <p>テンプレート実装のページは、管理画面からレイアウトを書き換えられません。設定項目がある場合はカスタムフィールドを編集してください。</p>
        <table>
          <thead>
            <tr>
              <th class="sample-hp-block-guide__col-name">ページ</th>
              <th>編集方法</th>
              <th>カスタムフィールド</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($data['pages'] as $page) : ?>
              <?php
                $mode_class = match ($page['edit_mode']) {
                    'editor'   => 'is-ok',
                    'acf_only' => 'is-warn',
                    'template' => 'is-warn',
                    default    => '',
                };
                ?>
              <tr>
                <th scope="row">
                  <?php echo esc_html($page['title']); ?>
                  <?php if (!empty($page['noindex'])) : ?>
                    <span class="sample-hp-block-guide__badge">noindex</span>
                  <?php endif; ?>
                  <div class="sample-hp-block-guide__muted"><?php echo esc_html($page['slug']); ?></div>
                </th>
                <td>
                  <span class="sample-hp-block-guide__badge <?php echo esc_attr($mode_class); ?>">
                    <?php echo esc_html($page['edit_label']); ?>
                  </span>
                  <div class="sample-hp-block-guide__muted"><?php echo esc_html($page['edit_detail']); ?></div>
                </td>
                <td>
                  <?php if ($page['acf_fields'] === []) : ?>
                    <span class="sample-hp-block-guide__muted">なし</span>
                  <?php else : ?>
                    <ul class="sample-hp-block-guide__list">
                      <?php foreach ($page['acf_fields'] as $field) : ?>
                        <li>
                          <?php echo esc_html($field['label']); ?>
                          <span class="sample-hp-block-guide__muted">
                            （<?php echo esc_html($field['type_label']); ?><?php echo !empty($field['required']) ? '・必須' : ''; ?>）
                          </span>
                        </li>
                      <?php endforeach; ?>
                    </ul>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>

      <section id="guide-posts" class="sample-hp-block-guide__section">
        <h2>カスタム投稿</h2>
        <?php foreach ($data['posts'] as $post) : ?>
          <article class="sample-hp-block-guide__card">
            <h3><?php echo esc_html($post['title']); ?></h3>
            <p class="sample-hp-block-guide__muted" style="margin-bottom: 0.5rem;">スラッグ: <?php echo esc_html($post['slug']); ?></p>
            <p>
              <span class="sample-hp-block-guide__badge <?php echo $post['editor'] ? 'is-ok' : 'is-ng'; ?>">
                <?php echo esc_html($post['editor_label']); ?>
              </span>
              <?php if ($post['has_archive']) : ?>
                <span class="sample-hp-block-guide__badge">一覧あり</span>
              <?php endif; ?>
              <?php if ($post['has_single']) : ?>
                <span class="sample-hp-block-guide__badge">詳細あり</span>
              <?php else : ?>
                <span class="sample-hp-block-guide__badge is-warn">詳細なし</span>
              <?php endif; ?>
            </p>
            <?php if ($post['single_note'] !== '') : ?>
              <p class="sample-hp-block-guide__muted"><?php echo esc_html($post['single_note']); ?></p>
            <?php endif; ?>
            <?php if ($post['supports'] !== []) : ?>
              <p><strong>編集できる項目:</strong> <?php echo esc_html(implode(' / ', $post['supports'])); ?></p>
            <?php endif; ?>
            <?php if ($post['taxonomies'] !== []) : ?>
              <p><strong>カテゴリ:</strong> <?php echo esc_html(implode(' / ', $post['taxonomies'])); ?></p>
            <?php endif; ?>
            <p><strong>カスタムフィールド:</strong></p>
            <?php if ($post['acf_fields'] === []) : ?>
              <p class="sample-hp-block-guide__muted">専用の追加項目はありません（共通項目がある場合は下の ACF 一覧を参照）。</p>
            <?php else : ?>
              <ul class="sample-hp-block-guide__list">
                <?php foreach ($post['acf_fields'] as $field) : ?>
                  <li>
                    <?php echo esc_html($field['label']); ?>
                    <span class="sample-hp-block-guide__muted">
                      （<?php echo esc_html($field['type_label']); ?><?php echo !empty($field['required']) ? '・必須' : ''; ?>
                      / <?php echo esc_html($field['group']); ?>）
                    </span>
                  </li>
                <?php endforeach; ?>
              </ul>
            <?php endif; ?>
          </article>
        <?php endforeach; ?>
      </section>

      <section id="guide-acf" class="sample-hp-block-guide__section">
        <h2>カスタムフィールド（ACF）</h2>
        <?php if ($data['acf'] === []) : ?>
          <p>定義済みのカスタムフィールドグループはありません。</p>
        <?php else : ?>
          <?php foreach ($data['acf'] as $group) : ?>
            <article class="sample-hp-block-guide__card">
              <h3><?php echo esc_html($group['label']); ?></h3>
              <p><strong>表示場所:</strong> <?php echo esc_html($group['location']); ?></p>
              <?php if ($group['items'] === []) : ?>
                <p class="sample-hp-block-guide__muted">フィールド未定義</p>
              <?php else : ?>
                <table>
                  <thead>
                    <tr>
                      <th>項目名</th>
                      <th>種類</th>
                      <th>必須</th>
                    </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($group['items'] as $item) : ?>
                      <tr>
                        <th scope="row"><?php echo esc_html($item['label']); ?></th>
                        <td><?php echo esc_html($item['type_label']); ?></td>
                        <td><?php echo !empty($item['required']) ? '必須' : '—'; ?></td>
                      </tr>
                    <?php endforeach; ?>
                  </tbody>
                </table>
              <?php endif; ?>
            </article>
          <?php endforeach; ?>
        <?php endif; ?>
      </section>

      <section id="guide-blocks" class="sample-hp-block-guide__section">
        <h2>ブロックエディタ</h2>
        <p>投稿・固定ページの本文で使えるブロックです。投稿タイプやページによって使えるブロックが異なる場合があります。</p>

        <h3>使えるブロック</h3>
        <table>
          <thead>
            <tr>
              <th class="sample-hp-block-guide__col-name">ブロック名</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($inserter_blocks as $block) : ?>
              <tr>
                <th scope="row"><?php echo esc_html($block['title']); ?></th>
                <td>
                  <?php if ($block['description'] !== '') : ?>
                    <?php echo esc_html($block['description']); ?>
                  <?php else : ?>
                    <span class="sample-hp-block-guide__muted">—</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        <?php if ($child_blocks !== []) : ?>
          <p class="sample-hp-block-guide__muted" style="margin-top: 1rem;">
            次のブロックは親ブロックから自動で挿入されます:
            <?php
            echo esc_html(implode(' / ', array_map(
                static fn (array $block): string => $block['title'],
                $child_blocks
            )));
            ?>
          </p>
        <?php endif; ?>

        <h3>埋め込み</h3>
        <?php if ($data['embed_variations'] === []) : ?>
          <p>埋め込みの利用は制限されていません（または埋め込み自体が無効です）。</p>
        <?php else : ?>
          <p>利用できる埋め込みは次のとおりです。汎用の「埋め込み」は表示されません。</p>
          <ul class="sample-hp-block-guide__list">
            <?php foreach ($data['embed_variations'] as $variation) : ?>
              <li><?php echo esc_html($variation['label']); ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

        <h3>グループ</h3>
        <?php if ($data['group_variations'] === []) : ?>
          <p>グループの種類に特別な制限はありません。</p>
        <?php else : ?>
          <ul class="sample-hp-block-guide__list">
            <?php foreach ($data['group_variations'] as $variation) : ?>
              <li><?php echo esc_html($variation['label']); ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

        <h3>使えるスタイル</h3>
        <?php if ($data['registered_styles'] === []) : ?>
          <p>テーマ独自の追加スタイルはありません。</p>
        <?php else : ?>
          <ul class="sample-hp-block-guide__list">
            <?php foreach ($data['registered_styles'] as $style) : ?>
              <li><?php echo esc_html($style['block_title'] . ' / ' . $style['label']); ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

        <h3>使えないスタイル</h3>
        <?php if ($data['disallowed_styles'] === []) : ?>
          <p>コア標準スタイルの制限はありません。</p>
        <?php else : ?>
          <ul class="sample-hp-block-guide__list">
            <?php foreach ($data['disallowed_styles'] as $style) : ?>
              <li><?php echo esc_html($style['block_title'] . ' / ' . $style['label']); ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

        <h3>余白について</h3>
        <p>
          ブロック同士の上下余白はテーマ側で自動調整されます。見出しの前後は広め、段落どうしは狭めになります。
        </p>
      </section>
    </div>
    <?php
}
