/**
 * コア標準の不要なブロックスタイルをエディタから削除
 * 対象は PHP（sampleHpBlockStyleRestrictions）から渡す
 */
(function (wp, config) {
  if (!wp?.hooks || !wp?.blocks || !wp?.domReady) {
    return;
  }

  const raw = config?.disallowed;
  if (!raw || typeof raw !== 'object') {
    return;
  }

  /** @type {Record<string, Set<string>>} */
  const DISALLOWED_STYLES = {};
  Object.keys(raw).forEach(function (blockName) {
    const names = raw[blockName];
    if (!Array.isArray(names) || names.length === 0) {
      return;
    }
    DISALLOWED_STYLES[blockName] = new Set(names);
  });

  if (Object.keys(DISALLOWED_STYLES).length === 0) {
    return;
  }

  wp.hooks.addFilter(
    'blocks.registerBlockType',
    'sample-hp/core-block-styles',
    function (settings, blockName) {
      const disallowed = DISALLOWED_STYLES[blockName];
      if (!disallowed || !Array.isArray(settings.styles)) {
        return settings;
      }

      return {
        ...settings,
        styles: settings.styles.filter(function (style) {
          return !disallowed.has(style.name);
        }),
      };
    },
  );

  wp.domReady(function () {
    Object.keys(DISALLOWED_STYLES).forEach(function (blockName) {
      DISALLOWED_STYLES[blockName].forEach(function (styleName) {
        wp.blocks.unregisterBlockStyle(blockName, styleName);
      });
    });
  });
})(window.wp, window.sampleHpBlockStyleRestrictions || {});
