# JavaScriptコーディングルール

JavaScript実装。pages画面JS手順、DOM参照（class/id禁止・data-*必須）、createPage、module/feature、イベント委譲を扱う。

構成: Page実装（手順・ファイル構成）→ デバッグ → module/feature → 配置判断（**既存流用**・**全画面共通初期化の登録先**）→ data属性の定数化 → DOM参照 → 初期化・イベント → body状態クラス。命名は `.claude/rules/project/javascript/naming.md` を参照する。

## Pageの実装

`pages/*.js` は当該ページ専用のエントリ。構成・コメント・機能単位の記述順は `.claude/rules/frontend-base/javascript.md` に従い、既存の `src/js/_template.js` を雛形とする。

### 画面JS実装時の手順（必須）

HTML/PHP が class のみでも、**class / id で DOM を取らない**。次の順で進める（「既存マークアップに合わせる」は禁止理由にならない）。

1. 取得・操作・イベント対象を洗い出す
2. **既存の feature / module / `has_`・`animations/` を確認**し、使えるものは流用する（下記「既存の流用」）
3. HTML/PHP へ `data-*`（必要なら `has_`）を付与する（ページ固有は `data-xxxx`、クリック等は `data-action`、再利用UIは `data-module` / `data-feature`。命名は `naming.md`）
4. JS で属性名・セレクタを定数化し、その定数だけで取得・委譲する（流用時は既存の初期化呼び出し＋契約どおりの属性／class）

画面JSの依頼には、テンプレートへの `data-*` 追記が作業範囲に含まれる。

### ファイル構成

1. `import` 文
2. ファイル説明コメント
3. 関連機能ごとのまとまり（各機能内は **定数 → 変数 → メソッド → 初期化**）
4. **ライフサイクル**（ファイル末尾。`startPage` と `createPage` の起動）

機能単位のコードをファイル全体に分散させず、ライフサイクル以外の処理は機能ごとに上記の順でまとめる。コメント階層・JSDoc の付け方も `.claude/rules/frontend-base/javascript.md`「コメント階層」「JSDocコメント」を参照する。

### 起動

ページ全体の初期化は、必ずファイル末尾のライフサイクル節で `createPage` を使って行う。各機能の `init*` は `startPage` 内から呼び出し、DOM 準備後の起動タイミングをライフサイクル節に集約する。

```js
import { createPage } from '../lifecycle/createPage.js';

// ----------------------------------------------------------
// 関連機能1 - 例: トップ MV
// ----------------------------------------------------------
/** 関連機能1で使用する定数 */
const MV_ATTR = 'data-mv';

/** 関連機能1で使用する変数 */
let mvRoot = null;

/**
 * MV の表示状態を更新
 * @returns {void}
 */
const updateMv = () => {
  // ...
};

/**
 * 関連機能1を初期化
 * @returns {void}
 */
const initMv = () => {
  mvRoot = document.querySelector(`[${MV_ATTR}]`);
  // イベント登録など
};

// ----------------------------------------------------------
// ライフサイクル
// ----------------------------------------------------------
/**
 * ページ固有処理を開始
 * @returns {void}
 */
const startPage = () => {
  initMv();
};

createPage(startPage);
```

## デバッグ用コンソール

デバッグ用の `console.log`、`console.warn`、`console.info` などは、必ずグローバル定数 `MODE` が `develop` の場合のみ出力する。確認用のconsoleを条件なしで残さない。

```js
import { MODE } from '../constans/global.js';

if (MODE === 'develop') {
  console.log('debug message');
}
```

## moduleとfeatureの責務

- `module`: DOMと一体となる独立したUI部品。モジュールのDOM起点は原則 `data-module` で識別する。
- `feature`: DOMに機能を追加する処理。独立UIではなく、決まった `data-feature` などでどこからでも適用できる機能として扱う。

## JavaScriptの配置判断

`src/js/` 配下は、再利用範囲に応じて次の階層に分ける。

| 配置先 | 再利用範囲 | 例 |
|--------|------------|-----|
| `features/` / `modules/` | プロジェクト横断（テーマ・案件をまたいで使い回す） | `scrollObserver.js`, `swiper.js` |
| `features/project/` / `modules/project/` | 当該プロジェクト内のみ（複数ページで共通利用） | `modules/project/joinSlider.js`（PHP 部品向け） |
| `pages/*.js` | 当該ページのみ | トップ MV の初回アニメーション |

