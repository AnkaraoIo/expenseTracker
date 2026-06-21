# Beta Testing Guide

**Live app:** https://ankaraoio.github.io/expenseTracker/  
**Version:** 0.1.0-beta  
**Scope:** Personal use, single user, manual expense entry

---

## Install (testers)

1. Open the URL in **Safari** on iPhone
2. **Share → Add to Home Screen**
3. Open **Expenses** from home screen (not Safari tab)

---

## What to test (2-week beta)

### Daily use
- [ ] Add 3–5 real expenses (food, gas, shopping, etc.)
- [ ] Edit an expense (change amount or category)
- [ ] Delete an expense
- [ ] Check Dashboard totals match your expectations

### Dashboard
- [ ] Month navigation (previous / current month)
- [ ] Category breakdown shows correct splits
- [ ] Budget bar (optional — set in Settings)

### Expenses list
- [ ] Search by note or category name
- [ ] Day grouping (Today, Yesterday, dates)

### Settings
- [ ] Change currency — amounts update everywhere
- [ ] Set monthly budget — Dashboard shows progress
- [ ] **Export CSV backup** — file downloads/shares correctly

### Offline
- [ ] Turn off Wi‑Fi → app still opens from home screen
- [ ] Add expense offline → still saved when back online

---

## Known limits (beta)

| Limit | Planned |
|-------|---------|
| Manual entry only | Bank CSV import — later |
| Data on one device only | Multi-user / sync — next phase |
| No login | Accounts when sharing |
| Clearing Safari data deletes expenses | Cloud backup — later |

---

## Backup habit

**Export CSV once a week** from Settings. Beta data lives in your browser storage only — if you delete the app or clear site data, it's gone.

---

## Feedback

Open **Settings → Send beta feedback** in the app, or file an issue:

https://github.com/AnkaraoIo/expenseTracker/issues

Include:
- iPhone model + iOS version
- What you tried
- What you expected vs what happened
- Screenshot if possible

---

## Success criteria (move out of beta)

- You use it daily for 2+ weeks without losing data
- Dashboard totals feel trustworthy
- Export backup works
- Top 3 friction points collected from your own use

Then we decide: bank import vs multi-user sharing first.
