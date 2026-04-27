# AGENTS.md

## Dev environment tips
- **Backend**: `cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver`
- **Frontend**: `cd frontend && yarn install && yarn dev` (Vite dev server at http://localhost:3070)
- **Mobile**: `cd mobile && npm install && npm run start` (Expo dev client; see `mobile/README.md` for device builds)
- **Shared**: `cd packages/shared && npm install` — types, schemas, and constants used by web and mobile
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions
- **Backend**: `cd backend && pytest` (pytest-django)
- **Frontend**: `cd frontend && yarn test:run` (Vitest + RTL + MSW); `yarn e2e` for Playwright
- **Shared**: `cd packages/shared && npm test` (Vitest)
- Run `cd backend && ruff check . && pytest --cov` before opening a PR to mimic CI.
- Run `cd frontend && yarn type-check && yarn lint && yarn test:run --coverage` before opening a PR.

## PR instructions
- Follow Conventional Commits (e.g. `feat(exchanges): add counter-propose flow`).
- Keep PRs focused on a single concern — one feature, one bug fix, or one refactor.
- Add or update tests alongside any code changes.
- Confirm CI passes before requesting review.

## Repository map
- `backend/` — Django 5 API server (ASGI). Contains 7 domain apps under `apps/` (books, exchanges, messaging, ratings, trust_safety, notifications, profiles), plus the core `bookswap/` app (User model with PostGIS location, auth views, WebSocket consumers, middleware). Settings in `config/settings/` (base, development, production, test). Celery tasks and DRF serializers live inside each app. Edit when changing API endpoints, models, business logic, or background tasks.
- `frontend/` — React 19 SPA built with Vite 7 and TypeScript (strict). Uses Zustand for auth state, TanStack Query for server state, React Hook Form + Zod for forms, Tailwind v4 + SCSS Modules for styling, Google Maps via `@vis.gl/react-google-maps`, i18next for i18n (en/fr/nl). PWA-enabled with service worker. Edit when changing UI, routes, API integration, or frontend features. See `frontend/README.md` for full details.
- `mobile/` — React Native + Expo (managed) app, TypeScript (strict). Uses Zustand for auth, TanStack Query, React Hook Form + Zod, React Native Reanimated, React Navigation, i18next (en/fr/nl). Sentry, push notifications (expo-notifications), biometric/idle gates, offline mutation queue, WebSocket for chat. Edit when changing native screens, navigation, or mobile-only services. See `mobile/README.md` for full details.
- `packages/shared/` — `@bookswap/shared` npm package (consumed via the `@shared/*` alias). Contains Zod validation schemas, TypeScript type definitions, and domain constants shared between web and mobile. Edit when changing data contracts that both clients will consume.
- `docs/` — Product specifications (PRD, technical architecture, DPIA), gap analyses, action plans. Not code — edit when updating product requirements or planning docs.
- `.github/workflows/` — GitHub Actions: `ci.yml` (lint + test + build on push to main), `deploy-staging.yml` (deploy to Pi5 staging), `deploy-production.yml` (deploy to Pi5 prod). Edit when changing CI/CD pipeline.

## AI Context References
- Documentation index: `docs/`
- Backend details: `backend/README.md`
- Frontend details: `frontend/README.md`
- Mobile details: `mobile/README.md`
- Gap analysis: `docs/gap-analysis/mobile-web-gap-analysis.md`
- Latest deep audit: `docs/deep-audit/`
