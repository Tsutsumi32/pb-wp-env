/**
 * 説明リストブロック（custom-block/description-list）エディタ用
 */
(function (wp) {
  var blocks = wp.blocks;
  var element = wp.element;
  var blockEditor = wp.blockEditor;
  var components = wp.components;
  var i18n = wp.i18n;

  if (
    !blocks?.registerBlockType ||
    !element?.createElement ||
    !element?.useEffect ||
    !element?.useRef ||
    !blockEditor?.useBlockProps ||
    !components?.TextControl ||
    !components?.TextareaControl
  ) {
    return;
  }

  var registerBlockType = blocks.registerBlockType;
  var unregisterBlockType = blocks.unregisterBlockType;
  var createElement = element.createElement;
  var useEffect = element.useEffect;
  var useRef = element.useRef;
  var useBlockProps = blockEditor.useBlockProps;
  var TextControl = components.TextControl;
  var TextareaControl = components.TextareaControl;
  var Button = components.Button;
  var __ = i18n.__;

  function createItemId() {
    return 'desc-item-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function defaultItem() {
    return {
      id: createItemId(),
      term: '',
      description: '',
    };
  }

  function htmlToPlainText(value) {
    if (typeof value !== 'string' || value === '') {
      return '';
    }

    if (value.indexOf('<') === -1) {
      return value;
    }

    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<\/?p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function normalizeItem(item, index, assignNewId) {
    if (!item || typeof item !== 'object') {
      return defaultItem();
    }

    var hasPersistedId = typeof item.id === 'string' && item.id !== '';
    var id = hasPersistedId
      ? item.id
      : assignNewId
        ? createItemId()
        : 'desc-item-pending-' + index;

    return {
      id: id,
      term: typeof item.term === 'string' ? item.term : '',
      description: htmlToPlainText(typeof item.description === 'string' ? item.description : ''),
    };
  }

  function getItems(attributesItems, assignNewId) {
    if (!Array.isArray(attributesItems) || !attributesItems.length) {
      return [defaultItem()];
    }

    return attributesItems.map(function (item, index) {
      return normalizeItem(item, index, assignNewId === true);
    });
  }

  function updateItemById(sourceItems, itemId, field, value) {
    return sourceItems.map(function (item) {
      if (item.id !== itemId) {
        return item;
      }

      var nextItem = Object.assign({}, item);
      nextItem[field] = value;
      return nextItem;
    });
  }

  function itemsNeedMigration(sourceItems) {
    if (!Array.isArray(sourceItems) || !sourceItems.length) {
      return true;
    }

    return sourceItems.some(function (item, index) {
      if (
        !item ||
        typeof item.id !== 'string' ||
        item.id === '' ||
        item.id.indexOf('desc-item-pending-') === 0
      ) {
        return true;
      }

      var normalized = normalizeItem(item, index, false);
      return item.description !== normalized.description;
    });
  }

  function DescriptionListItem(props) {
    var item = props.item;
    var items = props.items;
    var setAttributes = props.setAttributes;
    var canRemove = props.canRemove;

    return createElement(
      'div',
      { className: 'bl_descriptionList_item' },
      createElement(TextControl, {
        className: 'bl_descriptionList_term',
        label: __('項目名（dt）', 'custom-block'),
        hideLabelFromVision: true,
        value: item.term,
        placeholder: __('項目名（dt）', 'custom-block'),
        onChange: function (value) {
          setAttributes({
            items: updateItemById(items, item.id, 'term', value),
          });
        },
      }),
      createElement(
        'div',
        { className: 'bl_descriptionList_desc' },
        createElement(TextareaControl, {
          label: __('説明（dd）', 'custom-block'),
          hideLabelFromVision: true,
          value: item.description,
          rows: 4,
          placeholder: __('説明（dd）', 'custom-block'),
          onChange: function (value) {
            setAttributes({
              items: updateItemById(items, item.id, 'description', value),
            });
          },
        }),
        canRemove
          ? createElement(
              Button,
              {
                className: 'bl_descriptionList_removeItem',
                variant: 'link',
                isDestructive: true,
                onClick: function () {
                  setAttributes({
                    items: items.filter(function (currentItem) {
                      return currentItem.id !== item.id;
                    }),
                  });
                },
              },
              __('項目を削除', 'custom-block'),
            )
          : null,
      ),
    );
  }

  function DescriptionListEdit(props) {
    var attributes = props.attributes;
    var setAttributes = props.setAttributes;
    var items = getItems(attributes.items);
    var didMigrateRef = useRef(false);
    var blockProps = useBlockProps({
      className:
        'bl_descriptionList bl_descriptionList__editor wp-block-custom-block-description-list',
    });

    useEffect(function () {
      if (didMigrateRef.current) {
        return;
      }

      didMigrateRef.current = true;

      var sourceItems = attributes.items;
      if (!Array.isArray(sourceItems) || !sourceItems.length) {
        setAttributes({ items: [defaultItem()] });
        return;
      }

      if (!itemsNeedMigration(sourceItems)) {
        return;
      }

      setAttributes({ items: getItems(sourceItems, true) });
    }, []);

    return createElement(
      'div',
      blockProps,
      createElement(
        'dl',
        { className: 'bl_descriptionList_body' },
        items.map(function (item) {
          return createElement(DescriptionListItem, {
            key: item.id,
            item: item,
            items: items,
            setAttributes: setAttributes,
            canRemove: items.length > 1,
          });
        }),
      ),
      createElement(
        Button,
        {
          className: 'bl_descriptionList_addItem',
          variant: 'secondary',
          onClick: function () {
            setAttributes({ items: items.concat([defaultItem()]) });
          },
        },
        __('項目を追加', 'custom-block'),
      ),
    );
  }

  if (blocks.getBlockType('custom-block/description-list')) {
    unregisterBlockType('custom-block/description-list');
  }

  registerBlockType('custom-block/description-list', {
    apiVersion: 3,
    title: __('説明リスト', 'custom-block'),
    category: 'custom-block',
    icon: 'editor-ul',
    description: __(
      'dt/dd の説明コンテンツ。各項目は div で囲んで表示します。',
      'custom-block',
    ),
    keywords: ['説明', 'dl', 'dt', 'dd', '定義リスト'],
    attributes: {
      items: {
        type: 'array',
        default: [
          {
            id: '',
            term: '',
            description: '',
          },
        ],
      },
    },
    supports: {
      html: false,
      multiple: true,
    },
    edit: DescriptionListEdit,
    save: function () {
      return null;
    },
  });
})(window.wp);
