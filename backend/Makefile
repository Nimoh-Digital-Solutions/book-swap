# ==============================================================================
# bookswap — Makefile
# ==============================================================================

# ── Configuration ─────────────────────────────────────────────────────────────

PROJECT_NAME = bookswap

# Virtual environment lives one level up (workspace/.venv) when created via `make new-app`.
# Override if your layout differs: make run VENV=venv
VENV         ?= ../.venv
VENV_PIP     := $(shell [ -f $(VENV)/bin/pip ]    && echo $(VENV)/bin/pip    || echo pip3)
VENV_PY      := $(shell [ -f $(VENV)/bin/python ] && echo $(VENV)/bin/python || echo python3)
MANAGE       := $(VENV_PY) manage.py
DOCKER_COMPOSE := docker compose --project-name $(PROJECT_NAME)

# Docker service names (match docker-compose.yml)
WEB_SERVICE  = web
DB_SERVICE   = db
REDIS_SERVICE = redis
CELERY_SERVICE = celery

# Colours
BLUE  = \033[34m
GREEN = \033[32m
YELLOW = \033[33m
RED   = \033[31m
NC    = \033[0m

.DEFAULT_GOAL := help

.PHONY: help \
        install install-dev \
        lint format test \
        migrations migrations-check migrate createsuperuser shell \
        run services start stop upgrade \
        dev dev-build dev-rebuild dev-up dev-up-attach dev-down \
        dev-restart dev-logs dev-logs-web dev-shell dev-clean \
        migrate-dev makemigrations-dev showmigrations-dev superuser-dev collectstatic-dev \
        test-dev check-dev fmt-dev lint-dev \
        prod prod-build prod-down \
        stag stag-build stag-down \
        network-create db-ensure \
        status clean

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo "$(BLUE)bookswap — Development Commands$(NC)"
	@echo "=================================================="
	@echo ""
	@echo "$(GREEN)🐍 Local (venv) Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^(run|start|services|stop|install|install-dev|lint|format|test|migrations|migrate|createsuperuser|shell|upgrade):.*?## / {printf "  $(YELLOW)%-28s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🐳 Docker Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^dev[a-zA-Z_-]*:.*?## / {printf "  $(YELLOW)%-28s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🔧 Docker DB / Quality:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^(migrate|makemigrations|showmigrations|superuser|collectstatic|test|check|fmt|lint)-dev:.*?## / {printf "  $(YELLOW)%-28s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)📊 Utilities:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^(status|clean):.*?## / {printf "  $(YELLOW)%-28s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Quick start (local):$(NC)"
	@echo "  1. make install-dev   # install deps"
	@echo "  2. make migrate       # apply migrations"
	@echo "  3. make start         # start services + dev server"
	@echo ""
	@echo "$(BLUE)Quick start (Docker):$(NC)"
	@echo "  1. make dev           # build + start everything"
	@echo "  2. make superuser-dev # create admin user"
	@echo "  3. make dev-logs      # follow logs"

# ── Setup ─────────────────────────────────────────────────────────────────────

install: ## Install production dependencies into venv
	$(VENV_PIP) install -r requirements.txt

install-dev: ## Install all dependencies (production + dev) into venv
	$(VENV_PIP) install -r requirements.txt -r requirements-dev.txt

# ── Code quality (local) ──────────────────────────────────────────────────────

lint: ## Run ruff linter
	ruff check .

format: ## Auto-fix formatting with ruff
	ruff check --fix . && ruff format .

test: ## Run test suite
	pytest

# ── Database (local) ──────────────────────────────────────────────────────────

migrations: ## Generate new migrations
	$(MANAGE) makemigrations

migrations-check: ## Fail if any model changes lack a migration (CI)
	$(MANAGE) makemigrations --check --dry-run

migrate: ## Apply all migrations
	$(MANAGE) migrate

createsuperuser: ## Create a Django superuser
	$(MANAGE) createsuperuser

shell: ## Open the Django shell
	$(MANAGE) shell

# ── Running the app (local) ───────────────────────────────────────────────────

run: ## Start the Django development server (services must already be running)
	$(MANAGE) runserver

services: ## Start Redis + Celery in the background via Docker Compose
	@echo "$(BLUE)⬆️  Starting Redis and Celery ...$(NC)"
	$(DOCKER_COMPOSE) up -d $(REDIS_SERVICE) $(CELERY_SERVICE)
	@echo "$(GREEN)✅ Services running. Use 'make run' to start the dev server.$(NC)"

start: services run ## Start background services then the dev server

stop: ## Stop all Docker Compose services
	@echo "$(BLUE)⬇️  Stopping services ...$(NC)"
	$(DOCKER_COMPOSE) down

# ── Package ───────────────────────────────────────────────────────────────────

upgrade: ## Upgrade nimoh-be-django-base to the latest published version
	@echo "$(BLUE)⬆️  Upgrading nimoh-be-django-base ...$(NC)"
	$(VENV_PIP) install --upgrade "nimoh-be-django-base[all]"
	@echo "$(GREEN)✅ Done. Run 'make migrate' if there are new migrations.$(NC)"

# ── Docker: dev environment ───────────────────────────────────────────────────

dev: dev-down dev-build dev-up ## Start complete Docker development environment
	@$(MAKE) migrate-dev
	@echo "$(GREEN)🚀 Development environment started!$(NC)"
	@echo "$(BLUE)Application : http://localhost:8070$(NC)"
	@echo "$(BLUE)Admin       : http://localhost:8070/admin/$(NC)"
	@echo "$(BLUE)API Docs    : http://localhost:8070/api/v1/schema/docs/$(NC)"
	@echo "$(BLUE)Health      : http://localhost:8070/api/v1/health/$(NC)"
	@echo ""
	@echo "$(YELLOW)Use 'make dev-logs' to follow logs$(NC)"
	@echo "$(YELLOW)Use 'make dev-shell' to open a shell$(NC)"

dev-build: ## Build Docker development images
	@echo "$(BLUE)🔨 Building images ...$(NC)"
	$(DOCKER_COMPOSE) build

dev-rebuild: ## Rebuild Docker images with no cache
	@echo "$(BLUE)🔨 Rebuilding images (no cache) ...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache

dev-up: ## Start all services in the background
	@echo "$(BLUE)⬆️  Starting services ...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Services started!$(NC)"
	@echo "$(YELLOW)⏳ Waiting for services to initialise ...$(NC)"
	@sleep 5
	@$(MAKE) status

dev-up-attach: ## Start all services with logs attached
	$(DOCKER_COMPOSE) up

dev-down: ## Stop all Docker services
	@echo "$(BLUE)⬇️  Stopping services ...$(NC)"
	$(DOCKER_COMPOSE) down

dev-restart: ## Restart all Docker services
	@echo "$(BLUE)🔄 Restarting services ...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✅ Restarted.$(NC)"

dev-restart-web: ## Restart only the web service
	@echo "$(BLUE)🔄 Restarting web service ...$(NC)"
	$(DOCKER_COMPOSE) restart $(WEB_SERVICE)
	@echo "$(GREEN)✅ Web service restarted.$(NC)"

dev-logs: ## Follow logs from all services
	$(DOCKER_COMPOSE) logs -f

dev-logs-web: ## Follow logs from the web service only
	$(DOCKER_COMPOSE) logs -f $(WEB_SERVICE)

dev-shell: ## Open a bash shell in the web container
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) /bin/bash

dev-clean: ## Remove containers and volumes
	@echo "$(BLUE)🧹 Cleaning Docker environment ...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans

# ── Docker: production environment ───────────────────────────────────────────

DOCKER_COMPOSE_PROD := docker compose --project-name $(PROJECT_NAME) -f docker-compose.prod.yml
DOCKER_COMPOSE_STAG := docker compose --project-name $(PROJECT_NAME) -f docker-compose.stag.yml

prod: prod-build ## Build and start the production environment
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)🚀 Production environment started!$(NC)"
	@echo "$(BLUE)Application : http://localhost:8070$(NC)"
	@echo "$(BLUE)Health      : http://localhost:8070/api/v1/health/$(NC)"

prod-build: ## Build the production Docker image
	@echo "$(BLUE)🔨 Building production image ...$(NC)"
	$(DOCKER_COMPOSE_PROD) build

prod-down: ## Stop the production environment
	$(DOCKER_COMPOSE_PROD) down

# ── Docker: staging environment ───────────────────────────────────────────────

stag: stag-build ## Build and start the staging environment
	$(DOCKER_COMPOSE_STAG) up -d
	@echo "$(GREEN)🚀 Staging environment started!$(NC)"
	@echo "$(BLUE)Application : http://localhost:8070$(NC)"
	@echo "$(BLUE)Health      : http://localhost:8070/api/v1/health/$(NC)"

stag-build: ## Build the staging Docker image
	@echo "$(BLUE)🔨 Building staging image ...$(NC)"
	$(DOCKER_COMPOSE_STAG) build

stag-down: ## Stop the staging environment
	$(DOCKER_COMPOSE_STAG) down

network-create: ## Create a shared Docker network for FE↔BE container wiring
	docker network create bookswap-network 2>/dev/null || true
	@echo "$(GREEN)✅ Network 'bookswap-network' ready. Reference it in both docker-compose files to link FE and BE.$(NC)"

# ── Docker: database ──────────────────────────────────────────────────────────

db-ensure: ## Ensure the PostgreSQL database exists (safe to run repeatedly)
	@createdb bookswap 2>/dev/null || true

migrate-dev: db-ensure ## Apply migrations inside Docker
	@echo "$(GREEN)🔄 Running migrations in Docker ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py migrate

makemigrations-dev: ## Create migrations inside Docker
	@echo "$(GREEN)📝 Creating migrations in Docker ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py makemigrations

showmigrations-dev: ## Show migration status inside Docker
	@echo "$(GREEN)📋 Migration status:$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py showmigrations

superuser-dev: ## Create a superuser inside Docker
	@echo "$(GREEN)👤 Creating superuser ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py createsuperuser

collectstatic-dev: ## Collect static files inside Docker
	@echo "$(GREEN)📦 Collecting static files ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py collectstatic --noinput

# ── Docker: quality ───────────────────────────────────────────────────────────

test-dev: ## Run tests inside Docker
	@echo "$(GREEN)🧪 Running tests in Docker ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) pytest --cov=apps --cov-report=html --cov-report=term-missing

check-dev: ## Run Django system checks inside Docker
	@echo "$(GREEN)✅ Running system checks ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) python manage.py check

fmt-dev: ## Format code inside Docker
	@echo "$(GREEN)🎨 Formatting code ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) ruff format .
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) ruff check --select I --fix .

lint-dev: ## Lint code inside Docker
	@echo "$(GREEN)🔍 Linting code ...$(NC)"
	$(DOCKER_COMPOSE) exec $(WEB_SERVICE) ruff check .

# ── Utilities ─────────────────────────────────────────────────────────────────

status: ## Show status of all Docker services
	@echo "$(BLUE)📊 Service status:$(NC)"
	$(DOCKER_COMPOSE) ps

clean: ## Remove containers, Python cache files
	@echo "$(YELLOW)🧹 Cleaning ...$(NC)"
	$(DOCKER_COMPOSE) down --remove-orphans
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf htmlcov/ .pytest_cache/ .mypy_cache/ .ruff_cache/
	@echo "$(GREEN)✅ Done.$(NC)"
