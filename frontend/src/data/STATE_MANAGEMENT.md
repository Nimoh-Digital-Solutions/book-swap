# State Management

## Approach

This project uses **[Zustand](https://github.com/pmndrs/zustand)** for client-side global state.

Zustand was chosen over Redux Toolkit, Jotai, or plain `useReducer` context because:

- **Minimal boilerplate** — a store is a single `create()` call with typed state + actions.
- **No provider required** — works outside React components (e.g. in service helpers).
- **Excellent TypeScript support** — full inference, no `as` casts.
- **Tiny bundle** — ~1 KB gzipped.

---

## Where state lives

| Layer | Tool | What goes here |
|---|---|---|
| **Local component state** | `useState` / `useReducer` | UI-only ephemeral state (open/closed, focused, etc.) |
| **Feature state** | feature hooks (e.g. `useAuth`) | State scoped to one feature — auth, cart, etc. |
| **Global app state** | `useAppStore` (Zustand) | Cross-feature state: notification queue, sidebar open, etc. |
| **Server cache** | React Query / SWR *(future)* | Async data from the API — **never put this in Zustand** |

---

## `useAppStore` — current slices

### Notifications

```typescript
import { useAppStore } from '@data';

// Push a notification
const id = useAppStore.getState().addNotification('Saved!', { variant: 'success' });

// Inside a component
const { notifications, dismissNotification } = useAppStore();
```

**Supported variants:** `info` | `success` | `warning` | `error`

**Auto-dismiss:** pass `duration` in milliseconds (default 5 000 ms). Set `0` to disable.

---

## Adding a new slice

1. Add the slice interface and implementation inside `useAppStore.ts`.
2. Keep slices **flat** — avoid deeply nested state.
3. Write selectors for anything computed:

```typescript
// src/data/useAppStore.ts
interface AppStore {
  // ... existing slices
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // ... existing state
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));

// src/somewhere/MyComponent.tsx — derived selector (avoids re-renders)
const theme = useAppStore(s => s.theme);
```

---

## What NOT to put in Zustand

- Form state → use `react-hook-form`
- Server data (users, posts, etc.) → use React Query / SWR
- URL state (active tab, page number) → use React Router `useSearchParams`
- Auth tokens → use `localStorage` via `useLocalStorage` hook

---

## Feature hooks vs Zustand

A feature hook (e.g. `useAuth`) may internally use Zustand if its state needs to
be shared between multiple unmounted components. Otherwise, keep it local to
the hook.

```typescript
// useAuth.ts — local state (default pattern, sufficient for most apps)
const [authState, setAuthState] = useState<AuthState>(initialState);

// useAuth.ts — Zustand-backed for cross-component persistence
const authState = useAppStore(s => s.auth);
const setAuthState = useAppStore(s => s.setAuth);
```
