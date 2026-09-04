.PHONY: help up down restart build build-docker rebuild logs shell start watch build-scss build-js build-convert-images build-scss-index meta-convert-images watch-scss watch-js watch-convert-images watch-scss-index serve format format-check lint lint-fix clean clean-all clean-docker install wp-wps-hide-login wp-rewrite-flush

# デフォルトターゲット
.DEFAULT_GOAL := help

# ビルド成果物（削除対象）
DIST_DIR := resources/htdocs/dist

# $(COMPOSE) コマンド（明示的に.env を渡す）
COMPOSE := docker compose --env-file .env

# .envファイルから環境変数を読み込む
ifneq (,$(wildcard .env))
    include .env
    export
endif

# $(COMPOSE)サービス名（環境変数から取得、未設定の場合はfrontendをデフォルト値として使用）
FRONT_CONTAINER := $(or $(FRONT_CONTAINER),frontend)
WP_CONTAINER := $(or $(WP_CONTAINER),frontend)

# プロジェクト名（環境変数から取得、未設定の場合はsample_hpをデフォルト値として使用）
PROJECT_NAME := $(or $(PROJECT_NAME),sample_hp)

# コンテナ名（環境変数から構築）
FRONT_CONTAINER_NAME := $(PROJECT_NAME)_$(FRONT_CONTAINER)
WP_CONTAINER_NAME := $(PROJECT_NAME)_$(WP_CONTAINER)

# wp-cliスクリプトのディレクトリ
WP_CLI_DIR := /var/www/scripts/wp

##@ ヘルプ

help: ## このヘルプメッセージを表示
	@echo "利用可能なコマンド:"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker

