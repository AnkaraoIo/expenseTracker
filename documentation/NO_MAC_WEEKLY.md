# Use ExpenseTracker Without Plugging Into Mac Every Week ($0)

Apple's free signing expires apps after **~7 days**. Two **$0** ways to avoid weekly USB + Xcode:

| Path | Mac needed again? | Refresh | Best for |
|------|-------------------|---------|----------|
| **A. PWA (recommended)** | Once to host, or use local Wi‑Fi | **Never** | Set-and-forget personal use |
| **B. SideStore** | Once to set up SideStore | Auto over Wi‑Fi every ~7 days | Keep native SwiftUI app |

---

## Path A — PWA (never expires, no refresh)

A web version lives in [`web/`](../web/). Same idea: add expenses, dashboard, categories, CSV export. Data stays in **localStorage on your iPhone**.

### Option A1: Host on GitHub Pages (one-time, ~5 min)

1. Create a **public** GitHub repo (e.g. `expense-tracker-pwa`)
2. Copy the `web/` folder contents into the repo root
3. **Settings → Pages → Deploy from branch `main` / root**
4. On iPhone Safari, open `https://YOUR_USERNAME.github.io/expense-tracker-pwa/`
5. Tap **Share → Add to Home Screen**

Done. Opens like an app, **no 7-day limit**, no Mac after this.

### Option A2: Same Wi‑Fi, no GitHub (good for testing)

On your Mac, in the project folder:

```bash
cd /Users/kita/Projects/ExpenseTracker/web
python3 -m http.server 8080
```

On iPhone (same Wi‑Fi), Safari → `http://YOUR_MAC_IP:8080`  
(e.g. `http://192.168.1.42:8080`)

**Add to Home Screen** while on that page.

Note: iPhone must reach that URL when first installed; offline works after service worker caches (same origin). For daily use without Mac on your network, use **GitHub Pages (A1)**.

---

## Path B — SideStore (native app, auto-refresh over Wi‑Fi)

Keeps your **SwiftUI** app. After one-time setup, SideStore refreshes signatures in the background — **no USB cable every week**.

### One-time setup

1. **Install SideStore** on your iPhone  
   - https://sidestore.io  
   - Follow their installer (needs Mac or Windows **once**)

2. **Sign in** with your free Apple ID inside SideStore

3. **Build an IPA** on your Mac (one time, or when you change the app):

```bash
cd /Users/kita/Projects/ExpenseTracker
./scripts/build-ipa.sh
```

Output: `build/ExpenseTracker.ipa`

4. **AirDrop** the `.ipa` to your iPhone, open with **SideStore**, install

5. In SideStore → **Settings** → enable **Background Refresh**

### Weekly behavior (automatic)

- SideStore refreshes apps before they expire (~7 days)
- Works over **Wi‑Fi** — Mac can be off
- Free Apple ID limit: **3 apps** including SideStore itself
- Keep SideStore + ExpenseTracker = 2 of 3 slots

### If refresh fails

- Open SideStore on Wi‑Fi and tap refresh manually
- Still no USB required in most cases

---

## Which should you pick?

- **Want zero maintenance forever?** → **PWA (Path A)** + GitHub Pages  
- **Want native SwiftUI feel?** → **SideStore (Path B)**

You can use **both**: native app via SideStore + PWA as backup.

---

## Free Apple ID limits (both paths)

- **$0** cost
- Max **3 sideloaded apps** at once (SideStore counts as one)
- SideStore/PWA do **not** need the $99/year Developer Program

---

## Quick start (recommended)

```bash
# 1. Try PWA locally right now
cd /Users/kita/Projects/ExpenseTracker/web && python3 -m http.server 8080

# 2. On iPhone Safari: http://<mac-ip>:8080 → Add to Home Screen

# 3. For permanent hosting, push web/ to GitHub Pages (see A1)
```
