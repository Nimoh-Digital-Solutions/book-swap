# Contributing to BookSwap

Internal team guide for contributing to the BookSwap codebase.

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | CI-gated trunk — all PRs target here |
| `staging` | Push triggers staging deploy to Pi5 |
| `production` | Push triggers production deploy to Pi5 |
| `feat/*`, `fix/*`, `chore/*` | Feature/fix branches off `main` |

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). The frontend enforces this via Commitlint + Husky.

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

**Scopes** (optional but encouraged): `backend`, `frontend`, `mobile`, `shared`, `ci`, `infra`, or app-specific like `exchanges`, `auth`, `books`, `messaging`

**Examples:**

```
feat(exchanges): add counter-propose flow with book picker
fix(backend): prevent duplicate exchange requests for same book pair
chore(ci): add bundle size gate to frontend build
docs: update root README with architecture diagram
```

## Pull Request Process

1. Create a branch from `main`: `git checkout -b feat/my-feature`
2. Make your changes — keep PRs focused on a single concern
3. Run the checks for every layer you touched (see below)
4. Push and open a PR against `main`
5. PR title follows Conventional Commits format
6. At least one approval required before merge
7. Squash-merge to keep history clean

## Pre-PR Checklist

Run checks for every layer you changed before pushing:

### Backend

```bash
cd backend
ruff check .                           # lint
ruff format --check .                  # format
python manage.py makemigrations --check --dry-run  # no unapplied model changes
pytest --cov                           # tests + coverage
```

### Frontend

```bash
cd frontend
yarn type-check                        # tsc --noEmit
yarn lint                              # ESLint
yarn stylelint                         # Stylelint
yarn test:run --coverage               # Vitest
yarn build                             # production build succeeds
```

### Shared

```bash
cd packages/shared
npm test                               # Vitest
```

## Code Standards

- **Python**: Ruff for linting and formatting. Config in `backend/pyproject.toml`. No `# type: ignore` without a comment explaining why.
- **TypeScript**: Strict mode, no `any`. ESLint + Prettier via `@nimoh-digital-solutions/eslint-config`.
- **Styling**: SCSS Modules + Tailwind v4. Stylelint enforced.
- **Tests**: Co-locate test files next to source (`Component.test.tsx`, `test_views.py`). New features require tests.
- **Migrations**: Never edit a migration that has been deployed. Create a new one instead.

## File Naming

| Layer | Convention | Example |
|---|---|---|
| Backend models | `snake_case.py` | `apps/exchanges/models.py` |
| Backend tests | `test_<module>.py` | `apps/exchanges/tests/test_views.py` |
| Frontend components | `PascalCase/` dir with same-name file | `components/ui/Button/Button.tsx` |
| Frontend tests | `<Component>.test.tsx` | `Button.test.tsx` |
| Frontend hooks | `use<Name>.ts` | `hooks/useApiMutation.ts` |

## Environment Files

- Never commit `.env` files — they are gitignored
- Update `.env.example` when adding new environment variables
