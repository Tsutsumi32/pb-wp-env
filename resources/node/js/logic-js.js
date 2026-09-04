/**********************************************
 * ES5変換 + Babel + Terser
 * - BUILD_MODE: 'entry'（ページごとエントリ）| 'dynamic'（単一エントリ・動的import）
 **********************************************/

import { build } from 'esbuild';
import { exec } from 'child_process';
import { mkdirSync } from 'fs';
import { transformFileAsync } from '@babel/core';
import { minify } from 'terser';
import path from 'path';
import { BUILD_CONFIG } from '../../build-config.js';
import fs from 'fs/promises';

const JS_CONFIG = BUILD_CONFIG.JS;
const BUILD_MODE = JS_CONFIG.BUILD_MODE || 'entry';

export const OUTPUT_DIR = JS_CONFIG.DIR_DIST;
export const ENTRY_DIRS = JS_CONFIG.ENTRY_DIRS || [];
export const ENTRY_DEPENDS_DIRS = JS_CONFIG.ENTRY_DEPENDS_DIRS || [];
export const ENTRY_DEPENDS_NAMED_DIRS = JS_CONFIG.ENTRY_DEPENDS_NAMED_DIRS || [];
export const DYNAMIC_ENTRY = JS_CONFIG.DYNAMIC_ENTRY;
export const DYNAMIC_DEPENDS_DIRS = JS_CONFIG.DYNAMIC_DEPENDS_DIRS || [];

// 出力フォルダを確実に作成
export function ensureOutputDir() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const esbuildBase = {
  bundle: true,
  minify: false,
  format: 'iife',
  target: ['es2020'],
  sourcemap: false,
  legalComments: 'none',
  keepNames: false,
  loader: { '.css': 'empty' },
};

// 直下の .js を列挙
async function listJsInDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => path.join(dir, e.name));
}

/** 1ファイルに Babel → Terser を適用 */
async function babelTerserFile(filePath) {
  const babelResult = await transformFileAsync(filePath, {
    presets: [['@babel/preset-env', { targets: ['defaults'], useBuiltIns: false }]],
    sourceMaps: false,
  });
  if (!babelResult?.code) throw new Error(`Babel Failed: ${filePath}`);
  const terserResult = await minify(babelResult.code, {
    compress: true,
    mangle: true,
    format: { beautify: false, comments: false },
  });
  if (!terserResult?.code) throw new Error(`Terser Failed: ${filePath}`);
  await fs.writeFile(filePath, terserResult.code);
}

/** entry 用: エントリパスから dist 出力のベース名を取得（拡張子なし。esbuild が .js を自動付与するため） */
function getEntryOutputName(entryPath) {
  const base = path.basename(entryPath);
  return base.endsWith('.js') ? base.slice(0, -3) : base;
}

/** entry 用: 全エントリの entryPoints オブジェクト（出力は outdir + ファイル名のみで .js.js を防ぐ） */
async function collectEntryPoints() {
  const lists = await Promise.all(ENTRY_DIRS.map((dir) => listJsInDir(dir)));
  const entryFiles = lists.flat();
  const obj = {};
  for (const entryPath of entryFiles) {
    const resolved = path.resolve(entryPath);
    const outName = getEntryOutputName(entryPath);
    obj[outName] = resolved;
  }
  return obj;
}

/** entry モード時: 現在のエントリに対応しない dist 内の .js を削除する */
async function removeOrphanOutputFiles() {
  if (BUILD_MODE !== 'entry' || ENTRY_DIRS.length === 0) return;
  const outDir = path.resolve(OUTPUT_DIR);
  try {
    const entries = await fs.readdir(outDir, { withFileTypes: true });
    const entryPoints = await collectEntryPoints();
    const expectedNames = new Set(Object.keys(entryPoints).map((base) => `${base}.js`));
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.js')) continue;
      if (expectedNames.has(e.name)) continue;
      const filePath = path.join(outDir, e.name);
      await fs.unlink(filePath);
      console.log(`🗑️ 削除（対応する entry なし）: ${e.name}`);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('removeOrphanOutputFiles:', err.message);
  }
}

/**
 * JSビルド（BUILD_MODE に応じて entry 全件 or dynamic 1件）
 */
