# TAST Frontend Template — Package Review

> Review date: February 23, 2026  
> Template version: 1.1.0 (TEMPLATE_VERSION)  
> All published packages: `create-tast-app@1.1.1`, `tast-utils@1.1.0`, `tast-ui@1.1.0` (1.2.0 changeset pending),  
> `tast-hooks@1.1.0`, `tast-styles@1.1.0`, `eslint-config@1.0.0`, `stylelint-config@1.0.0`, `tsconfig@1.0.0`  
> **Phases complete: 1–5 of 8** | Tests: 288 passing

---

## Part 1 — Strengths

### Architecture & Developer Experience

**1. Monorepo with published packages**  
The template itself is the source of truth for 8 npm packages. Every scaffolded app gets battle-tested utilities, components, and config from a published registry — not vendored copies that rot over time. The separation of `src/` (app shell) from `packages/` (framework) is clean and well understood.

**2. `create-tast-app` CLI**  
`npx @nimoh-digital-solutions/create-tast-app` scaffolds a full app with prompts for project name, package manager, brand colours, and optional feature flags. Brand colours inject direct into `_brand.scss` so the CSS custom property palette is customised at scaffold time, not after.

**3. Feature-sliced directory with documentation**  
`src/features/` ships with a README that explains the module anatomy, import rules, cross-feature boundaries, and a barrel pattern example. Developers know exactly where new feature code lives from day one.

**4. Route-level code splitting everywhere**  
All pages are `React.lazy()` wrapped with `Suspense` in `routesConfig.tsx`. No page chunk is loaded until the user navigates to it. Even the `PageFallback` is in its own scoped SCSS module.

**5. Comprehensive SCSS token system**  
`_variables.scss` → `_functions.scss` → `_mixins.scss` is a disciplined design token pipeline. `func.color()`, `func.spacing()`, `func.font-size()`, `func.border-radius()` all read from typed maps. Consumers never touch raw values directly.

---

### Theme System

**6. Full CSS custom property theme — light, dim, and dark**  
`_base.scss` defines a single-source-of-truth palette using `--brand-hue / --brand-saturation / --brand-lightness` as foundations, then derives all `--surface-*`, `--text-*`, `--border-*`, and shadow tokens for all three modes. Adding a new theme stop is one new `[data-theme='…']` block.

**7. OS preference fallback**  
`@media (prefers-color-scheme: dark)` is handled with `:where(html:not([data-theme]))` so the OS dark preference is respected out-of-the-box without any JavaScript.

**8. 3-way toggle with persistence**  
`toggleTheme` cycles `light → dim → dark → light`. Theme is persisted in `localStorage` via the storage utility with a sensitive-key guard. The `ThemeProvider` reads the stored value on mount and validates it against the known `Theme` union type before applying it.

---

### Testing

**9. Testing infrastructure built in, opt-out available**  
Vitest + Testing Library is configured and working with JSDOM. The test suite covers `ThemeContext`, `useTheme`, `useLocalStorage`, `useDocumentTitle`, `ErrorBoundary`, `ProtectedRoute`, `Button`, all `utils/*` modules, and the HTTP client (11 + 182 tests). Coverage report via `yarn test:coverage`.

**10. Tests match implementation contract**  
Tests are structured around behaviour, not implementation. The `ThemeContext` tests use a real React render + `userEvent`, not `act()` stubs. The toggle tests now correctly model the 3-way cycle.

---

### Tooling & CI

**11. GitHub Actions CI pipeline**  
`ci.yml` runs on every push/PR to `main`: packages build → type-check → ESLint → Stylelint → Vitest. No merge without green CI.

**12. Automated release pipeline with Changesets**  
`release.yml` watches for changeset files and opens a versioning PR automatically. `yarn changeset:publish` builds all packages and publishes to npm in one step. Semantic versioning is enforced by the changeset kind (`patch | minor | major`).

