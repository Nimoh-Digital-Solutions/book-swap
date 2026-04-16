# BookSwap — Brand Asset Generation Prompts

Prompts for generating the BookSwap logo, app icons, favicon, and related brand assets using an AI image generation tool (e.g. Nano Banana).

**Strategy:** Start with Prompt 1 (primary logo) and nail the symbol — everything else derives from it. Once you're happy with the mark, the app icon, favicon, and splash all flow naturally from the same symbol.

---

## 1. Primary Logo (Symbol + Wordmark)

> Design a clean, modern logo for "BookSwap" — a peer-to-peer book exchange platform connecting readers in local neighbourhoods. The logo should combine a minimal symbol with a wordmark.
>
> **Symbol concept:** Two books mid-exchange, forming a gentle circular motion or swap gesture (like two arrows curving around each other, but shaped as book spines/pages). Alternatively: an open book with a location pin subtly integrated, or two overlapping book silhouettes with a handshake/swap implied by negative space.
>
> **Color palette:** Primary deep obsidian green (#051a0f or #1a2f23), with terracotta (#974723) or golden accent (#d4a503). Cream/off-white (#f5f5dc) background version. The feel should be warm, trustworthy, and grounded — not cold or corporate.
>
> **Typography:** The wordmark "BookSwap" should use a serif or semi-serif for "Book" (editorial, literary feel) and a clean sans-serif for "Swap" (modern, action-oriented). Alternatively, a single warm geometric sans-serif.
>
> **Style:** Flat/minimal with subtle craft — think independent bookshop meets modern app. No gradients, no 3D. Should work at 16px (favicon) and on a billboard. Avoid cliches like literal hands shaking or generic recycling arrows.
>
> **Tagline (optional lockup):** "Spend less, read more."
>
> **Deliverables:** Symbol-only mark, full wordmark lockup (horizontal), stacked lockup (vertical). Show on white, on cream (#f5f5dc), and on dark green (#051a0f) backgrounds.

---

## 2. Mobile App Icon (iOS + Android)

> Design a mobile app icon for "BookSwap," a peer-to-peer book exchange app. The icon should use only the **symbol mark** from the BookSwap logo (no text).
>
> **Requirements:**
> - Must be instantly recognizable at 60x60px on a phone home screen
> - iOS: rounded square (no need to add the mask — Apple applies it). Android: adaptive icon with distinct foreground element and solid/gradient background layer
> - Primary background: deep green (#1a2f23) or warm cream (#f5f5dc). Foreground symbol in contrasting color — golden (#d4a503) or terracotta (#974723) on dark, obsidian green on light
> - Should feel warm, literary, and community-focused — not sterile or corporate
> - Clean silhouette that reads well in both light and dark mode docks
>
> **Show variations:** dark background + light symbol, light background + dark symbol. Show it mocked up on an iOS home screen alongside familiar apps for scale reference.
>
> **Sizes needed:** 1024x1024 (App Store), 512x512 (Play Store), 180x180 (iOS), 192x192 and 512x512 (Android adaptive)

---

## 3. Favicon & Web Manifest Icons

> Design a favicon set for "BookSwap" based on the symbol mark from the logo. Must be **pixel-crisp and legible at every size** — the tiniest version (16x16) should still be recognizable.
>
> **Sizes:** 16x16, 32x32, 48x48 (ICO/PNG favicons), 180x180 (Apple touch icon), 192x192 and 512x512 (PWA manifest icons)
>
> **Style:** At 16x16 and 32x32, simplify the symbol to its most essential shape — possibly just the book-swap motif reduced to 2-3 strokes. Use the deep green (#1a2f23) on transparent, and a version with cream (#f5f5dc) background. No fine detail that disappears at small sizes.
>
> **Show:** each size at 1:1 and enlarged so detail is visible. Include a browser tab mockup.

---

## 4. Splash / Launch Screen (Mobile)

> Design a mobile splash screen (launch screen) for the "BookSwap" app shown while the app loads.
>
> **Layout:** Centered BookSwap logo (symbol + wordmark, stacked) on a full-bleed background.
>
> **Light version:** Cream/warm white (#f5f5dc) background, deep green (#051a0f) logo
> **Dark version:** Deep green (#0a1f14) background, cream/golden logo
>
> **Subtle texture:** Very faint paper/linen grain to reinforce the "literary" feel — barely visible, never busy.
>
> **Size:** Design at 1290x2796 (iPhone 15 Pro Max) and 1080x2400 (Android). Show both portrait orientations.
>
> **Do NOT include:** loading spinners, progress bars, or any UI chrome — just the brand mark, centered, with generous breathing room.

---

## 5. Open Graph / Social Preview Image

> Design a social sharing preview image (Open Graph) for "BookSwap" — shown when the link is shared on Twitter/X, LinkedIn, WhatsApp, etc.
>
> **Size:** 1200x630 pixels
>
> **Content:** BookSwap logo (symbol + wordmark) on the left or centered, tagline "Spend less, read more." below. Subtle illustration of books or a neighbourhood/map motif in the background. Deep green (#051a0f) background with cream and golden accents, or warm cream background with green elements.
>
> **Feel:** Inviting, warm, community. Someone seeing this should think "book lovers in my neighbourhood" not "another marketplace."

---

## 6. Adaptive Icon Foreground Layer (Android-specific)

> Design the **foreground layer only** for an Android adaptive icon for "BookSwap." This will be composited over a solid deep green (#1a2f23) background circle/squircle by the OS.
>
> **Requirements:** The symbol must sit within the safe zone (66% of 108dp — the center 72dp). Transparent background on this layer. Symbol in golden (#d4a503) or cream (#f5f5dc). Keep the design simple enough that it works across circle, squircle, rounded square, and teardrop masks.

---

## Asset Checklist

| Asset | Sizes | Format |
|-------|-------|--------|
| Logo (symbol only) | SVG + PNG @2x | `.svg`, `.png` |
| Logo (horizontal lockup) | SVG + PNG @2x | `.svg`, `.png` |
| Logo (stacked lockup) | SVG + PNG @2x | `.svg`, `.png` |
| Favicon | 16, 32, 48 | `.ico`, `.png` |
| Apple Touch Icon | 180x180 | `.png` |
| PWA Icons | 192, 512 | `.png` |
| Android Adaptive (fg) | 432x432 (108dp @4x) | `.png` |
| iOS App Icon | 1024x1024 | `.png` |
| Play Store Icon | 512x512 | `.png` |
| Splash (light + dark) | 1290x2796, 1080x2400 | `.png` |
| OG Image | 1200x630 | `.png` |

---

## Brand Reference

| Token | Hex | Usage |
|-------|-----|-------|
| Deep obsidian green | `#051a0f` | Primary / dark backgrounds |
| Green container | `#1a2f23` | Layering, app icon bg |
| Terracotta | `#974723` | Secondary / human actions |
| Golden | `#d4a503` | Accent, highlights |
| Cream / vellum | `#f5f5dc` | Light surfaces |
| Paper white | `#e4e4cc` | Alternate light surface |
| Mobile brand blue | `#2563EB` | Mobile primary |
| Mobile amber | `#F59E0B` | Mobile secondary |
| Mobile accent green | `#10B981` | Mobile positive/accent |
