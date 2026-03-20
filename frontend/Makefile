# =============================================================================
# Makefile — frontend-base-template
# =============================================================================
# Usage:
#   make              → show this help
#   make dev          → start Vite dev server (local)
#   make docker-dev   → start dev server inside Docker with hot-reload
#   make docker-prod  → build & serve production build via nginx on :8080
#
# All targets are phony (no file artifacts with these names).
# =============================================================================

PM        ?= yarn          # override: make dev PM=npm
DC        ?= docker compose # override: make docker-dev DC="docker-compose"
APP_NAME  := $(strip $(shell node -e "process.stdout.write(require('./package.json').name)" 2>/dev/null || echo "app"))
export APP_NAME

.DEFAULT_GOAL := help

.PHONY: help \
        install \
        dev preview build build-analyze \
        type-check lint lint-fix stylelint stylelint-fix format check check-fix \
        test test-ui test-run test-coverage \
        docker-dev docker-prod docker-stop docker-clean docker-logs docker-shell \
        packages-build packages-typecheck \
        changeset changeset-version changeset-publish \
        update upgrade \
        setup setup-pwa setup-husky setup-docker setup-testing \
        clean

# ─── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "  $(APP_NAME)"
	@echo ""
	@echo "  \033[1mLocal dev\033[0m"
	@grep -E '^(dev|preview|build|install)[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mDocker\033[0m"
	@grep -E '^docker[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mCode quality\033[0m"
	@grep -E '^(type-check|lint|stylelint|format|check)[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mTests\033[0m"
	@grep -E '^test[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mPackages (monorepo)\033[0m"
	@grep -E '^packages[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mRelease\033[0m"
	@grep -E '^changeset[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mDependencies\033[0m"
	@grep -E '^(update|upgrade)[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""
	@echo "  \033[1mSetup / misc\033[0m"
	@grep -E '^(setup|clean)[^:]*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*##"}{printf "    \033[36m%-24s\033[0m %s\n",$$1,$$2}'
	@echo ""

# ─── Local dev ────────────────────────────────────────────────────────────────

install: ## Install all dependencies
	$(PM) install

dev: ## Start Vite dev server (localhost:3000)
	$(PM) dev

preview: ## Preview the production build locally (requires make build first)
	$(PM) preview

build: ## Build for production → dist/
	$(PM) build

build-analyze: ## Build with bundle analyser → dist/stats.html
	$(PM) build:analyze

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-dev: ## Start dev server in Docker with hot-reload (localhost:3000)
	@docker rm -f $(APP_NAME)-fe-dev 2>/dev/null || true
	$(DC) up -d app
	@echo "Dev server running at http://localhost:3000 — use 'make docker-logs' to tail logs"

docker-prod: ## Build & serve production image via nginx (localhost:8080)
	$(DC) up --build -d app-prod
	@echo "Production build running at http://localhost:8080 — use 'make docker-logs' to tail logs"

docker-stop: ## Stop all running containers for this project
	$(DC) down

docker-clean: ## Stop containers AND remove volumes (clears yarn cache, node_modules)
	$(DC) down -v --remove-orphans

docker-logs: ## Tail logs for the dev container
	$(DC) logs -f app

docker-shell: ## Open a shell inside the running dev container
	$(DC) exec app sh

docker-build-image: ## Build the production Docker image without starting it
	$(DC) build app-prod
docker-stack: ## Build & start the full production stack: FE + backend + Redis (requires backend service uncommented in docker-compose.yml)
	@docker rm -f $(APP_NAME)-fe-prod 2>/dev/null || true
	$(DC) up --build app-prod backend redis

be-health: ## Ping the backend health endpoint and print the result
	@curl -sf http://localhost:8000/api/v1/health/ \
	  && echo "✓ Backend healthy" \
	  || echo "✗ Backend not reachable — is it running on port 8000?"
# ─── Code quality ─────────────────────────────────────────────────────────────

type-check: ## Run TypeScript type-check (no emit)
	$(PM) type-check

lint: ## Lint src/ with ESLint
	$(PM) lint

lint-fix: ## Lint and auto-fix src/ with ESLint
	$(PM) lint:fix

stylelint: ## Lint SCSS files
	$(PM) stylelint

stylelint-fix: ## Lint and auto-fix SCSS files
	$(PM) stylelint:fix

format: ## Format all files with Prettier
	$(PM) format

check: ## Full quality gate: audit + type-check + lint + stylelint + tests
	$(PM) check

check-fix: ## Auto-fix lint, stylelint and format in one pass
	$(PM) check:fix

# ─── Tests ────────────────────────────────────────────────────────────────────

test: ## Run tests in watch mode (Vitest)
	$(PM) test

test-ui: ## Open Vitest UI in the browser
	$(PM) test:ui

test-run: ## Run tests once (CI mode)
	$(PM) test:run

test-coverage: ## Run tests with V8 coverage report
	$(PM) test:coverage

# ─── Packages (monorepo) ──────────────────────────────────────────────────────

packages-build: ## Build all workspace packages (tast-utils → tast-hooks → tast-ui → create-tast-app)
	$(PM) packages:build

packages-typecheck: ## Type-check all workspace packages
	$(PM) packages:typecheck

# ─── Release (Changesets) ─────────────────────────────────────────────────────

changeset: ## Create a new changeset (interactive)
	$(PM) changeset

changeset-version: ## Apply pending changesets → bump versions + update CHANGELOGs
	$(PM) changeset:version

changeset-publish: ## Build all packages then publish to npm registry
	$(PM) changeset:publish

# ─── Dependencies ─────────────────────────────────────────────────────────────

update: ## Upgrade @nimoh-digital-solutions/* packages to latest compatible versions
	$(PM) upgrade @nimoh-digital-solutions/tast-ui \
	              @nimoh-digital-solutions/tast-hooks \
	              @nimoh-digital-solutions/tast-utils \
	              @nimoh-digital-solutions/tast-styles \
	              @nimoh-digital-solutions/eslint-config \
	              @nimoh-digital-solutions/stylelint-config \
	              @nimoh-digital-solutions/tsconfig

upgrade: ## Interactively upgrade ALL dependencies (picks versions)
	$(PM) upgrade-interactive --latest

# ─── Setup ────────────────────────────────────────────────────────────────────

setup: ## Run the interactive project setup script
	node scripts/setup.js

setup-pwa: ## Add PWA support to this project
	node scripts/setup-pwa.js

setup-husky: ## Add Husky git hooks to this project
	node scripts/setup-husky.js

setup-docker: ## Add Docker configuration to this project
	node scripts/setup-docker.js

setup-testing: ## Add Vitest testing infrastructure to this project
	node scripts/setup-testing.js

# ─── Misc ─────────────────────────────────────────────────────────────────────

clean: ## Remove dist/, node_modules/, and lockfile for a completely fresh install
	rm -rf dist node_modules yarn.lock package-lock.json
	@echo "Run 'make install' to reinstall dependencies."
