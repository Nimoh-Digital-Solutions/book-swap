# AGENTS.md

## Project Overview

**TAST** (Template for Application Starter Toolkit) is a production-ready React starter kit and monorepo that ships a demo application alongside a suite of publishable packages. It is built with:

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7, SWC |
| Styling | SCSS Modules + Open Props (design tokens) |
| State | Zustand, React Hook Form + Zod |
| Routing | React Router v7 |
| i18n | i18next / react-i18next |
| Testing | Vitest + React Testing Library + jest-axe |
| Linting | ESLint 8, Stylelint 16, Prettier |
| Commits | Husky + lint-staged + Commitlint (Conventional Commits) |
| CI / Release | GitHub Actions, Changesets |
| PWA | vite-plugin-pwa (opt-in) |
| Container | Docker + nginx |
| Package Mgr | Yarn 4 (Berry) with workspaces |

Publishable packages live under `packages/` and are scoped to `@nimoh-digital-solutions`:

| Package | Purpose |
|---|---|
| `tast-ui` | Shared React component library (Storybook) |
| `tast-hooks` | Reusable custom hooks |
| `tast-utils` | General-purpose utilities |
| `tast-styles` | Shared SCSS tokens & mixins |
| `create-tast-app` | CLI scaffolding tool |
| `eslint-config` | Shared ESLint config |
| `stylelint-config` | Shared Stylelint config |
| `tsconfig` | Shared TypeScript base configs |

---

## Repository Structure

```
├── .github/
│   ├── agents/          # Copilot agent definitions (not committed — .gitignore)
│   ├── instructions/    # Copilot instruction files (not committed — .gitignore)
│   └── workflows/       # CI & Release GitHub Actions (committed)
├── packages/            # Publishable Yarn workspace packages
│   ├── tast-ui/         # Component library
│   ├── tast-hooks/      # Custom hooks
│   ├── tast-utils/      # Utility functions
│   ├── tast-styles/     # SCSS design tokens
│   ├── create-tast-app/ # CLI scaffolding
│   ├── eslint-config/   # Shared ESLint rules
│   ├── stylelint-config/# Shared Stylelint rules
│   └── tsconfig/        # Shared TS configs
├── src/                 # Demo / starter application
│   ├── assets/          # Static assets (images, SVGs)
│   ├── components/      # Shared UI components
│   ├── configs/         # App-level configuration
│   ├── contexts/        # React context providers
│   ├── data/            # Static data / constants
│   ├── features/        # Feature-based modules
│   ├── hooks/           # App-specific custom hooks
│   ├── i18n/            # Internationalization resources
│   ├── layouts/         # Page layout components
│   ├── pages/           # Route-level page components
│   ├── routes/          # Route definitions
│   ├── services/        # API / HTTP service layer
│   ├── styles/          # Global SCSS & design tokens
│   ├── sw/              # Service worker (PWA)
│   ├── test/            # Test setup & helpers
│   ├── types/           # Shared TypeScript types
│   └── utils/           # App-specific utilities
├── plugins/             # Custom Vite plugins
├── scripts/             # Setup & scaffolding scripts
├── public/              # Static public assets & PWA manifest
└── api/                 # API proxy / mock helpers
```

---

## Development Workflow

### Getting Started

```bash
# 1. Install dependencies (Yarn 4 — corepack enable first)
yarn install

# 2. Start the dev server
yarn dev

# 3. Run the full check suite
yarn check          # audit + type-check + lint + stylelint + test
```

### Key Commands

| Command | Description |
|---|---|
| `yarn dev` | Start Vite dev server |
| `yarn build` | TypeScript check + production build |
| `yarn test` | Run Vitest in watch mode |
| `yarn test:run` | Single Vitest run |
| `yarn test:coverage` | Vitest with coverage report |
| `yarn lint` / `yarn lint:fix` | ESLint (src/) |
| `yarn stylelint` / `yarn stylelint:fix` | Stylelint (SCSS) |
| `yarn format` | Prettier (all files) |
| `yarn type-check` | `tsc --noEmit` |
| `yarn packages:build` | Build all publishable packages |
| `yarn storybook` | Launch tast-ui Storybook |
| `yarn changeset` | Create a new changeset for versioning |
| `yarn changeset:publish` | Build packages + publish via Changesets |

### Branching & Commits

