(function (wp, config) {
  if (!wp?.domReady || !wp?.blocks || !config?.variations?.length) {
    return;
  }

  const allowed = config.variations;

  wp.domReady(function () {
    const variations = wp.blocks.getBlockVariations('core/embed');
    if (!variations?.length) {
      return;
    }

    variations.forEach(function (variation) {
      if (!allowed.includes(variation.name)) {
        wp.blocks.unregisterBlockVariation('core/embed', variation.name);
      }
    });

    // 許可済みの先頭を isDefault にし、汎用「埋め込み」をインサーターから除外する
    const defaultName = allowed[0];
    const defaultVariation = wp.blocks
      .getBlockVariations('core/embed')
      ?.find(function (variation) {
        return variation.name === defaultName;
      });

    if (!defaultVariation || defaultVariation.isDefault) {
      return;
    }

    wp.blocks.unregisterBlockVariation('core/embed', defaultName);
    wp.blocks.registerBlockVariation(
      'core/embed',
      Object.assign({}, defaultVariation, { isDefault: true }),
    );
  });
})(window.wp, window.allowedBlocksEmbedConfig || {});
