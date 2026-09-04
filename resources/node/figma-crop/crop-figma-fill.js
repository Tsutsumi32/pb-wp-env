/**
 * Figma IMAGE fill の配置から、クリップ親フレーム相当の crop を行う。
 * assets.mdc §6-2 用。sharp が必要（Docker frontend コンテナ推奨）。
 * §1 矩形の通常写真は JPG。@EXP:PNG・角丸焼き込み・透過は PNG（outputPath の拡張子で判定）。
 * quality 既定は build-config IMAGE_CONVERT.COMPRESSION_JPEG_QUALITY と同値。
 *
 * 1 ノードに IMAGE fill が複数あるとき（写真 + PIXTA ID ラベル等）は `layers` で
 * 下から順に並べる。Figma の fills 配列と同じ順（index 0 = 最下面）。
 *
 * 配置の指定方法は 3 通り。
 *   - `imageTransform` … scaleMode: "CROP" の Figma 値をそのまま渡す（推奨・デザイン通り）
 *   - `fillMode: "object-cover-center"` … scaleMode: "FILL" 相当
 *   - `fill` … width/height/left/top（clip 親に対する %）を直接指定
 *
 * 情報起点（sample.jpg/png）: `sourcePath` でローカル入力可。`fillMode: "object-cover-center"`。
 * 正本: project/design-subpage「画像（実装時）」sample ラスタ crop。
 *
 * Usage:
 *   node node/figma-crop/crop-figma-fill.js <config.json>
 */
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

/** build-config.js IMAGE_CONVERT.COMPRESSION_JPEG_QUALITY と揃える */
const DEFAULT_JPEG_QUALITY = 90;

/**
 * Figma の object-cover（中央）相当の fill % を親フレームと原寸から算出する。
 * scaleMode: "FILL" / get_design_context が inset-0 object-cover のみ返す場合に使用する。
 */
function computeObjectCoverFill(frameWidth, frameHeight, sourceWidth, sourceHeight) {
  const scale = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
  const dispW = sourceWidth * scale;
  const dispH = sourceHeight * scale;

  return {
    width: (dispW / frameWidth) * 100,
    height: (dispH / frameHeight) * 100,
    left: ((frameWidth - dispW) / 2 / frameWidth) * 100,
    top: ((frameHeight - dispH) / 2 / frameHeight) * 100,
  };
}

/**
 * Figma の scaleMode: "CROP" の imageTransform を fill % へ変換する。
 * transform = [[sx, 0, tx], [0, sy, ty]] は、フレームの正規化座標を
 * 原画像の正規化座標へ写す行列。可視範囲は x: tx〜tx+sx / y: ty〜ty+sy。
 * @param {[[number, number, number], [number, number, number]]} transform
 */
function computeCropTransformFill(transform) {
  const [[sx, , tx], [, sy, ty]] = transform;
  if (!sx || !sy) {
    throw new Error(`imageTransform has zero scale: ${JSON.stringify(transform)}`);
  }

  return {
    width: (1 / sx) * 100,
    height: (1 / sy) * 100,
    left: (-tx / sx) * 100,
    top: (-ty / sy) * 100,
  };
}

