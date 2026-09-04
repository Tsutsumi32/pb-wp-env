/**
 * リンクカードブロック（custom-block/link-card）エディタ用
 */
(function (wp) {
  var blocks = wp.blocks;
  var element = wp.element;
  var blockEditor = wp.blockEditor;
  var components = wp.components;
  var serverSideRender = wp.serverSideRender;
  var i18n = wp.i18n;

  if (
    !blocks?.registerBlockType ||
    !element?.createElement ||
    !blockEditor?.MediaUpload ||
    !serverSideRender
  ) {
    return;
  }

  var registerBlockType = blocks.registerBlockType;
  var unregisterBlockType = blocks.unregisterBlockType;
  var createElement = element.createElement;
  var Fragment = element.Fragment;
  var InspectorControls = blockEditor.InspectorControls;
  var MediaUpload = blockEditor.MediaUpload;
  var MediaUploadCheck = blockEditor.MediaUploadCheck;
  var useBlockProps = blockEditor.useBlockProps;
  var TextControl = components.TextControl;
  var Button = components.Button;
  var ServerSideRender = serverSideRender;
  var __ = i18n.__;

  function LinkCardEdit(props) {
    var attributes = props.attributes;
    var setAttributes = props.setAttributes;
    var imageId = attributes.imageId || 0;
    var imageUrl = attributes.imageUrl || '';
    var imageAlt = attributes.imageAlt || '';
    var title = attributes.title || '';
    var url = attributes.url || '';
    var wrapperProps = useBlockProps ? useBlockProps() : { className: props.className };

    return createElement(
      Fragment,
      null,
      createElement(
        InspectorControls,
        null,
        createElement(
          'div',
          { style: { padding: '16px' } },
          createElement(TextControl, {
            label: __('タイトル', 'custom-block'),
            value: title,
            onChange: function (value) {
              setAttributes({ title: value || '' });
            },
          }),
          createElement(TextControl, {
            label: __('URL', 'custom-block'),
            value: url,
            type: 'url',
            onChange: function (value) {
              setAttributes({ url: value || '' });
            },
          }),
          createElement(
            'div',
            { style: { marginTop: '16px' } },
            createElement(
              'p',
              { style: { margin: '0 0 8px', fontWeight: '600' } },
              __('サムネイル', 'custom-block'),
            ),
            createElement(
              MediaUploadCheck,
              null,
              createElement(MediaUpload, {
                onSelect: function (media) {
                  setAttributes({
                    imageId: media?.id || 0,
                    imageUrl: media?.url || '',
                    imageAlt: media?.alt || '',
                  });
                },
                allowedTypes: ['image'],
                value: imageId,
                render: function (obj) {
                  return createElement(
                    'div',
                    null,
                    imageUrl
                      ? createElement('img', {
                          src: imageUrl,
                          alt: imageAlt,
                          style: { maxWidth: '100%', height: 'auto', marginBottom: '8px' },
                        })
                      : null,
                    createElement(
                      Button,
                      {
                        onClick: obj.open,
                        variant: imageId ? 'secondary' : 'primary',
                      },
                      imageId ? __('画像を変更', 'custom-block') : __('画像を選択', 'custom-block'),
                    ),
                    imageId
                      ? createElement(
                          Button,
                          {
                            onClick: function () {
                              setAttributes({
                                imageId: 0,
                                imageUrl: '',
                                imageAlt: '',
                              });
                            },
                            variant: 'link',
                            isDestructive: true,
                            style: { marginLeft: '8px' },
                          },
                          __('画像を削除', 'custom-block'),
                        )
                      : null,
                  );
                },
              }),
            ),
          ),
        ),
      ),
      createElement(
        'div',
        wrapperProps,
        createElement(ServerSideRender, {
          block: 'custom-block/link-card',
          attributes: attributes,
        }),
      ),
    );
  }

  if (blocks.getBlockType('custom-block/link-card')) {
    unregisterBlockType('custom-block/link-card');
  }

  registerBlockType('custom-block/link-card', {
    apiVersion: 3,
    title: __('リンクカード', 'custom-block'),
    category: 'custom-block',
    icon: 'admin-links',
    description: __('サムネイル・タイトル・URLを設定してリンクカードを表示します。', 'custom-block'),
    keywords: ['リンク', 'カード', 'link'],
    attributes: {
      imageId: { type: 'number', default: 0 },
      imageUrl: { type: 'string', default: '' },
      imageAlt: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      url: { type: 'string', default: '' },
    },
    supports: {
      html: false,
      multiple: true,
    },
    edit: LinkCardEdit,
    save: function () {
      return null;
    },
  });
})(window.wp);
