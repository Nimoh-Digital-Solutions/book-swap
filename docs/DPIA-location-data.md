# Data Protection Impact Assessment (DPIA) — Location Data

> **Status**: Placeholder — requires legal review before launch.

## 1. Description of Processing

BookSwap collects approximate user location (latitude / longitude) to enable
proximity-based book browsing. Location is obtained during onboarding via the
user's browser geolocation API or by manual address entry (geocoded server-side).

## 2. Necessity and Proportionality

- Location is essential to the core feature: finding nearby books to swap.
- Only city-level precision is stored (coordinates rounded to ~100 m).
- Location is never shared with third parties.
- Users can update or remove their location at any time from Settings.

## 3. Risks to Data Subjects

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Precise home address inference | Medium | High | Round coordinates; never expose raw location to other users — only show neighbourhood name and distance |
| Unauthorised access to location DB | Low | High | Encrypted at rest (PostgreSQL); access restricted to application service account |
| Location tracking over time | Low | Medium | Only one location stored per user (latest); no location history retained |

## 4. Measures to Mitigate Risks

- Coordinates stored with reduced precision (~100 m).
- PostGIS queries use radial distance, not exact point matching.
- TLS in transit; AES-256 encryption at rest.
- GDPR data export includes location data so users can verify what is stored.
- Account deletion permanently removes all location data.

## 5. Consultation

- [ ] Internal review by engineering lead
- [ ] External review by privacy counsel (scheduled pre-launch)

## 6. Sign-off

| Role | Name | Date |
|------|------|------|
| Data Controller | — | — |
| DPO / Legal | — | — |
