---
name: js-catalog-adopt
description: >-
  development-os の JS カタログ（catalog/js）から feature／module／utils を案件の
  src/js へ採用（コピー）する。一覧・検索・初期化の足し方・依存確認を行う。
  js-catalog、カタログ採用、feature 流用、module 取り込み、utils カタログの依頼時に使用する。
  一括同期・全案件への配信は対象外。
disable-model-invocation: true
---

# JS カタログ採用

案件に無い横断 feature／module／utils を、**正本カタログからコピーして取り込む**。  
ビルド時にカタログを import しない。一括同期しない。

## カタログ位置

1. ワークスペース（または親）に `catalog/js/` があればそれを正とする（development-os 直下）
2. 無ければユーザーに development-os のパスを確認する（例: `…/development-os/catalog/js`）
3. 一覧の正本: [catalog/js/INDEX.md](../../../catalog/js/INDEX.md)（相対は development-os ルート時）

フロントルートの特定は `@project-env-setup` reference「フロントルート」に従う。

## 手順

### 1. 案件内を先に見る

`src/js/features/`・`src/js/modules/`（および `*/project/`）に同名・同等が無いか確認する。あればカタログは使わず既存を流用（`project/javascript/coading.mdc`「既存の流用」）。

### 2. カタログを探す

- `INDEX.md` と `features/` / `modules/` / `utils/` を読む
- ユーザー指定が無ければ候補を表で提示し、どれを採用するか確認する

### 3. コピー（承認後）

| カタログ | コピー先 |
|----------|----------|
| `catalog/js/features/<name>.js` | `{フロント}/src/js/features/<name>.js` |
| `catalog/js/modules/<name>.js` | `{フロント}/src/js/modules/<name>.js` |
| `catalog/js/utils/<path>` | `{フロント}/src/js/utils/<path>`（ディレクトリは丸ごと） |

- 既存ファイルがある場合は上書き前に差分を示し、承認を取る
- `features/project/` / `modules/project/` へは置かない（横断部品の正は直下）
- `scrollTriggerActiveClass` を採用するときは **`setUpScrollTrigger` もセットでコピー**する
- `videoHls` 採用時は同梱の `videoHls.md` も案内する（コピー先は任意。実装は `utils/videoHls.js`）

### 4. 依存・契約を確認

1. コピーしたファイル先頭の `import` を読む
2. 相対先（`utils/`・`setup/`・`config/`・`constans/` 等）が案件に無ければ、コア想定か不足かを報告する（不足ならコピー対象に含めるか、採用を止める）
3. CDN／npm（Chart.js・Lottie・SimpleBar・ScrollHint 等）が必要なら読込方法を案内する（勝手に `package.json` を増やさない。承認後のみ）
4. テンプレに `data-feature` / `data-module` / `data-action` と必要なら `has_*` を付与（命名は `project/javascript/naming.mdc`）

### 5. 初期化を足す

| 範囲 | 呼び出し先 |
|------|------------|
| 全画面共通 | `setup/project/initProject.js`（**`initCommon.js` には足さない**） |
| 当該ページのみ | 該当 `pages/*.js` の `startPage` |

既存の `init` API（`xxx.init({ root })` 等）に合わせる。詳細は [reference.md](reference.md)。

### 6. 完了報告

- コピーしたパス
- 足した初期化箇所
- CDN／依存の残作業（あれば）
- 使わなくなったら `@pre-launch-check` M-3-3 で削除確認する旨

## 禁止

- カタログパスを案件コードから直接 `import` する
- 全案件への一括コピー・自動同期
- ユーザー承認なしの上書き・`package.json` 変更
- コア常駐リストの無断削除（コア増減はカタログ `README.md` 更新とセット）

## 関連

- 配置原則: `project/javascript/coading.mdc`
- 公開前の未使用削除: `@pre-launch-check` M-3-3
- カタログ README / INDEX: `catalog/js/`
