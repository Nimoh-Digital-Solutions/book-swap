# BookSwap — Product Overview

BookSwap is a **community-driven book exchange platform**. People list books they own, discover titles near them on a map, and arrange swaps with other readers—without a traditional storefront or shipping-first model.

## Core experience

- **Listings**: Users add books they are willing to swap, with enough detail for others to decide quickly (title, condition, availability).
- **Discovery**: A **map-centric** experience helps users find books and swap partners **nearby**, powered by **PostGIS** for geographic queries and sensible clustering at different zoom levels.
- **Swaps**: The product supports **arranging exchanges**—matching intent, availability, and meet-up or handoff preferences—so swaps stay practical for real-world use.

## Standout features

| Area | What BookSwap offers |
|------|----------------------|
| **Onboarding inventory** | **Barcode scanning** for fast **ISBN lookup**, reducing manual typing when adding books. |
| **Maps** | **PostGIS-powered** discovery with **clustering** so dense urban areas stay usable. |
| **Communication** | **Real-time chat** over **WebSockets** for coordinating swaps. |
| **Engagement** | **Push notifications** for messages and important swap updates. |
| **Trust** | **Trust & safety** tooling including **ratings** and **reporting** to keep the community healthy. |
| **Reach** | **Multi-language** support: **English, French, and Dutch** for Belgium and the Netherlands. |

## Target audience and geography

The primary focus is **urban and suburban readers in Belgium and the Netherlands**—areas where density makes map-based discovery and in-person handoffs natural. The product should feel fast, local, and trustworthy.

## Monetization

BookSwap is **free** at its core. Future **premium** options may include **priority listing**, **wider search radius**, or other power-user features—without locking basic swapping behind a paywall.
