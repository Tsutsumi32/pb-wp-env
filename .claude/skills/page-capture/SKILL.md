---
name: page-capture
description: >-
  Playwright（make capture-page / capture-all）で実装画面を _docs/capture/capture-{slug}.png
  に保存する。画面幅 1440px。observer 表示後・ヘッダー先頭。入力画面は未入力、確認画面は confirm モード。
  初回はエージェントが capture-config / flows を調整。2回目以降は手動 make で再取得（トークン節約）。
  全画面キャプチャ依頼時に使用。
---

# page-capture

ローカル実装画面のキャプチャを `_docs/capture/` に揃える。実体は **Playwright + make**。

**禁止**: Chrome DevTools MCP（`mcp__chrome-devtools__navigate_page` / `mcp__chrome-devtools__evaluate_script` / `mcp__chrome-devtools__take_screenshot` 等）での撮影。ツールが使える環境でも、画面キャプチャ用途では使わない。撮影ロジックは `resources/node/page-capture/` に一本化する。

## 入出力

| 項目 | 内容 |
|------|------|
| 保存先 | `_docs/capture/`(共有パス。ツールごとに複製しない) |
| コマンド一覧 | `_docs/capture/README.md`(ジョブ定義から自動生成。手編集しない) |
| ファイル名 | `capture-{slug}.png`(ジョブ slug。pages.php キーと一致しない場合あり) |
| 画面幅 | **PNG 幅 1440px**(スクロールバーで狭めない。`prepare-page.js`) |
| 高さ | ビューポート任意(既定 780)。撮影は **フルページ** |
| 実装 | `resources/node/page-capture/` |

## 役割分担(トークン節約)

| 回 | 誰が | 内容 |
|----|------|------|
| **初回** | エージェント | プロジェクト固有の `capture-config.js`・`flows/` を合わせてから `make capture-all`。**`_docs/capture/README.md` にコマンド一覧を必ず残す** |
| **2回目以降** | 人(開発者) | `_docs/capture/README.md` の make を手動実行。修正のたびエージェントに依頼しない |

## プロジェクト固有の調整箇所

初回(またはフォーム／画面構成が変わったとき)にエージェントが編集する正本:

| ファイル | 内容 |
|----------|------|
| `resources/node/page-capture/capture-config.js` | `pages.php` パス、除外 slug、バリアントジョブ(タブ・確認画面) |
| `resources/node/page-capture/flows/*.js` | フォーム入力・確認遷移・タブ切替などの Playwright フロー |
| `docker-compose.yml` | `playwright`(`profiles: capture`)、`./_docs/capture` → `/capture-out` |

共通ロジック(observer 表示固定・lazy 画像読み込み・webfont 待ち・コンテナからの URL リライト・1440px)は `prepare-page.js` / `capture-runner.js`。通常は触らない。

**キャプチャ差をテーマ SCSS で吸収しない**(`white-space: nowrap` 等)。Linux Chromium の文字幅差・observer 非表示は撮影側の問題。

### 初回に合わせること

1. `pages.php` のパスと slug 一覧
2. 除外(`error` / `not-found` 等)
3. **同一 URL の切替**(タブ・新卒/中途)→ `CAPTURE_VARIANT_JOBS` + flow
4. **確認画面**(別 URL でない場合)→ `mode: 'confirm'` + flow(入力→確認へ)
5. **サンクス**は独立 URL なら通常ジョブ(直アクセス)
6. `CAPTURE_SLUGS_REPLACED_BY_VARIANTS` で pages.php キーの重複撮影を防ぐ

## 前提

- **`make dev`** で Browser Sync 起動済み(`make up` だけでは `FRONT_PORT` は開かない)
- コンテナ内の `localhost` はホストを指さない。既定の到達先は `http://host.docker.internal:$(WP_CHAGE_PORT)`
- HTML 上の `localhost` 向け CSS/JS は `CAPTURE_PUBLIC_ORIGIN` でリライト(Makefile 既定)
- Playwright コンテナは `make capture-page-up`(`profiles: capture`)

## 対象画面の決め方

