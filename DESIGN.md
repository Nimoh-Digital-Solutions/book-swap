# BookSwap — Unified Design System

This document describes how visual language, typography, and interaction patterns work across **BookSwap** surfaces. For implementation-level detail, the web and mobile codebases each own canonical token files; this page ties them together and states shared principles.

---

## 1. Brand identity

**BookSwap** is a community book exchange: people meet around stories, trust, and locality rather than anonymous commerce. The brand should feel **warm**, **trustworthy**, and **grounded in place**—whether someone is listing a paperback on the web or confirming a handoff in the mobile app.

Design choices should reinforce:

- **Community** — human-scale interactions, clear names and context, no cold “marketplace” sterility.
- **Trust** — predictable patterns, readable hierarchy, honest status and error communication.
- **Locality** — maps, meetups, and neighborhood context are first-class; UI should not fight geography or real-world coordination.

---

## 2. Platform-adaptive approach

BookSwap deliberately uses **different visual systems** on web vs mobile:

| Dimension | Web (React SPA) | Mobile (React Native) |
|-----------|------------------|------------------------|
| **Character** | Editorial, premium, “living archive” | Native, efficient, system-aligned |
| **Color** | Earth tones, vellum surfaces, obsidian green primary | Brand blue/amber with Tailwind-style neutrals |
| **Type** | Newsreader + Work Sans | System fonts, fixed scale |
| **Density** | Generous whitespace, asymmetry where it helps story | Compact rhythm, standard touch targets |
| **Motion / chrome** | Tonal layering, tinted shadows, minimal hard borders | Elevation shadows, explicit radii, light/dark palettes |

**Why:** The web app is often used for discovery, browsing, and longer reading; it can afford a distinctive, magazine-like feel. Mobile is used on the go for notifications, chat, and quick actions; it should feel familiar to platform users and remain maintainable with a compact token set.

**Consistency** is enforced through **shared semantics** (success/error/warning, accessibility expectations, spacing rhythm where comparable), not pixel-identical styling across platforms.

---

## 3. Web design system — “The Archival Naturalist”

Canonical reference: [`frontend/src/styles/DESIGN.md`](frontend/src/styles/DESIGN.md) (full narrative, component rules, do’s and don’ts).

### 3.1 Palette (summary)

| Role | Token / usage | Hex (representative) |
|------|----------------|----------------------|
| Primary | Deep obsidian green | `#051a0f` |
| Primary container | Layering / gradients | `#1a2f23` |
| Secondary | Terracotta (“human” actions) | `#974723` |
| Tertiary / accent | Golden | `#d4a503` |
| Surfaces | Cream / vellum / paper | `#f5f5dc`, `#e4e4cc`, `#ffffff` |

### 3.2 Typography

- **Newsreader** — display and headlines (serif, editorial).
- **Work Sans** — body, UI labels, metadata (sans-serif).

### 3.3 Surfaces, elevation, layout

- **Tonal layering** defines hierarchy; avoid relying on 1px borders for structure (“No-Line Rule” in the web doc).
- **Shadows** use **tinted**, low-opacity ambient shadows—not flat gray boxes.
- **Spacing** favors **generous whitespace** and an editorial rhythm (major breaks use large spacing tokens as described in `frontend/src/styles/DESIGN.md`).

Implementers should follow the web `DESIGN.md` for gradients, glass overlays, button variants, cards, and input treatments.

---

## 4. Mobile design system

Canonical references:

- Light theme: [`mobile/src/constants/theme.ts`](mobile/src/constants/theme.ts)
- Dark theme: [`mobile/src/constants/darkColors.ts`](mobile/src/constants/darkColors.ts)

### 4.1 Brand and neutrals

| Role | Light (typical) | Notes |
|------|-----------------|--------|
| Brand primary | `#2563EB` | Primary actions, links |
| Brand primary (dark) | `#1D4ED8` | Pressed / emphasis |
| Brand secondary | `#F59E0B` | Secondary brand moments |
| Secondary hover | `#D97706` | Interactive secondary |
| Accent | `#10B981` | Positive / accent highlights |
| Neutrals | `#F9FAFB` → `#111827` | Tailwind gray scale in `colors.neutral` |

### 4.2 Typography