**13. Commit quality enforced at the hook level**  
Husky + commitlint enforce Conventional Commits on every `git commit`. The `prepare` script installs hooks automatically on `yarn install`. Husky setup is opt-out via `yarn setup`.

**14. Docker — dev + production, security hardened**  
- Dev: Node 22 Alpine, NPM_TOKEN forwarded without baking into the image layer, `user: node` removed to avoid volume permission issues.  
- Production: `nginx-unprivileged` (non-root), HSTS header, `.dockerignore` prevents `.env` from entering the image, listens on port 8080.

**15. Bundle analysis mode**  
`yarn build:analyze` produces `dist/stats.html` via `rollup-plugin-visualizer`. Gzip + Brotli sizes visible at a glance.

**16. PostCSS pipeline**  
`postcss-jit-props` strips unused Open Props vars from output. `postcss-pxtorem` converts `px` → `rem`. `autoprefixer` handles vendor prefixes. Zero PostCSS config sprawl — all in `vite.config.ts`.

---

### Security

**17. Sensitive key guard in `storage.ts`**  
`setStorageItem` refuses to store values whose key matches `/token/i`, `/secret/i`, `/password/i`, `/auth/i`. A console warning is emitted. Demonstrated by passing `storage.test.ts` spec.

**18. CSRF comment in `http.ts`**  
A documented note in the HTTP service calls out where CSRF token headers should be added once session-cookie authentication is wired in. It won't be missed during integration.

---

---

## Part 2 — Improvement Areas

### Priority 1 — Correctness / Will Cause Issues

---

#### I1. Root `package.json` still pins `tast-ui` and `tast-utils` at `^1.0.0`

The packages are at `1.1.0` (`dim` theme type + 3-way toggle). The `^` range will resolve to `1.1.0` on the next clean install, but the `package.json` manifest is misleading — it implies the minimum compatible version is `1.0.0` when `dim` theme features require `≥ 1.1.0`.

**Fix:** Bump the pinned ranges in `package.json`:
```json
"@nimoh-digital-solutions/tast-ui": "^1.1.0",
"@nimoh-digital-solutions/tast-utils": "^1.1.0"
```

---

#### I2. `TEMPLATE_VERSION` file not bumped

`TEMPLATE_VERSION` still reads `1.0.0`. It should reflect the current template version to give scaffolded apps a reference point for how far behind they are versus the template source.

**Fix:** Update `TEMPLATE_VERSION` to `1.1.0` and keep it in sync with each significant template change.

---

#### I3. No coverage thresholds enforced in CI

`vitest run --coverage` produces a report but no `coverage.thresholds` is set in `vite.config.ts`. CI will pass at 0% coverage if all tests are deleted. The safety net is not actually enforced.

**Fix:** Add to `vite.config.ts` vitest config:
```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 60,
    statements: 70,
  }
}
```

---

### Priority 2 — Developer Onboarding

---

#### I4. `src/features/` is empty — no example feature

The `features/README.md` explains the pattern well, but there is no working example. Developers scaffold the app and see a directory with only a README. The pattern remains abstract until they build their first feature.

**Fix:** Add a minimal `auth/` or `counter/` feature with:
- `components/LoginForm/` — a simple form component
- `hooks/useAuth.ts` — stub hook returning `{ isAuthenticated: false }`
- `services/auth.service.ts` — one POST call using `http`
- `types/auth.types.ts` — `User` and `LoginPayload` interfaces
- `index.ts` barrel

Remove it via `yarn setup` in the same way PWA/testing are removed.

---

#### I5. `tast-hooks` is very thin

Only 2 hooks (`useLocalStorage`, `useDocumentTitle`). Projects reach for the same small set of hooks repeatedly.

**Suggested additions to `tast-hooks`:**

