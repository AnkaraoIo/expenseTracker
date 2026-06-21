# Standalone iPhone App — $0, Never Expires

This is the **recommended** way to use ExpenseTracker for personal use.

Apple only allows **permanent** installs without refresh via:
- **$99/year** App Store / Developer Program, or
- **Add to Home Screen** PWA on HTTPS (free forever)

The PWA in [`web/`](../web/) is a real standalone app on iPhone: full screen, home screen icon, works offline, data stays on your device.

---

## One-time setup (~10 minutes)

### 1. Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `expense-tracker`
3. Public repo (required for free GitHub Pages)
4. Create repository

### 2. Push this project (or just the `web` folder)

From your Mac:

```bash
cd /Users/kita/Projects/ExpenseTracker
git init
git add web .github
git commit -m "ExpenseTracker standalone PWA"
git branch -M main
git remote add origin https://github.com/AnkaraoIo/expenseTracker.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### 3. Enable GitHub Pages

1. Repo → **Settings → Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. After the workflow runs, your app is live at:

```
https://ankaraoio.github.io/expenseTracker/
```

(Check the **Actions** tab — first deploy takes 1–2 minutes.)

### 4. Install on iPhone (once)

1. Open the URL in **Safari** (not Chrome)
2. Tap **Share** (square with arrow)
3. **Add to Home Screen**
4. Tap **Add**

Done. Open **Expenses** from your home screen like any app.

---

## What you get

| Feature | |
|--------|---|
| Cost | **$0** |
| Expires / refresh | **Never** |
| Mac needed again | **No** |
| Internet needed | Only first load (then offline works) |
| Data location | On your iPhone only |
| App Store | Not required |

---

## Features

- Dashboard with monthly total & category breakdown
- Add / edit / delete expenses
- Search & day grouping
- Currency & budget settings
- CSV export

---

## Updating the app

Edit files in `web/`, push to GitHub:

```bash
git add web && git commit -m "Update app" && git push
```

Wait ~1 min for deploy. Open the app once on Wi‑Fi to refresh (or it updates automatically on next online visit).

---

## Local test (optional)

Same Wi‑Fi only — not permanent:

```bash
./scripts/serve-pwa.sh
```

Use GitHub Pages for the real standalone install.

---

## Native SwiftUI app?

The Xcode app in this repo is great for development, but **free Apple signing always expires in ~7 days**. For zero hassle personal use, use this PWA instead.