- `features/` / `modules/` 直下には、**プロジェクト横断で再利用できる処理のみ**を置く。ページ固有の分岐・文言・個別要件は本体へ直接埋め込まず、呼び出し側から設定を渡して拡張できる設計にする。
- **1画面だけで完結する処理**は、その画面の `pages/*.js` 内に収める。他ページから import しないことを前提とする。
- 当該プロジェクト内の複数ページで使うが横断再利用にはしない処理は、`features/project/` または `modules/project/` に置く。UI部品なら `modules/project/`、DOM へ機能を付与する処理なら `features/project/` を使い分ける。
- **プロジェクト共通の PHP 部品に紐づく JS** は、複数ページから `require` される想定で `modules/project/` に置く。当該ページだけで完結する場合は `pages/*.js` に直接書く。

### 全画面共通初期化の登録先（`initCommon` / `initProject`）

`src/js/setup/initCommon.js` と `src/js/setup/project/initProject.js` は役割が異なる。**当該プロジェクトで共通に入れる処理の初期化呼び出しは、`initCommon.js` ではなく `initProject.js` に書く。**

- `setup/initCommon.js`: **プロジェクト横断の共通基盤**。案件が変わってもほぼ変更しない前提のファイル。ここに置いてよいのは `features/` / `modules/` 直下（プロジェクト横断で再利用できる処理）の初期化のみ
- `setup/project/initProject.js`: **当該プロジェクト固有の全画面共通初期化**。`initCommon` の後に実行され、他案件へ移植する際は中身を差し替える前提のファイル
- 案件固有の機能・当該プロジェクト内の複数ページで使う機能（`features/project/` / `modules/project/` に置く処理、ヘッダーなど画面共通コンポーネントの初期化など）は `initCommon.js` に追記せず、**`initProject.js` に追記する**
- `initCommon.js` への追記が妥当なのは、その処理自体を `features/` / `modules/` 直下（プロジェクト横断で再利用可能な処理）として新規追加した場合のみ

```js
// NG: プロジェクト固有の初期化を initCommon.js に追加
// src/js/setup/initCommon.js
import { header } from '../modules/header.js';

export async function initCommon() {
  // ...
  header.init({ lockScroll: true }); // 当該プロジェクト固有の処理
}
```

```js
// OK: initProject.js に追加
// src/js/setup/project/initProject.js
import { header } from '../../modules/header.js';

export function initProject() {
  header.init({ lockScroll: true });
}
```

### 既存の流用（必須）

インタラクション・JS プラグイン・スクロール連動などを実装するとき、**新規に同等処理を書かない**。先に既存を確認し、合うものは初期化と契約（`data-*` / `has_`）で使う。

1. **確認先**: `src/js/features/`・`src/js/modules/`（および `*/project/`）、既存の `pages/*.js` の初期化例、`src/scss/animations/`（`has_` 契約）
2. **流用できるとき**: 既存モジュール／feature の初期化を呼ぶ。テンプレ側は既存の `data-feature` / `data-module` と対応する `has_*` を付与する
3. **例**:
   - Swiper → 既存 `modules/swiper.js` の初期化（正本: `.claude/rules/project/javascript/swiper.md`）。自前で Swiper を二重実装しない
   - スクロールでフェードイン等 → 既存 `scrollObserver`（等）の初期化 ＋ 対応する `has_observer_*`（または既存バリエーション）。動き用 SCSS は `animations/` の契約を使う
4. **無いときだけ新規**: 配置は上記表どおり。新規 feature／module なら `has_`／`data-*` 契約も合わせて定義する

## data属性の定数化（page / module / feature）

JavaScript から参照する `data-*` 属性名・`data-action` の値は、**ファイル先頭（import の直後）に定数として一覧化**する。`pages/*.js` のページ固有属性も対象。処理の途中で文字列リテラルを書かず、ファイルを開いたときに契約が一目で分かるようにする。

- セクション見出しは `// data 属性（参照するものは定数で一覧化）` を使う
- `DATA_ATTR.FEATURE` / `DATA_ATTR.MODULE` / `DATA_ATTR.ACTION` は `global.js` から参照し、重複定義しない
- feature / module 専用属性は `FEATURE_ATTR_NAME`（ケバブケース）と `FEATURE_DATA_PREFIX` を定義し、`ATTR_xxxx` を組み立てる
- ページ固有属性も同様に `ATTR_xxxx` / `SELECTOR_xxxx` で定数化する
- セレクタが必要なら `SELECTOR_xxxx` も同セクションにまとめる
- `data-action` の値は `ACTION_xxxx` として同セクションに定義する