| Hook | Purpose |
|---|---|
| `useDebounce<T>(value, delay)` | Debounce a value — search/filter inputs |
| `useMediaQuery(query)` | `boolean` — e.g. `'(max-width: 768px)'` |
| `useClickOutside(ref, handler)` | Close dropdowns/modals when clicking outside |
| `useWindowSize()` | `{ width, height }` — responsive logic in JS |
| `usePrevious<T>(value)` | Previous render value — useful for transitions |
| `useToggle(initial?)` | `[value, toggle, setTrue, setFalse]` — eliminates boilerplate |

These 6 hooks are used in ~90% of real apps. Shipping them in `tast-hooks` means every scaffolded project gets them for free.

---

#### I6. No state management guidance or example

The template has `ThemeContext` as the only context/store. There is no guidance on how to manage app-level state beyond a single feature. Developers are left to decide between Zustand / Jotai / Redux Toolkit / plain context with `useReducer` with no scaffolded starting point.

**Fix:** Add a minimal Zustand or Jotai store example (one counter or notification store) to `src/data/` or `src/features/`. Add a brief `STATE_MANAGEMENT.md` guidance doc with the chosen approach and why.

---

#### I7. No form handling boilerplate

Forms are the most common UI pattern in apps. There is no React Hook Form or Zod set up, no example form component, and no guidance in the README.

**Fix (minimal):** Add `react-hook-form` and `zod` to the template's `package.json`. Add a `src/components/ui/Form/` directory with a thin typed `<Field />` wrapper and a `LoginForm` example in the `auth` feature (see I4).

---

#### I8. Environment variable validation — no build-time safety

`APP_CONFIG` reads `import.meta.env.VITE_API_URL` with no validation. If `VITE_API_URL` is missing in a deployment, `createHttpClient(undefined)` will silently produce broken API calls at runtime, not a build error.

**Fix:** Add a Zod env schema (or manual validation) that throws at app startup if required vars are missing:
```typescript
// src/configs/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url({ message: 'VITE_API_URL must be a valid URL' }),
  VITE_APP_TITLE: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
```
`APP_CONFIG` reads from `env` instead of `import.meta.env` directly.

---

### Priority 3 — UI Component Coverage

---

#### I9. `tast-ui` ships only one component

`Button` is the only component in the published `tast-ui` package. Virtually every project needs a small set of primitives before it can build screens.

**Suggested next components for `tast-ui`:**

| Component | Notes |
|---|---|
| `Input` / `Textarea` | Supports label, error state, helper text |
| `Badge` | Status indicator — success/warning/error/neutral variants |
| `Spinner` / `Loader` | Generic loading state |
| `Card` | Surface-2 container with configurable padding/shadow |
| `Modal` / `Dialog` | Built on the native `<dialog>` element — focus trap, Esc to close |
| `Toast` / `Notification` | Stacked dismissible banners — plugs into ErrorBoundary pattern |

Each component should follow the existing `Button` pattern: typed interface, SCSS module using CSS vars, test file, exported from `tast-ui`.

---

#### I10. No Storybook for `tast-ui`

The `ComponentsDemoPage` is a good in-app showcase but all components must be viewed running the full dev server. There is no isolated component development story.

**Fix:** Add Storybook to the `packages/tast-ui/` workspace. Stories for each component give collaborators a visual contract and make regression testing cheap.

---

### Priority 4 — DX Niceties

---

#### I11. Yarn v1 — time to plan a migration

The monorepo runs Yarn v1 (`1.22.22`). Yarn v1 is unmaintained. Key gaps:
- No `workspace:^` protocol (forces full semver in all cross-package deps)
- No Yarn PnP (faster installs, zero phantom deps)
- Security audit (`yarn audit`) can't autofix — `yarn audit --fix` does not exist
- Patch-package support requires workarounds

**Suggested path:** Migrate to Yarn v4 Berry (stable, officially the continuation). It supports Yarn classic lockfiles for migration and is backward-compatible with `workspaces` config.

---

#### I12. Setup scripts are opt-out only — no opt-in