- Default branch: **main**
- Commits follow **Conventional Commits** (enforced by Commitlint + Husky):
  `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
- Pre-commit hooks run **lint-staged** (ESLint fix, Stylelint fix, Prettier)

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on push/PR to `main`:

1. Checkout → Enable Corepack → Setup Node 22 → `yarn install --immutable`
2. `yarn packages:build`
3. `yarn type-check`
4. `yarn lint` (ESLint)
5. `yarn stylelint` (Stylelint)
6. `yarn vitest run --coverage`

### Release Pipeline (`.github/workflows/release.yml`)

Runs on push to `main`:

1. Same setup as CI
2. Builds packages
3. Uses `changesets/action` to either:
   - Open a "Version Packages" PR when un-released changesets exist
   - Publish to npm when the Version Packages PR merges

---

## Coding Standards

### TypeScript

- Strict mode enabled — no `any` unless absolutely necessary
- Use interfaces for component props; discriminated unions for variants
- Path aliases configured via `tsconfig.json` (e.g. `@/components/...`)

### React

- Functional components only — no class components
- Pass `ref` as prop directly (React 19) — no `forwardRef`
- Use `useActionState` / `useFormStatus` for form patterns
- State: local `useState` / `useReducer`; global via Zustand
- Server state: hook-based service layer in `src/services/`
- Apply instructions from: `.github/instructions/reactjs.instructions.md`

### Styling

- SCSS Modules scoped per component (`Component.module.scss`)
- Design tokens from Open Props + project tokens in `src/styles/`
- Use `rem` units (PostCSS `pxtorem` converts `px` automatically)
- Apply instructions from: `.github/instructions/a11y.instructions.md`

### Testing

- Co-locate tests next to source: `Component.test.tsx` beside `Component.tsx`
- Use `@testing-library/react` + `@testing-library/user-event`
- Accessibility: every component test includes `jest-axe` assertions
- Apply instructions from: `.github/instructions/nodejs-javascript-vitest.instructions.md`

### Performance

- Code-split routes with `React.lazy` + `Suspense`
- Vite chunk strategy configured in `vite.config.ts`
- Analyze builds with `yarn build:analyze`
- Apply instructions from: `.github/instructions/performance-optimization.instructions.md`

---

## Agent Reference

The following agents from `.github/agents/` are relevant to this project's workflows. Invoke them by name in Copilot Chat for specialised assistance.

### Feature Development

| Agent | File | Use When |
|---|---|---|
| **Expert React Frontend Engineer** | `expert-react-frontend-engineer.agent.md` | Building components, hooks, state management, or React 19 patterns |
| **Principal Software Engineer** | `principal-software-engineer.agent.md` | Architecture decisions, code reviews, tech debt assessment |
| **SE: UX Designer** | `se-ux-ui-designer.agent.md` | User journey mapping, JTBD analysis before building new features |

### Code Quality & Review

| Agent | File | Use When |
|---|---|---|
| **Accessibility Expert** | `accessibility.agent.md` | WCAG compliance, ARIA usage, keyboard navigation, a11y testing |
| **SE: Security** | `se-security-reviewer.agent.md` | Security review, OWASP checks, auth/input validation |
| **Universal Janitor** | `janitor.agent.md` | Dead code removal, dependency clean-up, tech debt remediation |
| **PR Comment Addresser** | `address-comments.agent.md` | Addressing pull-request review comments |

### Debugging & Testing

| Agent | File | Use When |
|---|---|---|
| **Debug Mode** | `debug.agent.md` | Systematic root-cause analysis and bug fixing |
| **Playwright Tester** | `playwright-tester.agent.md` | Writing or improving end-to-end Playwright tests |

### CI/CD & DevOps

| Agent | File | Use When |
|---|---|---|
| **GitHub Actions Expert** | `github-actions-expert.agent.md` | Editing workflows, adding jobs, security-hardening CI/CD |
| **DevOps Expert** | `devops-expert.agent.md` | Docker, nginx, deployment pipelines, infrastructure |

### Documentation & Onboarding

| Agent | File | Use When |
|---|---|---|
| **SE: Tech Writer** | `se-technical-writer.agent.md` | README, GETTING_STARTED, API docs, tutorials |
| **VSCode Tour Expert** | `code-tour.agent.md` | Creating CodeTour `.tour` files for onboarding |
| **Repo Architect** | `repo-architect.agent.md` | Validating/extending the agentic project structure |

---

## Instruction Reference

Key instruction files from `.github/instructions/` that apply automatically based on file globs:

| Instruction | Applies To | Purpose |
|---|---|---|
| `reactjs.instructions.md` | `**/*.jsx, **/*.tsx, **/*.ts` | React component patterns & best practices |
| `a11y.instructions.md` | All files | Accessibility standards (WCAG 2.1/2.2) |
| `performance-optimization.instructions.md` | All files | Frontend/backend performance guidance |
| `nodejs-javascript-vitest.instructions.md` | `**/*.test.*` | Vitest testing patterns & conventions |
| `self-explanatory-code-commenting.instructions.md` | All files | Comment style & self-documenting code |
| `github-actions-ci-cd-best-practices.instructions.md` | `.github/workflows/**` | CI/CD workflow standards |
| `containerization-docker-best-practices.instructions.md` | `Dockerfile, docker-compose.yml` | Docker best practices |
| `security-and-owasp.instructions.md` | All files | OWASP security checklist |
| `code-review-generic.instructions.md` | All files | Code review standards |
| `localization.instructions.md` | `src/i18n/**` | i18n key naming & resource structure |