init: ## 初回セットアップ（.env 作成・HOST_UID/HOST_GID 反映・ビルド・起動・pre-commit フック設置）
	@if [ ! -f .env ] && [ -f .env.example ]; then \
		echo "🟡 .env が見つかりません。.env.example からコピーします..."; \
		cp .env.example .env; \
		echo "✅ .env を作成しました"; \
	fi
	@if [ ! -f docker-compose.override.yml ] && [ -f docker-compose.override.yml.example ]; then \
		printf "🍎 macユーザーですか? docker-compose.override.yml を作成します... [y(yes)/n(no)]: "; \
		read answer; \
		if [ "$$answer" = "yes" ] || [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
			cp docker-compose.override.yml.example docker-compose.override.yml; \
			echo "✅ docker-compose.override.yml を作成しました"; \
		else \
			echo "⏭️ docker-compose.override.yml の作成をスキップしました"; \
		fi; \
	fi
	@sh scripts/env/update-env-uid-gid.sh 2>/dev/null || true
	@echo "🟢 Docker イメージをビルドします..."
	$(COMPOSE) build
	@echo "🟢 コンテナを起動します..."
	$(COMPOSE) up -d
	@echo "🟢 pre-commit フックを .git/hooks にコピーします..."
	@if [ ! -d .git/hooks ]; then \
		echo "❌ .git/hooks がありません。git 管理下で実行してください。"; \
		exit 1; \
	fi
	@cp -f pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ 初期セットアップ完了: pre-commit フック設置済み"
	@echo "🟢 WordPress をインストールします..."
	@$(MAKE) wp-install

build-docker: ## Docker イメージをビルド
	$(COMPOSE) build

up: ## Dockerコンテナを起動
	$(COMPOSE) up -d

down: ## Dockerコンテナを停止
	$(COMPOSE) down

restart: ## Dockerコンテナを再起動
	$(COMPOSE) restart

rebuild: ## Dockerイメージを再ビルド
	$(COMPOSE) build --no-cache

logs: ## Dockerコンテナのログを表示
	docker logs -f $(WP_CONTAINER_NAME)

shell: ## Dockerコンテナ内のシェルに接続
	docker exec -it $(WP_CONTAINER_NAME) bash

##@ 開発

dev: up ## 開発環境を起動（ビルド + 監視 + サーバー）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run dev"

build: up ## ビルドを実行（SCSS + JS + 画像変換）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run build"

watch: up ## ファイル監視を開始（SCSS + JS + 画像変換）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run watch"

build-scss: up ## SCSSのみビルド
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run build:scss"

build-js: up ## JSのみビルド
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run build:js"

build-convert-images: up ## 画像変換のみビルド
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run build:convert-images"

build-scss-index: up ## SCSSインデックスのみビルド
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run build:scss-index"

meta-convert-images: up ## 画像変換のメタファイルを生成
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run meta:convert-images"

watch-scss: up ## SCSSの監視を開始
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run watch:scss"

watch-js: up ## JSの監視を開始
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run watch:js"

watch-convert-images: up ## 画像変換の監視を開始
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run watch:convert-images"

watch-scss-index: up ## SCSSインデックスの監視を開始
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run watch:scss-index"

serve: up ## ブラウザシンクサーバーを起動
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run serve"

format: up ## PrettierでJS/SCSSを整形
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run format"

format-check: up ## Prettier(JS/SCSS)の整形差分を確認
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run format:check"

lint: up ## ESLintでJSをチェック
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run lint"

lint-fix: up ## ESLintでJSを自動修正
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm run lint:fix"


##@ その他

install: up ## 依存関係をインストール
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(FRONT_CONTAINER_NAME) bash -c "npm install"

clean: ## ビルド成果物を削除
	@echo "ビルド成果物を削除中..."
	@rm -rf $(DIST_DIR)
	@echo "✅ クリーンアップ完了"

clean-docker: ## Dockerコンテナ、イメージ、ボリュームを完全削除
	@echo "⚠️  Dockerコンテナ、イメージ、ボリュームを完全に削除します..."
	$(COMPOSE) down --rmi all --volumes --remove-orphans
	@echo "✅ Dockerの完全削除が完了しました"

clean-all: clean-docker clean ## コンテナ、イメージ、ボリューム、ビルド成果物をすべて削除
	@echo "✅ すべてのクリーンアップ完了"


##@ wordpress
wp-install: up ## wordpress install
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-install.sh"

wp-update-admin-local: up ## WordPress本体の管理者メールをLOCAL用に更新
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-update-admin-local.sh"

wp-update-admin-production: up ## WordPress本体の管理者メールをPRODUCTION用に更新
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-update-admin-production.sh"

wp-update-user-local: up ## LOCAL用管理者ユーザーを設定（PRODUCTION用ユーザーは削除・引き継ぎ）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-update-user-local.sh"

wp-update-user-production: up ## PRODUCTION用管理者ユーザーを設定（LOCAL用ユーザーは削除・引き継ぎ）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-update-user-production.sh"

wp-create-pages: up ## wordpress create pages
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-create-pages.sh"

wp-create-posts: up ## ターム・テンプレート生成 + 開発用 JSON インポート (WP_IMPORT_ENV=dev)
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-create-posts.sh"

wp-import-posts: up ## JSON / CSV からカスタム投稿をインポート (WP_IMPORT_POSTS_ARGS=works WP_IMPORT_ENV=dev)
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it -e WP_IMPORT_ENV="$(WP_IMPORT_ENV)" $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-import-posts.sh $(WP_IMPORT_POSTS_ARGS)"

wp-plugin: up ## wordpress plugin
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-plugin.sh"

wp-remove-posts: up ## wordpress remove posts (WP_REMOVE_POSTS_ARGS=news works で post_type 指定)
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-remove-posts.sh $(WP_REMOVE_POSTS_ARGS)"

wp-remove-php-files: up ## wordpress remove php files
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-remove-php-files.sh"

wp-chmod: up ## wordpress remove php files
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-chmod.sh"

wp-rewrite-flush: up ## パーマリンク（リライトルール）と .htaccess を再生成
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-rewrite-flush.sh"

wp-config-smtp: up ## .env の WPMS_* を wp-config.php に書き込み（本番は手動アップロード）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-config-smtp.sh"

wp-wps-hide-login: up ## .env の WHL_* を WPS Hide Login に反映
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec -it $(WP_CONTAINER_NAME) bash -c "bash ${WP_CLI_DIR}/wp-wps-hide-login.sh"

php-cs-fixer-fix: up ## PHP CS Fixerで自動整形
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec $(WP_CONTAINER_NAME) bash -lc "php-cs-fixer fix --config=/var/www/html/php-cs-fixer.dist.php"

php-cs-fixer-check: up ## PHP CS Fixerで差分確認（dry-run）
	@echo "コンテナ起動を待機中..."
	@sleep 2
	docker exec $(WP_CONTAINER_NAME) bash -lc "php-cs-fixer fix --config=/var/www/html/php-cs-fixer.dist.php --dry-run"