`yarn setup` lets you remove PWA, testing, Husky, or Docker. But if you keep Docker during scaffold and later want to remove it, or if you remove testing and want it back, there is no add path.

**Fix:** Mirror each `setup:remove-*` with a `setup:add-*` variant, or extend the `setup.js` TUI to ask "Add or Remove?" at the top level.

---

#### I13. `dim` theme has no OS preference entry point

Light and dark modes have `@media (prefers-color-scheme: …)` mapping. The `dim` theme is only accessible via the toggle — a user who wants dim by default cannot express that preference through OS settings.

**Potential fix:** Expose a "preferred theme" localStorage key (separate from the "active theme") in the setup flow, or add a theme preference UI beyond the icon button in the Header.

---

#### I14. No accessibility (a11y) runtime testing

ESLint with `eslint-plugin-jsx-a11y` catches static issues. But focus management, ARIA live regions, modal focus traps, and colour contrast are runtime behaviours that static analysis misses.

**Fix:** Add `@axe-core/react` in development mode and `@testing-library/jest-axe` in tests. An axe scan on mount will surface WCAG violations during development without any extra effort.

---

#### I15. No internationalization stub

There is no `src/i18n/` directory, no `i18next` or similar setup, and no guidance in the README. Teams that need i18n have no starting point and end up retrofitting it after hardcoding strings everywhere.

**Fix (minimal):** Add `src/i18n/` with a basic `i18next` + `react-i18next` setup, one `en.json` locale file, and a note in README that other locales go here. Keep it opt-out in `yarn setup`.

---

---

## Summary Table

| # | Area | Priority | Effort |
|---|---|---|---|
| # | Area | Priority | Effort | Status |
|---|---|---|---|---|
| I1 | Pin `tast-ui`/`tast-utils` at `^1.1.0` in root `package.json` | 🔴 High | Trivial | ✅ Done |
| I2 | Bump `TEMPLATE_VERSION` to `1.1.0` | 🔴 High | Trivial | ✅ Done |
| I3 | Add coverage thresholds to `vite.config.ts` | 🔴 High | Small | ✅ Done |
| I4 | Add example feature to `src/features/` | 🟠 Medium | Medium | ✅ Done |
| I5 | Add 6 common hooks to `tast-hooks` | 🟠 Medium | Medium | ✅ Done |
| I6 | Add state management guidance + example | 🟠 Medium | Medium | ✅ Done |
| I7 | Add `react-hook-form` + `zod` form boilerplate | 🟠 Medium | Medium | ✅ Done |
| I8 | Add env var Zod validation in `APP_CONFIG` | 🔴 High | Small | ✅ Done |
| I9 | Add `Input`, `Textarea`, `Badge`, `Spinner`, `Card`, `Modal`, `Toast` to `tast-ui` | 🟠 Medium | Large | ✅ Done |
| I10 | Add Storybook to `packages/tast-ui/` | 🟡 Low | Medium | ✅ Done |
| I11 | Migrate Yarn v1 → Yarn v4 Berry | 🟡 Low | Large | ✅ Done |
| I12 | Add opt-in path to setup scripts | 🟡 Low | Medium | ✅ Done |
| I13 | OS preference path for `dim` theme | 🟡 Low | Small | ✅ Done |
| I14 | Add `jest-axe` + `@axe-core/react` for a11y testing | 🟠 Medium | Small | ✅ Done |
| I15 | Add `i18n` stub (opt-out) | 🟡 Low | Medium | ✅ Done |

---

---

## Part 3 — Implementation Roadmap

Items are grouped into phases ordered by dependency, impact, and risk.
Each phase has a clear goal, the items it covers, concrete deliverables, and a definition of done.

---

### Phase 1 — Safety & Correctness ✅ DONE

> **Completed:** `package.json` pins bumped to `^1.1.0` for `tast-ui`/`tast-utils`. `TEMPLATE_VERSION` updated to `1.1.0`.

> **Goal:** Ensure the published packages and template version are truthful and that CI cannot silently regress.

