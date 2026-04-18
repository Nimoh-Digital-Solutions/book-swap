# BookSwap — Screenshot Checklist

Screenshots needed for both stores. Capture on real devices or simulators
at the exact resolutions listed.

---

## Required Screen Captures (content)

Capture these 6 key screens in order (both light and dark mode):

1. **Home screen** — showing nearby books, community stats
2. **Browse map** — map view with book markers and radius
3. **Book detail** — a book listing with owner info and swap button
4. **Barcode scanner** — scanning a book barcode
5. **Exchange detail** — an active swap with chat
6. **Profile** — user profile with stats and bio

---

## Apple App Store — Required Sizes

| Device class | Resolution (px) | Required? |
|-------------|-----------------|-----------|
| 6.7" (iPhone 15 Pro Max) | 1290 x 2796 | Yes (mandatory) |
| 6.5" (iPhone 11 Pro Max) | 1242 x 2688 | Yes (mandatory) |
| 5.5" (iPhone 8 Plus) | 1242 x 2208 | Recommended |
| 12.9" iPad Pro | 2048 x 2732 | Required if supportsTablet is true |

**Format:** PNG or JPEG, no alpha channel, no rounded corners (Apple adds them)
**Count:** 2-10 per device class

---

## Google Play — Required Sizes

| Asset | Resolution (px) | Required? |
|-------|-----------------|-----------|
| Phone screenshots | min 320px, max 3840px (any side) | Yes (min 2) |
| Feature graphic | 1024 x 500 | Yes |
| 7" tablet screenshots | min 320px | Recommended |
| 10" tablet screenshots | min 320px | Recommended |

**Format:** PNG or JPEG, 24-bit, no alpha
**Count:** 2-8 per device type

---

## App Icon Requirements

| Store | Size | Format | Notes |
|-------|------|--------|-------|
| Apple | 1024 x 1024 | PNG | No alpha, no rounded corners |
| Google | 512 x 512 | PNG (32-bit) | No alpha |

Current icon: `mobile/assets/icon.png` — verify it meets the 1024x1024 spec.

---

## Tips

- Use device frames (optional) for a polished look
- Keep text overlays minimal and in all 3 languages
- Show real content (seed data), not empty states
- Dark mode screenshots are a nice addition but not required
- For the feature graphic (Google), use your brand colors (#1a2f23) with
  the app icon and tagline
