# ExpenseTracker

A native iOS personal expense tracker built with **SwiftUI** and **SwiftData**. Track daily spending, view monthly totals, and break down expenses by category — all stored locally on device.

## Requirements

- macOS with **Xcode 15+**
- iOS **17.0+** simulator or device
- Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` if `xcodebuild` points to Command Line Tools only

## Features

- **Dashboard** — monthly total, optional budget progress, category bar chart, recent transactions
- **Expenses** — searchable list grouped by day, swipe to delete, tap to edit
- **Add expense** — amount, category grid, date, optional note
- **Settings** — currency, monthly budget, category management, CSV export
- **Local-first** — no account or backend required

## Getting started

1. Open `ExpenseTracker.xcodeproj` in Xcode
2. Select an iPhone simulator (e.g. iPhone 15)
3. Press **Run** (⌘R)

On first launch, default categories (Food, Transport, Housing, etc.) are seeded automatically.

## Project structure

```
ExpenseTracker/
├── ExpenseTrackerApp.swift
├── Models/           Expense, Category, AppSettings
├── Views/            Dashboard, Expenses, Add, Settings
├── Components/       Amount field, category picker, month navigator
├── Services/         Seed data, queries, CSV export
└── Extensions/       Currency formatting, date helpers
```

## Roadmap

- iCloud sync via SwiftData CloudKit
- Home screen widgets
- Per-category budgets
- Recurring expenses

## Best standalone app ($0, never expires)

**Use the PWA** — not the Xcode app — for personal use with zero refresh hassle.

Full guide: **[documentation/STANDALONE_APP.md](documentation/STANDALONE_APP.md)**

1. GitHub → **Settings → Pages → Deploy from branch → main → /docs**
2. Open **https://ankaraoio.github.io/expenseTracker/** on iPhone Safari
3. **Add to Home Screen**

Opens full-screen from your home screen forever. No Mac, no 7-day expiry.

## No weekly Mac connection ($0)

See **[documentation/NO_MAC_WEEKLY.md](documentation/NO_MAC_WEEKLY.md)** for SideStore (native app) option.

## Bundle ID

`com.expensetracker.app` — change in Xcode target settings before App Store submission.