async function downloadToTemp(url, tempPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${url} (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(tempPath, buf);
  return tempPath;
}

/**
 * assetUrl（リモート）または sourcePath（ローカル）のどちらか必須。
 * @param {{ assetUrl?: string, sourcePath?: string }} layer
 * @param {string} tempPath
 */
async function resolveSourceToTemp(layer, tempPath) {
  if (layer.sourcePath) {
    const src = path.resolve(layer.sourcePath);
    if (!(await fs.pathExists(src))) {
      throw new Error(`sourcePath not found: ${src}`);
    }
    await fs.copy(src, tempPath);
    return;
  }
  if (layer.assetUrl) {
    await downloadToTemp(layer.assetUrl, tempPath);
    return;
  }
  throw new Error('assetUrl or sourcePath is required');
}

/**
 * outputPath の拡張子で出力形式を決める。矩形写真は .jpg、@EXP:PNG / 角丸焼き込み / 透過は .png。
 * @param {string} outputPath
 * @param {number} [quality]
 */
function resolveOutputFormat(outputPath, quality = DEFAULT_JPEG_QUALITY) {
  const ext = path.extname(outputPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    return { format: 'jpeg', options: { quality, mozjpeg: true } };
  }
  if (ext === '.png') {
    return { format: 'png', options: {} };
  }
  throw new Error(
    `Unsupported output extension "${ext}" for ${outputPath}. Use .jpg (rect photo) or .png (@EXP:PNG / rounded / alpha).`,
  );
}

/**
 * レイヤーの配置（clip 親に対する %）を決める。
 * @param {object} layer
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {{ width: number, height: number }} meta
 */
function resolveLayerFill(layer, frameWidth, frameHeight, meta) {
  if (layer.imageTransform) {
    return computeCropTransformFill(layer.imageTransform);
  }
  if (layer.fillMode === 'object-cover-center' || layer.scaleMode === 'FILL') {
    return computeObjectCoverFill(frameWidth, frameHeight, meta.width, meta.height);
  }
  if (layer.fill) {
    return layer.fill;
  }
  throw new Error('imageTransform, fillMode or fill is required for each layer');
}

/**
 * 1 レイヤーを出力キャンバス（frame × scale）と同じサイズの PNG バッファへ描く。
 * 表示ボックスへリサイズしたうえで、はみ出し・不足を透過で埋めてフレーム分だけ切り出す。
 * @param {object} layer
 * @param {{ width: number, height: number }} fill
 * @param {number} outW
 * @param {number} outH
 * @param {string} tempPath
 */
async function renderLayer(layer, fill, outW, outH, tempPath) {
  const meta = await sharp(tempPath).metadata();

  // 表示ボックス（出力ピクセル基準）と、その中でフレームが切り出す位置
  const dispW = Math.max(1, Math.round((fill.width / 100) * outW));
  const dispH = Math.max(1, Math.round((fill.height / 100) * outH));
  const offsetX = Math.round((fill.left / 100) * outW);
  const offsetY = Math.round((fill.top / 100) * outH);

  const padLeft = Math.max(0, offsetX);
  const padTop = Math.max(0, offsetY);
  const padRight = Math.max(0, outW - (offsetX + dispW));
  const padBottom = Math.max(0, outH - (offsetY + dispH));

  // sharp は extend より extract を先に適用するため、パイプラインを分けて順序を固定する
  const padded = await sharp(tempPath)
    .resize(dispW, dispH, { fit: 'fill' })
    .ensureAlpha()
    .extend({
      left: padLeft,
      top: padTop,
      right: padRight,
      bottom: padBottom,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const buffer = await sharp(padded)
    .extract({
      left: padLeft - offsetX,
      top: padTop - offsetY,
      width: outW,
      height: outH,
    })
    .png()
    .toBuffer();

  return { buffer, source: `${meta.width}x${meta.height}`, disp: `${dispW}x${dispH}` };
}

async function cropOne(item) {
  const { outputPath, frameWidth, frameHeight, scale = 2, quality } = item;

  // 単一 fill の従来形式（assetUrl / sourcePath + fill / fillMode）も受け付ける
  const layers = item.layers ?? [
    {
      assetUrl: item.assetUrl,
      sourcePath: item.sourcePath,
      fill: item.fill,
      fillMode: item.fillMode,
      scaleMode: item.scaleMode,
      imageTransform: item.imageTransform,
    },
  ];

  const basename = path.basename(outputPath);
  const { format, options } = resolveOutputFormat(outputPath, quality);

  const prepared = [];
  for (const [index, layer] of layers.entries()) {
    const tempPath = path.join('/tmp', `figma-crop-${basename}-${index}-src`);
    await resolveSourceToTemp(layer, tempPath);
    const meta = await sharp(tempPath).metadata();
    prepared.push({
      layer,
      tempPath,
      meta,
      fill: resolveLayerFill(layer, frameWidth, frameHeight, meta),
    });
  }

  // §1 の倍率（PC ×2 / SP ×4）をそのまま使う。元画像解像度による自動低下はしない。
  const outW = Math.round(frameWidth * scale);
  const outH = Math.round(frameHeight * scale);

  const rendered = [];
  for (const entry of prepared) {
    rendered.push(await renderLayer(entry.layer, entry.fill, outW, outH, entry.tempPath));
    await fs.remove(entry.tempPath);
  }

  let pipeline = sharp({
    create: {
      width: outW,
      height: outH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(rendered.map((layer) => ({ input: layer.buffer })));

  if (format === 'jpeg') {
    pipeline = pipeline.flatten({ background: '#ffffff' });
  }

  await fs.ensureDir(path.dirname(outputPath));

  // 同一パス上書き時も安全なよう、一旦 temp に書いてから移動する
  const tempOutPath = path.join('/tmp', `figma-crop-${basename}-out`);
  await pipeline.toFormat(format, options).toFile(tempOutPath);
  await fs.move(tempOutPath, outputPath, { overwrite: true });

  console.log(
    `✅ ${basename} (${outW}x${outH}) scale=${scale} format=${format} layers=${rendered
      .map((layer) => `${layer.source}→${layer.disp}`)
      .join(' + ')}`,
  );
}

const configPath = process.argv[2];
if (!configPath) {
  console.error('Usage: node node/figma-crop/crop-figma-fill.js <config.json>');
  process.exit(1);
}

const config = await fs.readJson(configPath);
for (const item of config.items) {
  await cropOne(item);
}
