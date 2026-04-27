.DEFAULT_GOAL := start

# ── Development ──────────────────────────────────────────────────────────────

start: ## Start both BE and FE servers
	@echo "Starting backend..."
	@cd backend && make dev &
	@echo "Starting frontend..."
	@cd frontend && make docker-dev
	@echo "All services started."

dev-backend: ## Start backend only
	@cd backend && make dev

dev-frontend: ## Start frontend only (Vite dev server)
	@cd frontend && yarn dev

# ── Quality ──────────────────────────────────────────────────────────────────

check-backend: ## Run backend lint + tests
	@cd backend && ruff check . && ruff format --check . && pytest --cov

check-frontend: ## Run frontend type-check + lint + tests
	@cd frontend && yarn type-check && yarn lint && yarn stylelint && yarn test:run --coverage

check-shared: ## Run shared package tests
	@cd packages/shared && npm test

check: check-backend check-frontend check-shared ## Run all checks

# ── Install ──────────────────────────────────────────────────────────────────

install: ## Install all dependencies
	@cd packages/shared && npm install
	@cd frontend && yarn install
	@cd backend && pip install -r requirements.txt

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
