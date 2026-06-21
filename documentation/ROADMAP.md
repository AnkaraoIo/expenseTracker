# Product Roadmap

## Phase 0 — Beta (now)

**Status:** Live  
**URL:** https://ankaraoio.github.io/expenseTracker/

- PWA, Add to Home Screen, $0, never expires
- Manual expense entry
- Dashboard, categories, budget, CSV export
- Single user, data on device only

See [BETA.md](BETA.md) for testing checklist.

---

## Phase 1 — Bank import (personal)

**Goal:** Less typing, still $0

- CSV import for BoA, DCU, TJ Maxx
- Dedupe + skip transfers/payments
- Merchant → category rules

No backend required. Stays private on your phone.

---

## Phase 2 — Multi-user sharing (next discussion)

**Goal:** Share expenses with partner / household

This changes architecture — needs planning before building.

### Likely approach (when ready)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  User A     │     │  Backend    │     │  User B      │
│  (PWA/app)  │────▶│  + auth     │◀────│  (PWA/app)   │
└─────────────┘     │  + Postgres │     └──────────────┘
                    └─────────────┘
                           │
                    Shared "household"
                    expenses + categories
```

### Decisions needed later

| Question | Options |
|----------|---------|
| Who can see what? | Shared household vs invite-only |
| Auth | Email magic link, Apple Sign In |
| Hosting cost | ~$5–15/mo (Railway, Supabase, Fly) |
| Free tier | Likely limited — sync is not free to run |
| Privacy | Encrypt at rest, no selling data |

### Not in multi-user v1

- Bank linking for all users (expensive)
- Split bills / Venmo integration
- Accountant export

---

## Phase 3 — Optional polish

- iCloud / cloud sync (single user)
- Widgets
- Recurring expenses
- App Store native app ($99/yr if published)

---

## Current recommendation

1. **Beta now** — use manually, export weekly CSV  
2. **Phase 1** — bank CSV when manual entry gets old  
3. **Phase 2** — multi-user only if you have a real second user (partner, roommate) ready to test

Don't build sharing until beta proves you actually use the app daily.