| Item | Status |
|---|---|
| I1 — Bump `tast-ui`/`tast-utils` pins to `^1.1.0` | ✅ Done |
| I2 — Bump `TEMPLATE_VERSION` to `1.1.0` | ✅ Done |

**Definition of done:** `package.json` pins match published versions. `TEMPLATE_VERSION` is in sync.

---

### Phase 2 — Quality Gates ✅ DONE

> **Completed:** Zod env validation (`src/configs/env.ts`), coverage thresholds in `vite.config.ts`, CI updated to `yarn test:coverage`. Commit `7644201`.

> **Goal:** Make CI catch regressions that it currently lets through.  
> **Packages affected:** `tast-fe-app` template, `tast-utils`, `tast-ui`  
> **Changeset kind:** patch (config changes only)

#### Items

**I3 — Coverage thresholds**
- Add to `vite.config.ts` `test.coverage.thresholds`: `lines: 70, functions: 70, branches: 60, statements: 70`
- Verify `yarn test:coverage` exits non-zero if thresholds are breached
- Update `ci.yml` to run `yarn test:coverage` instead of `yarn test:run` so the gate is enforced on every PR

**I8 — Env var Zod validation**
- Add `zod` to `dependencies`
- Create `src/configs/env.ts` with a Zod schema for all `VITE_*` vars
- `APP_CONFIG` reads from the parsed env object — missing required vars throw at startup, not silently at runtime
- Update `.env.example` with the full list of recognised vars and a `required / optional` annotation per var

#### Deliverables
- `vite.config.ts` — coverage thresholds block
- `src/configs/env.ts` — new file
- `src/configs/appConfig.ts` — reads from `env.ts`
- `.env.example` — annotated

#### Definition of done
CI fails on a PR that deletes tests below threshold. `yarn dev` throws a clear error if `VITE_API_URL` is missing.

---

### Phase 3 — Hook Library Expansion ✅ DONE

> **Completed:** All 6 hooks (`useDebounce`, `useMediaQuery`, `useClickOutside`, `useWindowSize`, `usePrevious`, `useToggle`) added to `tast-hooks` with tests and shims. `tast-hooks` bumped to `1.1.0`. Commit `c73a57c`.

> **Goal:** Ship the hooks every project reaches for in the first week so scaffolded apps don't vendor-copy them.  
> **Package affected:** `tast-hooks`  
> **Changeset kind:** minor

#### Items

**I5 — Add 6 common hooks**

| Hook | Signature | Behaviour |
|---|---|---|
| `useDebounce<T>(value, delay)` | `T` | Returns debounced value; resets timer on change |
| `useMediaQuery(query)` | `boolean` | Live `matchMedia` subscription; SSR-safe |
| `useClickOutside(ref, handler)` | `void` | Fires `handler` on pointerdown outside `ref` |
| `useWindowSize()` | `{ width, height }` | Listens to `resize`; debounced 100ms |
| `usePrevious<T>(value)` | `T \| undefined` | Returns value from previous render |
| `useToggle(initial?)` | `[boolean, toggle, setTrue, setFalse]` | Controlled boolean state |

Each hook needs:
- Implementation in `packages/tast-hooks/src/use*.ts`
- Unit test with Vitest + `renderHook`
- Export from `packages/tast-hooks/src/index.ts`
- Re-export from `src/hooks/index.ts` in the template app shell

#### Deliverables
- 6 new hook files + 6 test files in `packages/tast-hooks/src/`
- Updated barrel `index.ts`
- Build + changeset

#### Definition of done
`yarn test:run` green. All 6 hooks importable via `@nimoh-digital-solutions/tast-hooks`. Scaffolded app gets them on next `create-tast-app` run.

---

### Phase 4 — App Patterns Foundation ✅ DONE