```js
// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
const FEATURE_NAME = 'scrollObserver';
const FEATURE_ATTR_NAME = 'scroll-observer';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

const ATTR_MODE = `${FEATURE_DATA_PREFIX}-mode`;
const ATTR_ROOT_MARGIN = `${FEATURE_DATA_PREFIX}-root-margin`;
const ATTR_THRESHOLD = `${FEATURE_DATA_PREFIX}-threshold`;

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;
```

属性の命名規則（ケバブケース変換など）は `naming.md` を参照する。

## DOM参照

JavaScript から要素を特定・取得するときは、**class 名・`id` をセレクタに使わない**。要素の識別契約は JavaScript 用 `data-*`（`data-css-*` を除く）に統一する。

対象例: `querySelector` / `querySelectorAll` / `closest` / `getElementById` / `getElementsByClassName` など。

- **禁止**: `.el_btn` / `.un_mv` / `#modal` など、class・id による DOM 取得（PRECSS の `el_` / `bl_` / `un_` も例外ではない）
- **禁止**: 既存 HTML が class のみであることを理由に class セレクタを使うこと（先に `data-*` を付与する）
- **禁止**: JS から参照する目的だけで class や id を HTML に付与すること（識別用の class/id は作らず、対応する `data-*` を付与する）
- **class の用途**: スタイル（`el_*` / `bl_*` / `un_*` 等）と状態（`is_*` 等）のみ。取得・委譲・初期化の起点には使わない
- **`id` の用途**: ページ内リンクのアンカー等、HTML 由来の用途に限り HTML 側で付与してよい。JavaScript からの取得・特定には使わない
- 処理の途中で `[data-…]` の文字列リテラルを書かず、ファイル先頭の定数（`ATTR_xxxx` / `SELECTOR_xxxx`）を使う
- サードパーティが生成する DOM（例: Swiper の `.swiper-wrapper`）など、自プロジェクトが制御できない要素のみ例外とする

```js
// NG: class / id で取得
root.querySelector('.el_modal');
root.querySelector('.un_mv');
document.getElementById('contact-form');

// OK: data-* で取得
root.querySelectorAll(SELECTOR_MODULE);
el.closest(`[${ATTR_PANEL}]`);
```

実装後の自己確認: class / id セレクタが残っていないか、対応する `data-*` が HTML/PHP にあるか。

## 初期化設計

module / feature を実装する場合は、同一画面に複数の該当要素が存在しても、それぞれ個別の設定を渡せる設計にする。`root` を受け取り、その配下の対象要素だけを初期化できる形を基本とする。

```js
/**
 * moduleを初期化
 * @param {{ root?: Document|Element }} [ctx]
 * @param {object} [options]
 * @returns {void}
 */
const init = (ctx = {}, options = {}) => {
  const { root = document } = ctx;
  const elements = root.querySelectorAll('[data-module="sample"]');

  elements.forEach((el) => {
    // optionsを使って要素ごとに初期化
  });
};
```

## イベント設計

可能であればイベント委譲を活用する。クリックなどの委譲しやすいイベントでは `delegate.js` を利用し、イベントトリガーは `data-action` に統一する。

```js
import { delegate } from '../utils/delegate.js';

delegate(document, 'click', {
  'modal.open': (event, el) => {
    // open処理
  },
});
```

イベント委譲が適さないイベントや、要素ごとの状態管理が必要な場合は、理由が分かる設計にして過剰な個別イベント登録を避ける。

## body状態クラスの運用

body に付与する状態クラスは、JavaScriptとCSSの契約として扱い、`src/js/constans/global.js` の `STATE_CLASSES` から参照する。文字列リテラルの直接記述は避ける。

- `noJs`: javascript無効環境でbody内に本クラスをもつdivを配置する。必要に応じて、js無効の場合のスタイルを適用するために使用する(scssで専用の判定mixinあり)
- `is_alreadyVisit`: 初回訪問判定。共通レイアウトのインラインスクリプトで最速付与する（訪問セッション判定）。
- `is_domLoaded`: DOM 構築完了時に付与する（`DOMContentLoaded` 相当）。
- `is_windowLoaded`: 画像・CSSを含む読み込み完了時に付与する（`window.load` 相当）。
- `is_pluginReady`: 各プラグイン初期化完了後に対象要素へ付与する。
- `page_xxxx`: ページ識別クラス。テンプレート側で `page_` 接頭辞を付与する。