export async function buildJs() {
  try {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    ensureOutputDir();

    if (BUILD_MODE === 'dynamic' && DYNAMIC_ENTRY) {
      // dynamic: 単一エントリ、コード分割でチャンク出力
      const outDir = path.resolve(OUTPUT_DIR);
      await build({
        entryPoints: [path.resolve(DYNAMIC_ENTRY)],
        outdir: outDir,
        splitting: true,
        format: 'esm',
        ...esbuildBase,
      });
      const outputFiles = await listJsInDir(outDir);
      for (const file of outputFiles) {
        await babelTerserFile(file);
      }
      console.log(`✅ JS build complete (dynamic, ${outputFiles.length} files)`);
      return;
    }

    // entry: 複数エントリ、*.entry.js → *.js
    const entryPoints = await collectEntryPoints();
    const entryFiles = Object.keys(entryPoints);
    if (entryFiles.length === 0) {
      console.warn('⚠️ エントリーファイルが見つかりません');
      return;
    }

    const outDir = path.resolve(OUTPUT_DIR);
    await build({
      entryPoints,
      outdir: outDir,
      ...esbuildBase,
    });

    for (const outBase of Object.keys(entryPoints)) {
      await babelTerserFile(path.join(outDir, `${outBase}.js`));
    }
    await removeOrphanOutputFiles();
    console.log(`✅ JS build complete (${Object.keys(entryPoints).length} files)`);
  } catch (error) {
    console.error(`❌ JS build Error: ${error.message}`);
  }
}

/**
 * 単一エントリのみビルド（watch 時・entry モード用）
 * entry モード: 指定した *.entry.js を 1 件だけビルドし、dist/*.js で出力
 */
export async function buildJsSingle(entryFilePath) {
  if (BUILD_MODE === 'dynamic') {
    return buildJs();
  }
  try {
    ensureOutputDir();
    const entryPath = path.resolve(entryFilePath);
    const outName = getEntryOutputName(entryPath);
    const outDir = path.resolve(OUTPUT_DIR);

    await build({
      entryPoints: { [outName]: entryPath },
      outdir: outDir,
      ...esbuildBase,
    });

    await babelTerserFile(path.join(outDir, `${outName}.js`));
    await removeOrphanOutputFiles();
    console.log(`✅ JS build complete: ${outName}.js`);
  } catch (error) {
    console.error(`❌ JS build Error: ${error.message}`);
  }
}

/**
 * 指定パスが ENTRY_DEPENDS_DIRS または ENTRY_DEPENDS_NAMED_DIRS のいずれか配下か
 */
export function isInEntryDependsDir(filePath) {
  const normalized = path.normalize(path.resolve(filePath));
  const allDepends = [...ENTRY_DEPENDS_DIRS, ...ENTRY_DEPENDS_NAMED_DIRS];
  for (const dir of allDepends) {
    const dirNorm = path.normalize(path.resolve(dir));
    if (normalized === dirNorm || normalized.startsWith(dirNorm + path.sep)) {
      return true;
    }
  }
  return false;
}

/**
 * 指定パスが ENTRY_DEPENDS_NAMED_DIRS のいずれか配下か
 */
export function isInEntryDependsNamedDir(filePath) {
  const normalized = path.normalize(path.resolve(filePath));
  for (const dir of ENTRY_DEPENDS_NAMED_DIRS) {
    const dirNorm = path.normalize(path.resolve(dir));
    if (normalized === dirNorm || normalized.startsWith(dirNorm + path.sep)) {
      return true;
    }
  }
  return false;
}

/**
 * 同名の entry ファイルパスを返す（ENTRY_DEPENDS_NAMED_DIRS 配下の変更ファイル用）。
 * 例: pages/top.js → entry/top.js。該当 entry が存在すればその絶対パス、なければ null。
 */
export async function getEntryPathForNamedDependsFile(dependsFilePath) {
  const normalized = path.normalize(path.resolve(dependsFilePath));
  for (const dir of ENTRY_DEPENDS_NAMED_DIRS) {
    const dirNorm = path.normalize(path.resolve(dir));
    if (!normalized.startsWith(dirNorm + path.sep) && normalized !== dirNorm) continue;
    const rel = path.relative(dirNorm, normalized);
    if (rel.startsWith('..')) continue;
    const entryFileName = path.basename(rel);
    for (const entryDir of ENTRY_DIRS) {
      const entryPath = path.resolve(entryDir, entryFileName);
      try {
        await fs.access(entryPath);
        return entryPath;
      } catch {
        // 当該 entry が存在しない（同名の .js がない）
      }
    }
    return null;
  }
  return null;
}

/**
 * 指定パスが DYNAMIC_DEPENDS_DIRS のいずれか配下か（dynamic モード用）
 */
export function isInDynamicDependsDir(filePath) {
  const normalized = path.normalize(path.resolve(filePath));
  for (const dir of DYNAMIC_DEPENDS_DIRS) {
    const dirNorm = path.normalize(path.resolve(dir));
    if (normalized === dirNorm || normalized.startsWith(dirNorm + path.sep)) {
      return true;
    }
  }
  return false;
}

/**
 * ESLint 実行（全体）
 */
export function runLintAll() {
  console.log(`📝 ESLint check...: ${JS_CONFIG.DIR_SRC}**/*.js`);
  exec(`npx eslint "${JS_CONFIG.DIR_SRC}**/*.js"`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ ESLint Error');
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    } else {
      console.log('✅ ESLint Complete');
    }
  });
}
