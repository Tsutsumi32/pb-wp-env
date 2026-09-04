/**
 * 目次ブロック（custom-block/table-of-contents）エディタ用
 * block.json の editorScript から読み込まれる
 */
(function (wp) {
  var blocks = wp?.blocks;
  var element = wp?.element;
  var blockEditor = wp?.blockEditor;

  if (!blocks?.registerBlockType || !element?.createElement || !blockEditor?.useBlockProps) {
    return;
  }

  var registerBlockType = blocks.registerBlockType;
  var unregisterBlockType = blocks.unregisterBlockType;
  var createElement = element.createElement;
  var useBlockProps = blockEditor.useBlockProps;

  function TableOfContentsEdit() {
    var blockProps = useBlockProps({
      className:
        'bl_tableOfContents bl_tableOfContents__editor wp-block-custom-block-table-of-contents',
    });

    return createElement(
      'div',
      blockProps,
      createElement(
        'div',
        { className: 'bl_tableOfContents_header' },
        createElement('p', { className: 'bl_tableOfContents_title' }, '目次'),
      ),
      createElement(
        'div',
        { className: 'bl_tableOfContents_editorPreview', 'aria-hidden': 'true' },
        createElement('span', { className: 'bl_tableOfContents_editorBar' }),
        createElement('span', { className: 'bl_tableOfContents_editorBar' }),
        createElement('span', {
          className: 'bl_tableOfContents_editorBar bl_tableOfContents_editorBar__short',
        }),
      ),
      createElement(
        'p',
        { className: 'bl_tableOfContents_editorNote' },
        '公開時にページ内の見出し2から目次が自動生成されます',
      ),
    );
  }

  if (blocks.getBlockType('custom-block/table-of-contents')) {
    unregisterBlockType('custom-block/table-of-contents');
  }

  registerBlockType('custom-block/table-of-contents', {
    apiVersion: 3,
    title: '目次',
    category: 'custom-block',
    icon: 'list-view',
    description: 'ページ内の見出し2からアンカーリンク付きの目次を生成します。',
    keywords: ['目次', 'toc', '見出し'],
    supports: {
      html: false,
      multiple: true,
    },
    edit: TableOfContentsEdit,
    save: function () {
      return null;
    },
  });
})(window.wp);
