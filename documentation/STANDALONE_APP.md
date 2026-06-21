# Standalone iPhone App — $0, Never Expires

Permanent install via **Add to Home Screen**. No refresh, no Mac, no Enterprise account.

---

## Step 1 — Enable GitHub Pages (free personal account)

Do **not** use GitHub Actions if it asks for Enterprise.

1. Open [github.com/AnkaraoIo/expenseTracker/settings/pages](https://github.com/AnkaraoIo/expenseTracker/settings/pages)
2. **Build and deployment → Source:** choose **Deploy from a branch**
3. **Branch:** `main` → folder **`/docs`** → **Save**
4. Wait 1–2 minutes

Your app URL:

```
https://ankaraoio.github.io/expenseTracker/
```

---

## Step 2 — Install on iPhone (once)

1. Open the URL above in **Safari** (not Chrome)
2. **Share** (square with arrow) → **Add to Home Screen**
3. Tap **Add**

Open **Expenses** from your home screen — full screen, like a native app.

---

## If GitHub Pages still blocked

Use **Cloudflare Pages** (also free, no Enterprise):

1. Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create project → Connect GitHub** → select `AnkaraoIo/expenseTracker`
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `docs`
4. Deploy → use the `*.pages.dev` URL → Add to Home Screen in Safari

---

## What you get

| | |
|--|--|
| Cost | **$0** |
| Expires | **Never** |
| Mac needed | **No** (after setup) |
| Data | On your iPhone only |
| Enterprise account | **Not required** |

---

## Update the app

Edit files in `web/`, copy to `docs/`, push:

```bash
cd /Users/kita/Projects/ExpenseTracker
cp -R web/* docs/
git add docs && git commit -m "Update app" && git push
```

Pages redeploys in ~1 minute.