> **Completed:** `src/features/auth/` tree (types, service, `useAuth`, `LoginForm`, `LoginPage`), `src/data/useAppStore.ts` (Zustand), `STATE_MANAGEMENT.md`, `src/components/ui/Field/` (component + SCSS + tests). Deps added: `zustand@5`, `react-hook-form@7`, `zod@4`, `@hookform/resolvers@5`. 216 tests passing. Commit `49f21b6`.

> **Goal:** Give developers working examples of the three patterns every real app needs: feature modules, state, and forms.  
> **Files affected:** `src/` template shell only (no package publish needed)  
> **Changeset kind:** none (template source change)

#### Items

**I4 — Example `auth` feature in `src/features/`**

Create `src/features/auth/` with:
```
auth/
├── index.ts                      ← exports LoginPage, useAuth
├── components/
│   └── LoginForm/
│       ├── LoginForm.tsx          ← react-hook-form form using zod schema
│       └── LoginForm.module.scss
├── hooks/
│   └── useAuth.ts                 ← stub: { isAuthenticated: false, login, logout }
├── services/
│   └── auth.service.ts            ← http.post<{ token: string }>('/auth/login', payload)
└── types/
    └── auth.types.ts              ← LoginPayload, AuthUser, AuthState
```

**I6 — State management**
- Add `zustand` to `dependencies`
- Create `src/data/useAppStore.ts` — a minimal store with `notifications: []`, `addNotification`, `dismissNotification`
- Add a brief `STATE_MANAGEMENT.md` in `src/data/` explaining: "Use Zustand for global state. Feature-local state stays in feature hooks. Never put server-cache state here — use React Query for that."

**I7 — Form boilerplate**
- Add `react-hook-form` and `zod` to `dependencies`
- Create `src/components/ui/Field/` — a typed `<Field label error helperText>` wrapper around `<input>` that accepts a `react-hook-form` register object
- Wire `LoginForm` (from I4) to use `Field` + a `loginSchema` Zod schema
- Add `Field.test.tsx`

#### Deliverables
- `src/features/auth/` tree (8 files)
- `src/data/useAppStore.ts` + `STATE_MANAGEMENT.md`
- `src/components/ui/Field/` (component + SCSS + test)
- Updated `src/routes/config/routesConfig.tsx` — add `/login` route pointing at `LoginPage`
- Updated `package.json` deps: `zustand`, `react-hook-form`, `zod`

#### Definition of done
`yarn dev` renders a working (stub) login form at `/login`. Toggle the theme — everything reacts. `yarn type-check` and `yarn test:run` both green.

---

### Phase 5 — Component Library Expansion ✅ DONE

> **Completed:** 7 new components (`Input`, `Textarea`, `Badge`, `Spinner`, `Card`, `Modal`, `Toast`) added to `tast-ui`. `useToast()` hook added to `tast-hooks`. Template shims, 8 test files, `ComponentsDemoPage` showcase sections. 288 tests passing. Changesets created for `tast-ui` minor and `tast-hooks` minor. Commit `da7509e`.

> **Goal:** Give `tast-ui` the primitive components every UI needs beyond a button.  
> **Package affected:** `tast-ui`  
> **Changeset kind:** minor (new exports, no breaking changes)

#### Items

**I9 — New `tast-ui` components**

Build each component following the `Button` pattern: typed interface file, SCSS module using CSS custom properties only, vitest test, exported from `tast-ui/src/index.ts`.

| Component | Key props | Notes |
|---|---|---|
| `Input` | `label`, `error`, `helperText`, `disabled`, all native input attrs | Used by `Field` in Phase 4 |
| `Textarea` | Same as `Input` | Multi-line variant |
| `Badge` | `variant: 'success'\|'warning'\|'error'\|'neutral'\|'info'`, `size` | Pill shape, uses status CSS vars |
| `Spinner` | `size`, `label` (sr-only accessible label) | CSS animation, no JS |
| `Card` | `as`, `padding`, `shadow` | `--surface-2` background, configurable elevation |
| `Modal` | `open`, `onClose`, `title`, `children` | Native `<dialog>`, focus trap, Esc closes |
| `Toast` | `message`, `variant`, `duration`, `onDismiss` | Consumed by a `useToast()` hook in `tast-hooks` |