1. `pages.php` から一覧(`build-capture-jobs.js` が簡易パース)
2. **既定で含める**: 通常の閲覧画面
3. **既定で除外**: `error` / `not-found`(`capture-config.js` の `excludeSlugs`)
4. **バリアント**: `CAPTURE_VARIANT_JOBS`(例: `recruitment-new` / `contact-confirm-new`)
5. **詳細 URL 不明**の画面はジョブに載せずスキップ報告

## 撮影モード

| mode | 用途 | 例 |
|------|------|-----|
| `input`(既定) | 未入力の入力画面 | `contact-new`、`contact-mid` |
| `confirm` | 同一 URL 内の確認画面 | `contact-confirm-new`(入力→確認へを flows が実行) |
| (独立ページ) | サンクス等 | `contact-thanks` は通常 `input` で URL 直アクセス |

入力画面: `form.reset()` 後に撮影。確認画面: ダミー入力→「確認へ」→表示後に撮影。

## 手動コマンド(make)

2回目以降の正本は **`_docs/capture/README.md`**(初回スキル実行で生成)。汎用例:

```bash
# Playwright コンテナ起動(初回 or 停止後)
make capture-page-up

# コマンド一覧 MD だけ再生成(config / flows 変更後)
make capture-commands

# 1ページ(入力)
make capture-page CAPTURE_PATH=/contact/ CAPTURE_SLUG=contact-new

# 確認画面
make capture-page CAPTURE_PATH=/contact/ CAPTURE_SLUG=contact-confirm-new CAPTURE_MODE=confirm CAPTURE_FLOW=contactConfirmNewGrad

# 全画面(既存 PNG はスキップ)
make capture-all

# 全画面上書き
make capture-all CAPTURE_FORCE=1

# 停止
make capture-page-down
```

WordPress 直(Browser Sync なし)など、到達 URL を変えるときだけ明示:

```bash
make capture-page CAPTURE_PATH=/interview/ CAPTURE_SLUG=interview \
  CAPTURE_BASE_URL=http://host.docker.internal:8000
```

`http://localhost:…` をコンテナに渡すと接続拒否になる。

## エージェント実行フロー(初回・config 変更時)

```
- [ ] Step 0: pages.php / フォーム / タブを確認し、capture-config.js と flows を合わせる
- [ ] Step 1: 既存 capture-*.png の上書きが必要ならユーザーに確認する(不可逆ではないが共有成果物のため)
- [ ] Step 2: make capture-page-up
- [ ] Step 3: make capture-all(上書き可なら CAPTURE_FORCE=1。範囲指定なら capture-page)
- [ ] Step 4: `_docs/capture/README.md` が生成されていることを確認(無ければ make capture-commands)
- [ ] Step 5: PNG 幅 1440 を確認
- [ ] Step 6: 目視。長い空白(observer が外れた)、英単語の途中改行(webfont 未待ち/文字幅差)は `prepare-page.js` 側。テーマ SCSS は触らない
- [ ] Step 7: 成功/スキップ/失敗を報告し、再取得は README.md を案内
```

ビルド・コンパイルは実行しない(`CLAUDE.md`「ビルド・コンパイル」)。Chrome DevTools MCP は使わない。

**再撮影だけの依頼**(config 変更なし)は、エージェントが撮らず **`_docs/capture/README.md` のコマンドを案内**してよい(トークン節約)。明示的に実行を求められたときだけ make を回す。

### 上書き

- **手動 `make`**: `CAPTURE_FORCE=1` で上書き(チャット確認不要)
- **エージェント実行時**: 既存 PNG の上書きは事前にユーザーへ確認してから実行する

## 完了報告

- 保存ディレクトリ
- `_docs/capture/README.md`(ページごと・全画面の make 一覧)
- 成功した `capture-{slug}.png` 一覧(1440px)
- スキップ・失敗と理由
- 再取得は README.md を見る旨

## 関連

| 用途 | 参照 |
|------|------|
| 環境・フロントルート | `.cursor/skills/project-env-setup/reference.md`(Cursor 側。未移行のため直接参照) |
