(function (wp, config) {
  if (!wp?.domReady || !wp?.blocks || !config?.variations?.length) {
    return;
  }

  const allowed = config.variations;

  wp.domReady(function () {
    const variations = wp.blocks.getBlockVariations('core/group');
    if (!variations?.length) {
      return;
    }

    variations.forEach(function (variation) {
      if (!allowed.includes(variation.name)) {
        wp.blocks.unregisterBlockVariation('core/group', variation.name);
      }
    });
  });
})(window.wp, window.allowedBlocksGroupConfig || {});
