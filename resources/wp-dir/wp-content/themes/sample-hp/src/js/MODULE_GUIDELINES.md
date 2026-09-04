
## 必須事項

### 1. 要素の存在チェック
すべてのモジュール関数では、**必ず要素の存在チェックを行ってください**。

```javascript
export function initHeader() {
  // ✅ 必須: メイン要素の存在チェック
  const header = document.querySelector('.js-header');
  if (!header) {
    console.warn('ヘッダー要素が見つかりません。');
    return;
  }

  // ✅ 必須: サブ要素の存在チェック
  const menuBtn = header.querySelector('.js-header-btn');
  if (!menuBtn) {
    console.warn('メニューボタンが見つかりません。');
    return;
  }

  // 処理続行...
}
```

### 2. JSDocコメント
必要な要素を`@requires`で明記してください。

```javascript
/**
 * ヘッダー初期化処理
 * 
 * @requires .js-header - ヘッダー要素
 * @requires .js-header-btn - メニューボタン
 * @requires .js-header-menu - メニュー要素
 */
export function initHeader() {
  // ...
}
```

## チェックリスト

新しいモジュールを作成する際は以下を確認してください：

- [ ] メイン要素の存在チェック
- [ ] サブ要素の存在チェック
- [ ] JSDocコメントの記述
- [ ] エラーメッセージの適切な設定
- [ ] 早期リターン（`return`）の実装

## テンプレート

`templates/moduleTemplate.js`を参考にしてください。
