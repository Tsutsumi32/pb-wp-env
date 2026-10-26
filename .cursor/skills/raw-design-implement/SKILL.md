---
name: raw-design-implement
description: >-
  整っていないデザインデータ（Illustrator / Photoshop 書き出し PNG 等。Figma MCP で構造が取れない案件）から
  テンプレート実装する。色枠 annotate・任意の AI JSON・解析計画 JSON・SCSS 骨組み＋JSON 由来タイポ／
  section・container・palette トークン。raw-design、イラレ実装、フォトショ書き出し、非 Figma デザイン実装の依頼時に使用する。
disable-model-invocation: true
---

# raw-design-implement

**整っていないデザインデータ**（レイヤーが Web 向きでない AI/PSD 書き出し等）を、Figma MCP 無しでテンプレート実装する。  
Figma 一括（`@figma-*`）・情報起点下層（`@subpage-design-implement`）とは別系統。

## 構成（正本の分担）

| ファイル | 内容 |
|----------|------|
| 本 SKILL | 位置づけ・フロー・やること／やらないこと |
| [exports.md](exports.md) | 配置・命名・annotate 有無判定・入力の役割 |
| [annotate.md](annotate.md) | 色枠の意味・入れ子・囲う／囲わない |
| [plan-json.md](plan-json.md) | 解析計画 JSON（中間・必要時手動調整） |
| [tokens.md](tokens.md) | タイポ・色・フォント・section／container |
| [scripts/export_artboard_to_json.illustrator.js](scripts/export_artboard_to_json.illustrator.js) | Illustrator → 補助 JSON |
| [scripts/export_artboard_to_json.photoshop.js](scripts/export_artboard_to_json.photoshop.js) | Photoshop → 補助 JSON（テキストレイヤー必須） |

## やること / やらないこと

| やる | やらない |
|------|----------|
| `.cursor/design/exports/<slug>/` のデザイン PNG を正本にする | Figma MCP を主経路にする |
| `*-annotate` があれば枠内のみ実装対象 | annotate:on で枠外の装飾を細分割してコーディングする |
| 任意の AI JSON でテキスト・色・bounds を補強 | AI/PSD バイナリをエージェントが直接読む |
| 解析計画 JSON を書いてから実装（必要時だけ人手調整） | 計画で `p`/`a`/`li` まで人がタグ指定する運用 |
| デフォルトはテンプレ（PHP＋sample 枠＋`@generate-scssfile`） | 余白・背景・装飾のフルスタイル再現を既定にする |
| JSON 突合できた **全テキスト**（`un_*` / `bl_*` / `el_*`）に `font()` **値直指定**（weight 必須） | `$text-styles` キー乱立 |
| 使用色 → `$color-palette`、本スキル経路は palette 直 `get-color` | Semantic `$colors` をこの経路で新規整備する |
| 不足フォント → `$font-configs` 追記・`$base_font` 未設定なら一度セット | `$base_font` をアートボードごとに再判定する |
| セクション／コンテナのおおよその値をトークンへ | Variables 無いのに Figma 並みの厳密突合を謳う |
| pages ensure（未登録なら） | lint / build / `npm run dev` の代行 |

## 必須参照（実装開始前）

**常時**

- [exports.md](exports.md) / [annotate.md](annotate.md) / [plan-json.md](plan-json.md) / [tokens.md](tokens.md)
- `frontend-base/html.mdc`
- `project/template/naming.mdc` / `php.mdc`
- `project/css/scss.mdc`（カラー例外は [tokens.md](tokens.md) が本スキル正）
- pages ensure: [project-page-info/pages-ensure.md](../project-page-info/pages-ensure.md)

**条件付き**

| 参照 | いつ |
|------|------|
| `project/template/image.mdc` | 画像・SVG・`render_img` |
| `figma/assets.mdc`「差し替えが必要な画像」・仮テキストは `figma/figma-rule.mdc` | TODO 記法 |
| `project-env-setup/reference.md`「C-6 フォント読み込み」 | `$font-configs` 新規ファミリー |
| `.cursor/design/components.md` | 黄枠コンポーネント／modules 化時 |
| AI JSON（exports 内 `*.json`） | あるとき。テキスト正本 |

## 実行フロー

```
- [ ] Step 0: page-slug・モード確認（既定 template）。未登録なら pages ensure
- [ ] Step 1: exports 入力確認（正本 PNG / annotate / 任意 AI JSON）。正本: exports.md
- [ ] Step 2: annotate 判定（*-annotate あり=on / 無し=通知して off）
- [ ] Step 3: 解析計画 JSON を `.cursor/tmp/` に作成（plan-json.md）。uncertain 多め・複雑なら報告し確認待ち可
- [ ] Step 4: トークン準備（tokens.md）— palette / $colors 切替・**`$font-configs` 不足追記**・**`$base_font` 未設定なら本文で一度セット**・section・container。フォント読み込みは AskQuestion。未充足なら Step 7 に進まない
- [ ] Step 5: PHP/HTML（枠＝実装対象。メディアは sample.*。テキストは AI JSON contents 優先）
- [ ] Step 6: @generate-scssfile（空骨組み）
- [ ] Step 7: JSON 突合テキストへ font() 値直指定（**weight 必須**・本文なら family 省略可）＋ color: get-color('palette-key')。コンポーネント内テキストも含む
- [ ] Step 8: 過不足・TODO・インデント確認。報告（annotate モード・計画パス・トークン変更・**font-configs / base_font**）
```

依頼で「スタイルまで」と明示された場合のみ、余白・背景等の近似スタイルを追加してよい（期待値は低め。装飾強めは画像寄せを優先）。

## Step 要点

### Step 0〜2

- slug 未指定 → `exports/` を走査し候補提示のうえ確認（AskQuestion 可）
- 入力の役割・命名は [exports.md](exports.md)
- 色枠は [annotate.md](annotate.md)。**実装対象だけ囲う**

### Step 3（計画 JSON）

- 正本: [plan-json.md](plan-json.md)
- 自動生成が基本。人が直すのはセクション境界・render・コンポーネント対応・uncertain
- **DOM タグ種（p/a/li 等）は計画で固定しない**（実装時に規約＋文脈で決定）

### Step 4〜7（トークン・実装）

- 正本: [tokens.md](tokens.md)
- **フォント**: Step 4 で `$font-configs` / `$base_font` を満たしてから Step 7（tokens.md「`$font-configs` / `$base_font`」）
- メディア青枠: 枠内ラベル `jpg`/`png`/`svg` → `sample.jpg` / `sample.png` / `sample.svg`（配置箇所ごと別名コピー・TODO。`design-subpage`「画像」と同趣旨）
- `annotate: on` の枠外は触らない（後で人が背景等に書き出し）
- ページ実装が揃ったら確認（vnu と HTML / SCSS / JS の規約。正本: `figma-page-implement/page-check.md`）

### 完了報告

短く: slug / annotate on|off / 計画パス / PHP・SCSS パス / palette・**font-configs・base_font**・section・container の変更有無 / uncertain 残り  
フォント未充足（configs 欠け・`$base_font` が `sans-serif` のみ等）なら完了扱いにしない。
## 他スキルとの境界

| スキル | 違い |
|--------|------|
| `@figma-template-coding` 等 | Figma MCP・レイヤー構造あり |
| `@subpage-design-implement` | brand＋brief。ワイヤーは「直写しない」。本スキルは完成デザイン書き出しの再現寄り（テンプレ＋限定スタイル） |
| `@generate-scssfile` | Step 6 で呼ぶ（空 `{}`） |