Each component must:
- Use `var(--surface-*)`, `var(--text-*)`, `var(--brand)` — zero hardcoded colours
- Pass `yarn type-check` and `yarn stylelint` in the package
- Have at least 3 test cases (renders, variant/prop variations, a11y role present)

#### Deliverables
- 7 component directories in `packages/tast-ui/src/components/`
- Updated `packages/tast-ui/src/index.ts` barrel
- `useToast()` hook added to `tast-hooks` (minor bump)
- Build + changeset for `tast-ui@1.2.0` and `tast-hooks@1.1.0`
- Template app `ComponentsDemoPage` updated to showcase all new components

#### Definition of done
All 7 components render in `ComponentsDemoPage`. Theme toggle changes them all. CI green.

---

### Phase 6 — Storybook & Visual Development ✅ DONE

> **Goal:** Make component development in `tast-ui` fully isolated, documented, and visually regression-tested.  
> **Package affected:** `tast-ui` (devDependency only)  
> **Changeset kind:** none (tooling only)

#### Items

**I10 — Storybook in `packages/tast-ui/`**
- Install Storybook 8 (`sb init`) into `packages/tast-ui/`
- Configure with the Vite builder and SCSS support (same PostCSS pipeline as the main app)
- Create `*.stories.tsx` for every component (Button + all Phase 5 additions)
- Each story demonstrates: default state, all variants, dark mode (via `[data-theme='dark']` decorator), disabled/error states
- Add `storybook` and `storybook:build` scripts to the workspace and root `package.json`

#### Deliverables
- `packages/tast-ui/.storybook/` config directory
- `*.stories.tsx` for each component
- `storybook` script in root `package.json`

#### Definition of done
`yarn storybook` opens Storybook. All components visible. Dark mode stories work via `data-theme` decorator.

---

### Phase 7 — Accessibility & Internationalisation ✅ DONE

> **Completed:** `jest-axe` + `@axe-core/react` installed; `src/test/a11y.setup.ts` shared helper; axe WCAG 2.1 AA describe blocks in Button, Input, Modal, ProtectedRoute, and ErrorBoundary (300 tests passing). `@axe-core/react` wired into `main.tsx` behind `import.meta.env.DEV`. `i18next` + `react-i18next` installed; `src/i18n/` with init and `locales/en.json`; App wrapped in `<I18nextProvider>`; setup.js extended with i18n opt-out; i18n section added to README. CI updated to `--reporter=verbose`. Commit `592bd01`.

> **Goal:** Ensure apps built from this template pass WCAG 2.1 AA by default and have a clear i18n path.  
> **Files affected:** `src/` shell + `packages/tast-ui/`  
> **Changeset kind:** patch (test additions only for tast-ui)

#### Items

**I14 — A11y runtime testing**
- Add `@testing-library/jest-dom` axe integration: `axe` from `jest-axe` run in a shared `test/a11y.setup.ts` helper
- Add `@axe-core/react` to `devDependencies` — configure in `src/main.tsx` behind `import.meta.env.DEV` guard
- Add axe assertions to at least: `Button`, `Input`, `Modal`, `ProtectedRoute`, `ErrorBoundary` tests
- Add to `ci.yml`: `yarn test:run --reporter=verbose` so failing axe assertions are visible line-by-line

**I15 — i18n stub (opt-out)**
- Add `i18next` and `react-i18next` to `dependencies`
- Create `src/i18n/index.ts` — initialises i18next with `en` as default locale
- Create `src/i18n/locales/en.json` — keys for every string currently hardcoded in the template pages/components
- Wrap `AppRouter` in `<I18nextProvider>` in `App.tsx`
- Update `scripts/setup.js` to offer "Remove i18n" as a new opt-out option that does the reverse
- Add `i18n` section to `README.md`