- **System fonts** only (no bundled custom font families in the theme constants).
- **Scale** — eight named sizes in `typography`: `title`, `subtitle`, `label`, `input`, `body`, `button`, `link`, `small` (see `theme.ts` for `fontSize` / `fontWeight` / `lineHeight`).

### 4.3 Spacing, radius, shadows

- **Spacing** — `4 / 8 / 16 / 24 / 32 / 48` (`xs` through `2xl` in `spacing`).
- **Radius** — `4 / 8 / 12 / 16 / 20` plus **pill** (`100`) in `radius`.
- **Shadows** — `button` (elevation 4), `card` (elevation 2), `elevated` (elevation 6); see `shadows` in `theme.ts`.

### 4.4 Dark mode

- **`darkColors.ts`** mirrors the structure of `colors` with **darkened surfaces**, inverted neutrals, and adjusted brand accents (e.g. lighter blue primary `#60A5FA` for contrast on dark backgrounds).
- Components should consume **semantic** keys (`brand.primary`, `text.primary`, `surface.warm`, etc.) so light/dark switching stays centralized.

---

## 5. Shared principles (web + mobile)

### 5.1 Accessibility

- Meet **WCAG 2.x** contrast for text and interactive controls; on web, prefer semantic HTML and documented focus states; on mobile, respect platform font scaling where applicable.
- Do not rely on **color alone** for state (pair with icons, labels, or patterns).
- **Focus** and **error** messaging must be perceivable by keyboard and screen-reader users (web) and accessibility APIs (mobile).

### 5.2 Spacing rhythm

- Both systems use a **modular scale**—web with editorial large jumps, mobile with **4-based** steps. Prefer **consistent multiples** within each platform over arbitrary pixel values.
- When adding features, **reuse existing tokens** before introducing one-off margins.

### 5.3 Color semantics (status / error / success)

Align **meaning** across platforms even when hex values differ:

| Semantic | Typical use |
|----------|-------------|
| **Error** | Form validation, failed actions, destructive emphasis |
| **Warning** | Attention without immediate failure |
| **Success** | Completed exchange step, saved state, positive confirmation |
| **Info** | Neutral system messages |

On **mobile**, see `colors.status`, `colors.border.error`, and related keys in `theme.ts` / `darkColors.ts`. On **web**, map UI states to the design tokens documented in `frontend/src/styles/DESIGN.md` (e.g. secondary/tertiary for accents, outlined “ghost” borders for edge cases).

---

## 6. Adding new design tokens

### When to add a token

Add a token when:

- The same visual value appears in **multiple components** or screens, or
- You need **semantic stability** (e.g. “success banner background”) across light/dark or future theming.

Avoid adding tokens for **one-off** screens unless the pattern is expected to repeat.

### How to add them

1. **Web** — Extend the project’s SCSS/token sources under `frontend/src/styles/` per existing patterns; update [`frontend/src/styles/DESIGN.md`](frontend/src/styles/DESIGN.md) if the change affects principles or component rules.
2. **Mobile** — Add keys to [`mobile/src/constants/theme.ts`](mobile/src/constants/theme.ts) and, if used in dark mode, mirror semantics in [`mobile/src/constants/darkColors.ts`](mobile/src/constants/darkColors.ts). Export types follow `as const` patterns already in those files.
3. **Cross-platform** — If the concept is shared (e.g. a new **status** color), document the **semantic name** here or in product docs, and implement **per-platform** values that meet contrast requirements.
4. **Consumption** — Prefer semantic names (`surface.warm`, `status.error`) over raw hex in components.
5. **Review** — For user-visible changes, consider a quick **contrast check** and a **screenshot or Storybook** update on web; on mobile, verify **light and dark**.

---

## Document map

| Audience | Primary reference |
|----------|-------------------|
| Web implementation | [`frontend/src/styles/DESIGN.md`](frontend/src/styles/DESIGN.md) |
| Mobile light theme | [`mobile/src/constants/theme.ts`](mobile/src/constants/theme.ts) |
| Mobile dark theme | [`mobile/src/constants/darkColors.ts`](mobile/src/constants/darkColors.ts) |

---

*This file is the umbrella narrative; keep it in sync when brand direction or cross-platform semantics change.*
