# BookSwap — Security Fixes

This document tracks security fixes applied to the BookSwap codebase.
Each entry links to the finding ID, commit, and regression test.

For the full adversarial review: `docs/adversarial-review/adversarial-review-2026-04-20.md`
For config/settings findings: `security-action-plan.md`

---

## Fixes

### ADV-101 — Apple Sign-In email spoofing → account takeover (🔴 Critical)
**Category**: Authentication bypass
**Attack**: Attacker with a valid Apple ID could hijack any BookSwap account by supplying the victim's email in the unsigned `request.data["user"]` body when Apple's JWT omitted the email claim.
**Fix**: Reject Apple tokens that lack a verified email in the signed JWT claims; never fall back to client-supplied email. Matches the existing Google auth pattern.
**Test**: `backend/bookswap/tests/test_security_adv101.py`
