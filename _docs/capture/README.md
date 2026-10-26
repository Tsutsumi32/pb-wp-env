# 画面キャプチャコマンド

このディレクトリの PNG を撮り直すときのコマンド一覧です。
`capture-config.js` / `flows/` から自動生成しています。手編集しないでください。

前提:
- `make dev` で Browser Sync 起動済み（`make up` だけではポートは開きません）
- Playwright は `host.docker.internal` + `.env` の `WP_CHAGE_PORT` 経由でホストの開発サーバへ接続します
- HTML 内の `localhost` 向け CSS/JS URL は自動でリライトされます（`CAPTURE_PUBLIC_ORIGIN`）
- 別 URL を使うときは `CAPTURE_BASE_URL=` で上書き（例: `http://host.docker.internal:8000`）

## 全画面

既存 PNG はスキップされます。上書きするときは `CAPTURE_FORCE=1`。

```bash
make capture-all
make capture-all CAPTURE_FORCE=1
```

特定ジョブだけ（ファイル名の slug）:

```bash
make capture-all CAPTURE_SLUG={slug} CAPTURE_FORCE=1
```

## ページごと

| 保存ファイル | コマンド |
|--------------|----------|
| `capture-top.png` | `make capture-page CAPTURE_PATH=/ CAPTURE_SLUG=top` |
| `capture-jobs.png` | `make capture-page CAPTURE_PATH=/jobs/ CAPTURE_SLUG=jobs` |
| `capture-interview.png` | `make capture-page CAPTURE_PATH=/interview/ CAPTURE_SLUG=interview` |

コピペ用:

```bash
make capture-page CAPTURE_PATH=/ CAPTURE_SLUG=top
make capture-page CAPTURE_PATH=/jobs/ CAPTURE_SLUG=jobs
make capture-page CAPTURE_PATH=/interview/ CAPTURE_SLUG=interview

```

## コンテナ

```bash
make capture-page-up
make capture-page-down
```
