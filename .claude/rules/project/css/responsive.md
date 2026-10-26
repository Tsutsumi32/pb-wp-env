# レスポンシブ記述ルール

SCSSレスポンシブ。`$media-query-strategy`、`media()`、メディアクエリは各セレクタ内に記述する。

レスポンシブ実装では、変数ファイルの `$media-query-strategy` を確認し、`sp-first` か `pc-first` かに合わせてスタイルの基準方向を決める。

## 基本方針

- `$media-query-strategy: 'sp-first'`: SPのスタイルをデフォルトとして記述し、PC方向へ上書きする場合にメディアクエリを使用する。
- `$media-query-strategy: 'pc-first'`: PCのスタイルをデフォルトとして記述し、SP方向へ上書きする場合にメディアクエリを使用する。

現在のプロジェクトがどちらの方針かは、変数ファイルの `$media-query-strategy` を確認する。

## メディアクエリ

メディアクエリは `media(get-breakpoint-key('key'))` を使用する。`key` は `$breakpoint-keys` に定義されている文字列と一致させる。

```scss
.bl_card {
  width: s(320);

  @include media(get-breakpoint-key('sp')) {
    width: s(280);
  }
}
```

## メディアクエリの記述位置

レスポンシブで変わるプロパティは、**そのプロパティを持つセレクタの中** に `@include media(...)` を書く。ブロックルート末尾にメディアクエリをまとめ、子セレクタを一括上書きする書き方は使わない。

```scss
// NG: ルート末尾で子セレクタをまとめて上書き
.header {
  height: s(72);

  &_inner {
    padding-inline: s(24);
  }

  @include media(get-breakpoint-key('sp')) {
    height: s(60);

    &_inner {
      padding-inline: s(16);
    }
  }
}

// OK: 各セレクタ内に記載
.header {
  height: s(72);

  @include media(get-breakpoint-key('sp')) {
    height: s(60);
  }

  &_inner {
    padding-inline: s(24);

    @include media(get-breakpoint-key('sp')) {
      padding-inline: s(16);
    }
  }
}
```

- モディファイア（`&.is_active` 等）も、変化する子セレクタごとにメディアクエリを置く
- SP 専用要素（`display: none` → SP で表示）も、該当セレクタ内で PC デフォルトと SP 上書きを並べる

## 注意点

- ブレイクポイントのキーを直接文字列でばらまかず、`get-breakpoint-key()` を通す。
- `sp-first` と `pc-first` では、メディアクエリで上書きする方向が逆になるため、既存の設定を確認してから実装する。
- `$breakpoint-keys` や `$breakpoints` を変更する場合は、既存の `media()` 利用箇所に影響がないか確認する。
