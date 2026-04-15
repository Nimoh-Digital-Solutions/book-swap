# BookSwap — Feature Catalogue

High-level view of domain features and where they live. Status reflects the product roadmap as understood from the BookSwap domain; adjust per release.

| Feature | Layer | Status | Notes |
|--------|-------|--------|-------|
| User registration & login | BE / FE / Mobile | Done | JWT via httpOnly cookies (web); SecureStore on mobile; CSRF on web API. |
| Password reset & account security | BE / FE / Mobile | In Progress | Align flows across web and Expo. |
| Profile & preferences | BE / FE / Mobile | Done | Includes locale (EN/FR/NL). |
| Book CRUD (create, read, update, delete) | BE / FE / Mobile | Done | Core listing lifecycle. |
| Browse & search (list views) | FE / Mobile | Done | Backend list/filter APIs. |
| Map discovery & clustering | BE / FE | Done | PostGIS queries; Leaflet map on web. |
| Exchanges (propose, accept, counter, complete) | BE / FE / Mobile | Done / In Progress | Domain varies by swap state machine completeness. |
| Real-time chat (WebSocket) | BE / FE / Mobile | In Progress | Channels backend; web client; mobile parity. |
| In-app / push notifications | BE / FE / Mobile | In Progress | Celery + provider; mobile push registration. |
| Ratings & reviews | BE / FE / Mobile | In Progress | Trust layer for swap partners. |
| Reporting & moderation hooks | BE / FE | In Progress | trust_safety domain. |
| Wishlist | BE / FE / Mobile | Planned | Saved titles / alerts. |
| Barcode scanning & ISBN lookup | FE / Mobile | Done / In Progress | Faster add flow; depends on external metadata APIs. |
| Push notifications (device tokens) | BE / Mobile | In Progress | Expo / FCM / APNs integration. |
| Biometric auth (app unlock) | Mobile | Planned | Local device UX; complements server auth. |
| Offline support (cached lists, queued actions) | FE / Mobile | Planned | PWA and/or Expo offline strategies. |

**Legend — Layer**: BE = Django API and workers; FE = React web app; Mobile = Expo app.  
**Legend — Status**: **Done** = shipped in main path; **In Progress** = partial or active build; **Planned** = on roadmap.