#### Deliverables
- `jest-axe` tests across 5 components
- `src/i18n/` directory (3 files)
- `App.tsx` updated
- `scripts/setup.js` i18n opt-out section
- README i18n section

#### Definition of done
`yarn test:run` includes axe assertions. `yarn dev` shows no axe violations in the browser console. App strings are sourced from `en.json`.

---

### Phase 8 — DX Tooling ✅ DONE

> **Goal:** Polish the development loop — better setup scripting, Yarn upgrade, and theme preference.  
> These are low-risk standalone changes that don't affect published packages.

#### Items

**I11 — Migrate Yarn v1 → Yarn v4 Berry**
- Pin `"packageManager": "yarn@4.x.x"` in root `package.json`
- Enable `nodeLinker: node-modules` (not PnP) to preserve compatibility with existing tooling
- Convert all cross-workspace deps to `workspace:^` protocol
- Update `.github/workflows/ci.yml` and `release.yml` to use `yarn set version stable`
- Update `Dockerfile` — dev stage `--mount=type=bind` cache remains valid
- Test: `make docker-dev` green; `yarn packages:build` green; `yarn test:run` green

**I12 — Setup scripts opt-in**
- Extend `scripts/setup.js` TUI: after "Which feature?" ask "Add or Remove?"
- `setup:add-testing` — installs vitest devDeps, adds `test/setup.ts`, adds scripts to `package.json`
- `setup:add-docker` — copies `Dockerfile` + `docker-compose.yml` + `nginx.conf` + `Makefile`
- `setup:add-pwa` — restores PWA plugin config, `sw/pwa.ts`, `manifest.webmanifest`
- `setup:add-husky` — runs `husky init`, installs `commitlint`, writes `.husky/commit-msg`

**I13 — OS preference entry point for `dim` theme**
- Add a `preferredTheme` key to `localStorage` (separate from `activeTheme`)
- `ThemeProvider` reads `preferredTheme` on mount — if set to `dim`, initialises in dim even when OS is dark
- Add a "Set as default" button to the theme toggle in `Header.tsx`

#### Deliverables
- Yarn 4 migration (`package.json`, `yarn.lock`, `.yarnrc.yml`, CI updates)
- 4 `setup:add-*` scripts
- `ThemeProvider` `preferredTheme` support
- Header "Set as default" affordance

#### Definition of done
`yarn install` uses Yarn 4. `yarn setup` shows Add/Remove prompt. Setting dim as preferred persists across hard refreshes without an OS dark mode active.

---

### Phase Overview

| Phase | Name | Items | Scope | Est. effort | Status |
|---|---|---|---|---|---|
| 1 | Safety & Correctness | I1, I2 | Config | Done | ✅ Done |
| 2 | Quality Gates | I3, I8 | Template + deps | 1–2 days | ✅ Done |
| 3 | Hook Library Expansion | I5 | `tast-hooks` package | 2–3 days | ✅ Done |
| 4 | App Patterns Foundation | I4, I6, I7 | Template shell | 3–4 days | ✅ Done |
| 5 | Component Library Expansion | I9 | `tast-ui` package | 5–7 days | ✅ Done |
| 6 | Storybook & Visual Dev | I10 | `tast-ui` tooling | 2–3 days | ✅ Done |
| 7 | Accessibility & i18n | I14, I15 | Template + `tast-ui` | 3–4 days | ✅ Done |
| 8 | DX Tooling | I11, I12, I13 | Infra + scripts | 3–5 days | ✅ Done |

Phases 2–4 can be worked in parallel (no cross-dependencies). Phase 5 depends on Phase 4 (`Field` uses `Input`). Phase 6 depends on Phase 5 (Storybook needs all components). Phase 7 and 8 are independent.

---

*Generated from live codebase analysis — February 23, 2026*
