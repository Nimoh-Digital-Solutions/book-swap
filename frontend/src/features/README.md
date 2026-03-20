# Feature Modules

Feature modules collect all code related to a single product feature in one place —
components, hooks, services, types, and utilities — making it easy to add, modify,
or remove a feature without hunting across the global file tree.

---

## Directory Anatomy

```
src/features/
└── <feature-name>/
    ├── index.ts                    # Public barrel — only export what consumers need
    ├── components/                 # UI components scoped to this feature
    │   └── ExampleWidget/
    │       ├── ExampleWidget.tsx
    │       └── ExampleWidget.module.scss
    ├── hooks/                      # Feature-scoped custom hooks
    │   └── useExampleData.ts
    ├── services/                   # API calls for this feature (wraps src/services/http)
    │   └── example.service.ts
    ├── types/                      # TypeScript types/interfaces for this feature
    │   └── example.types.ts
    └── utils/                      # Feature-scoped utility functions
        └── example.utils.ts
```

---

## Rules

1. **Import via barrel only**  
   External code always imports from `@features/<name>` (the `index.ts` barrel),
   never from internal feature paths.

2. **No cross-feature imports**  
   Features must not import from other features. Shared code belongs in:
   - `src/components/` — shared UI primitives
   - `src/hooks/` — shared hooks
   - `src/utils/` — shared utilities
   - `src/services/` — shared HTTP client

3. **Graduate shared code**  
   If a component or hook is needed by ≥ 2 features, move it to the shared layer
   (`src/components/common/`, `src/hooks/`, etc.).

4. **Lazy-load feature pages**  
   Register feature pages via `React.lazy()` in `src/routes/config/routesConfig.tsx`.
   Never eagerly import entire features in the route config.

---

## Example Barrel (`index.ts`)

```typescript
// src/features/example-feature/index.ts
// Only re-export the public API — keep internals private.
export { ExamplePage } from './components/ExamplePage/ExamplePage';
export { useExampleData } from './hooks/useExampleData';
export type { ExampleItem, ExampleFilters } from './types/example.types';
```

---

## Path Alias

Add a `@features` alias to `vite.config.ts` and `tsconfig.json` to enable
clean imports once your first feature module is created:

**`vite.config.ts`**
```typescript
'@features': path.resolve(__dirname, 'src/features'),
```

**`tsconfig.json`**
```jsonc
"@features": ["features"],
"@features/*": ["features/*"]
```

Then import as:
```typescript
import { ExamplePage } from '@features/example-feature';
```
