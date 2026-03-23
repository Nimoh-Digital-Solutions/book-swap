# Design System Documentation: The Archival Naturalist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Archival Naturalist."**

This system moves beyond the digital "template" look by treating the interface as a living, curated collection. It draws inspiration from heritage botanical libraries and vintage field journals, where structured, authoritative information meets the unpredictable beauty of nature. We achieve this through a high-end editorial lens: using intentional asymmetry, generous white space (breathing room), and a "tactile-first" philosophy.

Instead of a standard flat grid, layouts should feel like a series of layered documents, specimens, and notes. We prioritize tonal depth over structural lines, creating a premium experience that feels both historic and modern.

---

## 2. Colors
Our palette is rooted in the earth. It uses deep, immersive greens to establish authority and warm, cream-based neutrals to evoke the feeling of aged vellum and high-quality cardstock.

### Surface Hierarchy & Nesting
This system relies on **Tonal Layering** rather than borders.
* **The "No-Line" Rule:** Designers are strictly prohibited from using 1px solid borders to section content. Boundaries must be defined through background color shifts.
* **Layering Logic:** Use the `surface_container` tiers to create depth. For example, a main page starts at `surface`. Sections of secondary importance should sit on `surface_container_low` (#f5f5dc). Highly interactive "cards" or "specimens" should use `surface_container_highest` (#e4e4cc) to pop forward.

### Glass & Gradient Rules
* **Signature Textures:** For primary CTAs and hero headers, use subtle linear gradients transitioning from `primary` (#051a0f) to `primary_container` (#1a2f23). This provides a "velvet" depth that flat color cannot replicate.
* **Glassmorphism:** For floating navigational elements or overlays, use semi-transparent `surface` colors with a `backdrop-blur` of 12px–20px. This mimics a glass specimen slide, allowing the rich botanical greens to bleed through softly.

---

## 3. Typography
The typography is an intentional dialogue between the classic (the Library) and the modern (the Tool).

* **Display & Headlines (Newsreader):** Use the serif for all high-level storytelling. The high-contrast strokes of Newsreader evoke the elegance of a printed folio. **Intentional Asymmetry:** Don't be afraid to pull `display-lg` headings off-center or overlap them slightly with images to break the "web" feel.
* **Body & Titles (Work Sans):** Use the sans-serif for functional data. It provides a clean, utilitarian contrast to the serif. Work Sans is chosen for its high legibility in dense lists of botanical data.
* **Labels (Work Sans):** All metadata (e.g., dates, categories) must use `label-md` in uppercase with a `0.05rem` letter-spacing to feel like a stamped library index.

---

## 4. Elevation & Depth
In "The Archival Naturalist," depth is organic, not artificial.

* **The Layering Principle:** Stacking is our primary method of hierarchy. A `surface_container_lowest` (#ffffff) card placed on a `surface_container_low` (#f5f5dc) background creates a "natural lift" that mimics a sheet of paper resting on a wooden desk.
* **Ambient Shadows:** If a component must float, use a shadow with a 32px blur and 4%–6% opacity. The shadow color must be a tinted version of `on_surface` (#1b1d0e), never a pure neutral gray.
* **The "Ghost Border" Fallback:** If a container requires an edge (e.g., for accessibility), use the `outline_variant` token at **15% opacity**. This creates a "pressed" paper effect rather than a hard digital stroke.

---

## 5. Components

###  Buttons  
* **Primary:** A gradient of `primary` to `primary_container`. Text in `on_primary`. Shape: `md` (0.375rem).
* **Secondary (Action):** Use the warm terracotta `secondary` (#974723). This is our "human" color, used for engagement.
* **Tertiary (Golden Accent):** Use `tertiary_container` (#d4a503) for soft-call-to-actions like "Add to Collection."

### Tactile Cards
* **Style:** Forbid dividers. Use `surface_container_highest` for the card background. Use `16` (5.5rem) vertical spacing between cards in a list to allow each "specimen" to breathe.
* **The Specimen Card:** A card variation using a 1px "Ghost Border" and a subtle `surface_bright` inner glow to make it look like a physical archive box.

### Input Fields
* **Style:** Minimalist. No four-sided boxes. Use a single bottom border (0.5px) using the `outline` token. Label in `label-md` sits above the line.
* **Focus State:** The bottom line transitions to `secondary` (terracotta) with a subtle golden `tertiary` glow.

### Additional Component: The "Archival Index"
* A specialized list item for book or plant metadata. It uses a `surface_variant` background with a `tertiary_fixed_dim` bullet point. It lacks borders, relying on a shift to `surface_container_low` on hover.

---

## 6. Do's and Don'ts

### Do:
* **Do** use asymmetrical margins (e.g., a wider left margin than right) for editorial article layouts.
* **Do** lean into "Natural Textures." If an image background is used, ensure it has a subtle grain or "paper" noise overlay.
* **Do** use the `24` (8.5rem) spacing token for major section breaks to emphasize a sense of "quiet" library space.

### Don't:
* **Don't** use 100% black. The darkest point of this system is `on_primary_fixed` (#0a2014), a deep, obsidian green.
* **Don't** use sharp corners. Always stick to the `md` or `lg` rounding scale to maintain an organic, softened feel.
* **Don't** use standard horizontal dividers (`
`). Separate content using background color blocks from the `surface_container` scale.

* **Don't** overcrowd. If the design feels "busy," increase the spacing token by one tier. This system succeeds through "luxury of space."