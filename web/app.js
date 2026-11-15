const STORAGE_KEY = "expense-tracker-pwa";
const APP_VERSION = "0.2.3-beta";
const BACKUP_KEY = "expense-tracker-last-backup";
const FEEDBACK_URL = "https://github.com/AnkaraoIo/expenseTracker/issues/new";

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food", emoji: "🍔", color: "#FF9500" },
  { id: "transport", name: "Transport", emoji: "🚗", color: "#007AFF" },
  { id: "housing", name: "Housing", emoji: "🏠", color: "#5856D6" },
  { id: "shopping", name: "Shopping", emoji: "🛍️", color: "#FF2D55" },
  { id: "health", name: "Health", emoji: "❤️", color: "#34C759" },
  { id: "fun", name: "Fun", emoji: "🎬", color: "#AF52DE" },
  { id: "bills", name: "Bills", emoji: "📄", color: "#FF3B30" },
  { id: "other", name: "Other", emoji: "•••", color: "#8E8E93" },
];

const state = loadState();
let selectedMonth = startOfMonth(new Date());
let selectedCategory = DEFAULT_CATEGORIES[0].id;
let editingId = null;
let dashView = localStorage.getItem("dash-view") || "overview";
let dashPlaceFilter = "";
let dashStoreFilter = "";
let addPlace = state.settings?.lastPlace || "";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return migrateState(s);
    }
  } catch (_) {}
  return migrateState({
    expenses: [],
    settings: { currency: "USD", budget: null, lastPlace: "" },
    storeDirectory: {},
  });
}

function migrateState(s) {
  if (!s.settings) s.settings = { currency: "USD", budget: null };
  if (!s.storeDirectory) s.storeDirectory = {};
  if (!s.settings.lastPlace) s.settings.lastPlace = "";
  for (const e of s.expenses || []) {
    if (e.place === undefined) e.place = null;
  }
  return s;
}

function normalizeStoreKey(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function placeLabel(e) {
  return (e.place || "").trim() || "No area set";
}

function uniquePlaces(expenses) {
  const set = new Set();
  for (const e of expenses) set.add(placeLabel(e));
  return [...set].sort((a, b) => {
    if (a === "No area set") return 1;
    if (b === "No area set") return -1;
    return a.localeCompare(b);
  });
}

function uniqueStores(expenses, placeFilter) {
  const map = new Map();
  for (const e of expenses) {
    const store = (e.note || "").trim();
    if (!store) continue;
    if (placeFilter && placeLabel(e) !== placeFilter) continue;
    const key = normalizeStoreKey(store);
    if (!map.has(key)) map.set(key, { name: store, place: placeLabel(e) });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function filterDashboardExpenses(expenses) {
  return expenses.filter((e) => {
    if (dashPlaceFilter && placeLabel(e) !== dashPlaceFilter) return false;
    if (dashStoreFilter && normalizeStoreKey(e.note) !== normalizeStoreKey(dashStoreFilter)) return false;
    return true;
  });
}

async function resolvePlaceFromGPS() {
  if (!navigator.geolocation) throw new Error("no-gps");
  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 120000,
    });
  });
  const { latitude, longitude } = pos.coords;
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode-fail");
  const data = await res.json();
  const a = data.address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.municipality || "";
  const region = a.state || a.region || "";
  const label = [city, region].filter(Boolean).join(", ");
  return label || data.display_name?.split(",").slice(0, 2).join(",").trim() || "Current area";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function uid() {
  return crypto.randomUUID();
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatMoney(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: state.settings.currency || "USD",
  }).format(amount);
}

function monthTitle(d) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function dayTitle(d) {
  const today = new Date();
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function monthExpenses() {
  const start = selectedMonth.getTime();
  const end = endOfMonth(selectedMonth).getTime();
  return state.expenses.filter((e) => {
    const t = new Date(e.date).getTime();
    return t >= start && t <= end;
  });
}

function categoryById(id) {
  return DEFAULT_CATEGORIES.find((c) => c.id === id) || DEFAULT_CATEGORIES.at(-1);
}

function total(expenses) {
  return expenses.reduce((s, e) => s + Number(e.amount), 0);
}

function categoryTotals(expenses) {
  const map = {};
  for (const e of expenses) {
    map[e.categoryId] = (map[e.categoryId] || 0) + Number(e.amount);
  }
  return DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    total: map[c.id] || 0,
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

function storeTotals(expenses) {
  const map = new Map();
  for (const e of expenses) {
    const raw = (e.note || "").trim();
    if (!raw) continue;
    const key = normalizeStoreKey(raw);
    const entry = map.get(key) || { name: raw, total: 0, count: 0, places: new Set() };
    entry.total += Number(e.amount);
    entry.count += 1;
    const p = (e.place || "").trim();
    if (p) entry.places.add(p);
    map.set(key, entry);
  }
  return [...map.values()]
    .map((s) => ({
      ...s,
      placeHint: [...s.places].slice(0, 2).join(" · ") || "No area",
    }))
    .sort((a, b) => b.total - a.total);
}

function storesGroupedByPlace(expenses) {
  const byPlace = new Map();
  for (const e of expenses) {
    const store = (e.note || "").trim();
    if (!store) continue;
    const place = placeLabel(e);
    if (!byPlace.has(place)) byPlace.set(place, new Map());
    const stores = byPlace.get(place);
    const key = normalizeStoreKey(store);
    const entry = stores.get(key) || { name: store, items: [], total: 0 };
    entry.items.push(e);
    entry.total += Number(e.amount);
    stores.set(key, entry);
  }
  return [...byPlace.entries()]
    .sort(([a], [b]) => {
      if (a === "No area set") return 1;
      if (b === "No area set") return -1;
      return a.localeCompare(b);
    })
    .map(([place, storeMap]) => ({
      place,
      stores: [...storeMap.values()].sort((a, b) => b.total - a.total),
    }));
}

function syncDashboardFilterOptions(allMonth) {
  const placeSel = document.getElementById("dash-place-filter");
  const storeSel = document.getElementById("dash-store-filter");
  const prevPlace = dashPlaceFilter;
  const prevStore = dashStoreFilter;

  const places = uniquePlaces(allMonth);
  placeSel.innerHTML = `<option value="">All areas</option>${places
    .map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
    .join("")}`;
  placeSel.value = places.includes(prevPlace) ? prevPlace : "";

  const stores = uniqueStores(allMonth, placeSel.value || "");
  storeSel.innerHTML = `<option value="">All stores</option>${stores
    .map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`)
    .join("")}`;
  storeSel.value = stores.some((s) => s.name === prevStore) ? prevStore : "";

  dashPlaceFilter = placeSel.value;
  dashStoreFilter = storeSel.value;

  document.getElementById("dash-view").value = dashView;
}

function renderDashDetailBody(filtered) {
  const body = document.getElementById("dash-expenses-body");
  const heading = document.getElementById("dash-expenses-heading");

  if (!filtered.length) {
    body.innerHTML = `<p class="empty">No expenses match these filters.</p>`;
    return;
  }

  if (dashView === "timeline") {
    heading.textContent = "Timeline";
    const groups = groupedByDay(filtered);
    body.innerHTML = groups
      .map(
        (g) => `
      <div class="section-title">${dayTitle(g.date)}</div>
      <ul class="list dash-group-list">${g.items
        .map((e) => `<li data-id="${e.id}">${expenseRowInnerHTML(e, false, true)}</li>`)
        .join("")}</ul>`
      )
      .join("");
    wireDashExpenseClicks(body);
    return;
  }

  if (dashView === "stores") {
    heading.textContent = "By store";
    const grouped = storesGroupedByPlace(filtered);
    body.innerHTML = grouped
      .map(
        (g) => `
      <details class="place-accordion" open>
        <summary class="place-summary">
          <span>${escapeHtml(g.place)}</span>
          <span class="muted">${formatMoney(total(g.stores.flatMap((s) => s.items)))}</span>
        </summary>
        ${g.stores
          .map(
            (s) => `
          <details class="store-accordion">
            <summary class="store-summary">
              <span>${escapeHtml(s.name)}</span>
              <span class="muted">${formatMoney(s.total)} · ${s.items.length}×</span>
            </summary>
            <ul class="list dash-group-list">
              ${s.items
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((e) => `<li data-id="${e.id}">${expenseRowInnerHTML(e, false, true)}</li>`)
                .join("")}
            </ul>
          </details>`
          )
          .join("")}
      </details>`
      )
      .join("");
    wireDashExpenseClicks(body);
    return;
  }

  if (dashPlaceFilter || dashStoreFilter) {
    heading.textContent = "Filtered";
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    body.innerHTML = `<ul class="list dash-group-list">${sorted
      .map((e) => `<li data-id="${e.id}">${expenseRowInnerHTML(e, false, true)}</li>`)
      .join("")}</ul>`;
    wireDashExpenseClicks(body);
    return;
  }

  body.innerHTML = "";
}

function wireDashExpenseClicks(container) {
  container.querySelectorAll("li[data-id]").forEach((row) => {
    row.addEventListener("click", () => openEdit(row.dataset.id));
  });
}

function renderAddStoreDropdown() {
  const select = document.getElementById("store-select");
  const area = document.getElementById("place-label").value.trim() || addPlace;
  const directory = buildStoreSuggestions(area);

  const byPlace = new Map();
  for (const item of directory) {
    const p = item.place || "Other areas";
    if (!byPlace.has(p)) byPlace.set(p, []);
    byPlace.get(p).push(item);
  }

  const sortedPlaces = [...byPlace.keys()].sort((a, b) => {
    if (area && a.toLowerCase().includes(area.toLowerCase().split(",")[0])) return -1;
    if (area && b.toLowerCase().includes(area.toLowerCase().split(",")[0])) return 1;
    if (a === "Other areas") return 1;
    if (b === "Other areas") return -1;
    return a.localeCompare(b);
  });

  let html = `<option value="">Choose or type new…</option>`;
  for (const place of sortedPlaces) {
    const items = byPlace.get(place);
    html += `<optgroup label="${escapeHtml(place)}">${items
      .map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`)
      .join("")}</optgroup>`;
  }
  select.innerHTML = html;
}

function buildStoreSuggestions(preferredArea) {
  const map = new Map();
  for (const e of state.expenses) {
    const name = (e.note || "").trim();
    if (!name) continue;
    const key = normalizeStoreKey(name);
    const place = (e.place || "").trim() || "Other areas";
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { name, place, score: scorePlace(place, preferredArea) });
      continue;
    }
    existing.score = Math.max(existing.score, scorePlace(place, preferredArea));
    if (preferredArea && place.toLowerCase().includes(preferredArea.toLowerCase().split(",")[0])) {
      existing.place = place;
    }
  }
  return [...map.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function scorePlace(place, preferredArea) {
  if (!preferredArea || !place) return 0;
  const needle = preferredArea.toLowerCase().split(",")[0].trim();
  if (place.toLowerCase().includes(needle)) return 2;
  return 1;
}

function getStoreNameForSave() {
  const selectVal = document.getElementById("store-select").value.trim();
  const typed = document.getElementById("note").value.trim();
  return typed || selectVal || null;
}

function groupedByDay(expenses) {
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = [];
  let current = null;
  for (const e of sorted) {
    const key = new Date(e.date).toDateString();
    if (!current || current.key !== key) {
      current = { key, date: new Date(e.date), items: [] };
      groups.push(current);
    }
    current.items.push(e);
  }
  return groups;
}

function renderDashboard() {
  const allMonth = monthExpenses();
  syncDashboardFilterOptions(allMonth);
  const expenses = filterDashboardExpenses(allMonth);
  const sum = total(expenses);
  const cats = categoryTotals(expenses);
  const maxCat = cats[0]?.total || 1;
  const budget = state.settings.budget ? Number(state.settings.budget) : null;
  const over = budget && sum > budget;

  document.getElementById("month-label").textContent = monthTitle(selectedMonth);
  document.getElementById("month-total").textContent = formatMoney(sum);

  const budgetEl = document.getElementById("budget-block");
  if (budget) {
    budgetEl.hidden = false;
    document.getElementById("budget-text").textContent = `Budget: ${formatMoney(budget)}`;
    const pct = Math.min(sum / budget, 1);
    document.getElementById("budget-bar").style.width = `${pct * 100}%`;
    document.getElementById("budget-progress").classList.toggle("over", over);
    document.getElementById("budget-warn").hidden = !over;
  } else {
    budgetEl.hidden = true;
  }

  const empty = document.getElementById("dashboard-empty");
  const dashFilters = document.getElementById("dash-filters");
  const dashDetail = document.getElementById("dash-expenses-card");
  const recentCard = document.getElementById("recent-card");

  if (!allMonth.length) {
    document.getElementById("category-chart").innerHTML = "";
    document.getElementById("chart-card").hidden = true;
    document.getElementById("stores-card").hidden = true;
    dashFilters.hidden = true;
    dashDetail.hidden = true;
    recentCard.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  dashFilters.hidden = false;

  document.getElementById("chart-card").hidden = dashView === "stores";
  if (cats.length && dashView !== "stores") {
    document.getElementById("category-chart").innerHTML = cats
      .map(
        (c) => `
    <div class="bar-row">
      <div class="bar-label"><span>${c.emoji} ${c.name}</span><span>${formatMoney(c.total)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(c.total / maxCat) * 100}%;background:${c.color}"></div></div>
    </div>`
      )
      .join("");
  } else {
    document.getElementById("category-chart").innerHTML = "";
  }

  const stores = storeTotals(expenses);
  const storesCard = document.getElementById("stores-card");
  const storeChart = document.getElementById("store-chart");
  const storesEmpty = document.getElementById("stores-empty");
  storesCard.hidden = dashView === "timeline";

  if (dashView !== "timeline") {
    document.getElementById("stores-heading").textContent =
      dashPlaceFilter ? `Stores in ${dashPlaceFilter}` : "Top stores";
    if (!stores.length) {
      storeChart.innerHTML = "";
      storesEmpty.hidden = false;
    } else {
      storesEmpty.hidden = true;
      const maxStore = stores[0].total || 1;
      storeChart.innerHTML = stores
        .slice(0, 10)
        .map(
          (s) => `
    <button type="button" class="store-bar-btn bar-row store-row" data-store="${escapeHtml(s.name)}">
      <div class="bar-label">
        <span class="store-name">${escapeHtml(s.name)}</span>
        <span class="store-meta">${escapeHtml(s.placeHint)} · ${formatMoney(s.total)} · ${s.count}×</span>
      </div>
      <div class="bar-track"><div class="bar-fill store-fill" style="width:${(s.total / maxStore) * 100}%"></div></div>
    </button>`
        )
        .join("");
      storeChart.querySelectorAll("[data-store]").forEach((btn) => {
        btn.addEventListener("click", () => {
          dashStoreFilter = btn.dataset.store;
          document.getElementById("dash-store-filter").value = dashStoreFilter;
          dashView = "stores";
          document.getElementById("dash-view").value = "stores";
          localStorage.setItem("dash-view", dashView);
          renderDashboard();
        });
      });
    }
  }

  const showDetail =
    dashView === "stores" || dashView === "timeline" || dashPlaceFilter || dashStoreFilter;
  dashDetail.hidden = !showDetail;
  recentCard.hidden = dashView !== "overview" || dashPlaceFilter || dashStoreFilter;

  if (showDetail) renderDashDetailBody(expenses);

  const recent = document.getElementById("recent-list");
  recent.innerHTML = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((e) => `<li data-id="${e.id}">${expenseRowInnerHTML(e, false, true)}</li>`)
    .join("");
  wireDashExpenseClicks(document.getElementById("recent-list"));
}

function expenseRowInnerHTML(e, withDelete = false, preferStore = false) {
  const c = categoryById(e.categoryId);
  const store = (e.note || "").trim();
  const title = preferStore && store ? escapeHtml(store) : c.name;
  const placeLine = (e.place || "").trim()
    ? `<div class="row-place">${escapeHtml(e.place)}</div>`
  : "";
  const subtitle =
    preferStore && store
      ? `<div class="row-note">${c.emoji} ${c.name}</div>${placeLine}`
      : store
        ? `<div class="row-note">${escapeHtml(store)}</div>${placeLine}`
        : placeLine;
  return `
      <div class="cat-icon" style="background:${c.color}22;color:${c.color}">${c.emoji}</div>
      <div class="row-main">
        <div class="row-title">${title}</div>
        ${subtitle}
      </div>
      <div class="row-amount">${formatMoney(e.amount)}</div>
      ${withDelete ? `<button class="delete-btn" data-del="${e.id}" aria-label="Delete">🗑</button>` : ""}`;
}

function expenseRowHTML(e) {
  return `<li data-id="${e.id}">${expenseRowInnerHTML(e)}</li>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function renderExpenses() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  let expenses = [...state.expenses];
  if (q) {
    expenses = expenses.filter((e) => {
      const c = categoryById(e.categoryId);
      return c.name.toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q);
    });
  }

  const list = document.getElementById("expense-list");
  const groups = groupedByDay(expenses);

  if (!groups.length) {
    list.innerHTML = `<div class="empty">${q ? "No matches." : "No expenses yet."}</div>`;
    return;
  }

  list.innerHTML = groups
    .map(
      (g) => `
    <div class="section-title">${dayTitle(g.date)}</div>
    <ul class="list card">${g.items
      .map((e) => `<li data-id="${e.id}">${expenseRowInnerHTML(e, true)}</li>`)
      .join("")}</ul>`
    )
    .join("");

  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (confirm("Delete this expense?")) {
        state.expenses = state.expenses.filter((x) => x.id !== btn.dataset.del);
        saveState();
      }
    });
  });

  list.querySelectorAll("[data-id]").forEach((row) => {
    row.addEventListener("click", () => openEdit(row.dataset.id));
  });
}

function renderCategoryGrid() {
  const grid = document.getElementById("category-grid");
  grid.innerHTML = DEFAULT_CATEGORIES.map(
    (c) => `
    <button type="button" class="cat-btn ${c.id === selectedCategory ? "selected" : ""}" data-cat="${c.id}">
      <span class="emoji">${c.emoji}</span>${c.name}
    </button>`
  ).join("");

  grid.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.cat;
      renderCategoryGrid();
    });
  });
}

function resetAddForm() {
  editingId = null;
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  document.getElementById("store-select").value = "";
  document.getElementById("place-label").value = state.settings.lastPlace || addPlace || "";
  document.getElementById("place-status").hidden = true;
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
  selectedCategory = DEFAULT_CATEGORIES[0].id;
  document.getElementById("add-title").textContent = "Add Expense";
  renderCategoryGrid();
  renderAddStoreDropdown();
}

function openEdit(id) {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return;
  editingId = id;
  selectedCategory = e.categoryId;
  document.getElementById("amount").value = e.amount;
  document.getElementById("note").value = e.note || "";
  document.getElementById("store-select").value = e.note || "";
  document.getElementById("place-label").value = e.place || "";
  document.getElementById("date").value = e.date.slice(0, 10);
  document.getElementById("add-title").textContent = "Edit Expense";
  showPanel("add");
  renderCategoryGrid();
  renderAddStoreDropdown();
}

function saveExpense() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }
  const place = document.getElementById("place-label").value.trim() || null;
  const storeName = getStoreNameForSave();
  const payload = {
    id: editingId || uid(),
    amount,
    categoryId: selectedCategory,
    date: new Date(document.getElementById("date").value).toISOString(),
    note: storeName,
    place,
    createdAt: new Date().toISOString(),
  };
  if (place) {
    state.settings.lastPlace = place;
    addPlace = place;
  }

  if (editingId) {
    state.expenses = state.expenses.map((e) => (e.id === editingId ? { ...e, ...payload } : e));
  } else {
    state.expenses.push(payload);
  }

  saveState();
  resetAddForm();
  showPanel("dashboard");
}

async function shareOrDownloadFile(blob, fileName, title) {
  if (navigator.share) {
    try {
      const file = new File([blob], fileName, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return true;
      }
    } catch (err) {
      if (err?.name === "AbortError") return true;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}

function markBackupSaved() {
  const when = new Date().toISOString();
  localStorage.setItem(BACKUP_KEY, when);
  updateLastBackupLabel();
}

function updateLastBackupLabel() {
  const el = document.getElementById("last-backup-label");
  if (!el) return;
  const when = localStorage.getItem(BACKUP_KEY);
  el.textContent = when
    ? `Last full backup: ${new Date(when).toLocaleString()}`
    : "No full backup saved on this device yet.";
}

async function exportFullBackup() {
  const payload = {
    format: "expense-tracker-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data: state,
  };
  const fileName = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  await shareOrDownloadFile(blob, fileName, "ExpenseTracker backup");
  markBackupSaved();
}

function triggerImportBackup() {
  document.getElementById("import-json")?.click();
}

function importFullBackupFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = parsed.data || parsed;
      const next = migrateState({
        expenses: incoming.expenses || [],
        settings: incoming.settings || {},
        storeDirectory: incoming.storeDirectory || {},
      });
      const count = next.expenses.length;
      if (!count) {
        alert("This backup has no expenses.");
        return;
      }
      const replace = confirm(
        `Restore ${count} expense(s)?\n\nOK = replace current data\nCancel = keep current data`
      );
      if (!replace) return;
      state.expenses = next.expenses;
      state.settings = { ...state.settings, ...next.settings };
      state.storeDirectory = next.storeDirectory || {};
      addPlace = state.settings.lastPlace || "";
      saveState();
      markBackupSaved();
      alert("Backup restored.");
      showPanel("dashboard");
    } catch {
      alert("Could not read this backup file.");
    }
  };
  reader.readAsText(file);
}

function exportCSV() {
  const rows = [["Date", "Category", "Store", "Area", "Amount", "Currency"]];
  for (const e of [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date))) {
    const c = categoryById(e.categoryId);
    rows.push([
      e.date.slice(0, 10),
      c.name,
      e.note || "",
      e.place || "",
      e.amount,
      state.settings.currency,
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const fileName = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  shareOrDownloadFile(blob, fileName, "ExpenseTracker CSV");
}

function showPanel(name) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`panel-${name}`).classList.add("active");
  document.querySelectorAll("nav button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === name);
  });
  document.getElementById("page-title").textContent =
    { dashboard: "Dashboard", expenses: "Expenses", add: "Add Expense", settings: "Settings" }[name];
  render();
}

function render() {
  const active = document.querySelector(".panel.active")?.id?.replace("panel-", "");
  if (active === "dashboard") renderDashboard();
  if (active === "expenses") renderExpenses();
  if (active === "add") {
    renderCategoryGrid();
    renderAddStoreDropdown();
  }
  if (active === "settings") {
    document.getElementById("currency").value = state.settings.currency;
    document.getElementById("budget").value = state.settings.budget ?? "";
    document.getElementById("app-version").textContent = APP_VERSION;
    updateLastBackupLabel();
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function showInstallBannerIfNeeded() {
  const banner = document.getElementById("install-banner");
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const dismissed = localStorage.getItem("install-banner-dismissed");
  if (isIOS && !isStandalone() && !dismissed) {
    banner.hidden = false;
  }
}

let swRegistration = null;
let pendingSwReload = false;

function showUpdateBanner() {
  const banner = document.getElementById("update-banner");
  if (!banner || sessionStorage.getItem("update-banner-dismissed")) return;
  banner.hidden = false;
}

function hideUpdateBanner() {
  const banner = document.getElementById("update-banner");
  if (banner) banner.hidden = true;
}

function setupServiceWorkerUpdates() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!pendingSwReload) return;
    pendingSwReload = false;
    const url = new URL(window.location.href);
    url.searchParams.set("refresh", String(Date.now()));
    window.location.replace(url.toString());
  });

  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => {
      swRegistration = reg;
      if (reg.waiting) showUpdateBanner();

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    })
    .catch(() => {});

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      swRegistration?.update().catch(() => {});
    }
  });
}

async function applyServiceWorkerUpdate() {
  const btn = document.getElementById("apply-update");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Updating…";
  }
  hideUpdateBanner();
  sessionStorage.removeItem("update-banner-dismissed");

  try {
    const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
    await reg?.update();

    if (reg?.waiting) {
      pendingSwReload = true;
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    } else if (reg?.installing) {
      await new Promise((resolve) => {
        const worker = reg.installing;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            pendingSwReload = true;
            worker.postMessage({ type: "SKIP_WAITING" });
          }
          if (worker.state === "activated") resolve();
        });
        setTimeout(resolve, 1200);
      });
    }

    const keys = await caches.keys();
    await Promise.all(keys.map((name) => caches.delete(name)));
  } catch (_) {}

  const url = new URL(window.location.href);
  url.searchParams.set("refresh", String(Date.now()));
  window.location.replace(url.toString());
}

function stripRefreshQueryParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("refresh")) return;
  url.searchParams.delete("refresh");
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
  history.replaceState(null, "", next);
}

function init() {
  stripRefreshQueryParam();
  setupServiceWorkerUpdates();

  showInstallBannerIfNeeded();
  document.getElementById("apply-update")?.addEventListener("click", () => {
    applyServiceWorkerUpdate().catch(() => {
      window.location.reload();
    });
  });
  document.getElementById("dismiss-update")?.addEventListener("click", () => {
    sessionStorage.setItem("update-banner-dismissed", "1");
    hideUpdateBanner();
  });
  document.getElementById("dismiss-install")?.addEventListener("click", () => {
    localStorage.setItem("install-banner-dismissed", "1");
    document.getElementById("install-banner").hidden = true;
  });

  document.getElementById("date").value = new Date().toISOString().slice(0, 10);

  document.getElementById("prev-month").addEventListener("click", () => {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    renderDashboard();
  });
  document.getElementById("next-month").addEventListener("click", () => {
    const now = startOfMonth(new Date());
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= now) {
      selectedMonth = next;
      renderDashboard();
    }
  });

  document.getElementById("dash-view").addEventListener("change", (e) => {
    dashView = e.target.value;
    localStorage.setItem("dash-view", dashView);
    renderDashboard();
  });
  document.getElementById("dash-place-filter").addEventListener("change", (e) => {
    dashPlaceFilter = e.target.value;
    dashStoreFilter = "";
    renderDashboard();
  });
  document.getElementById("dash-store-filter").addEventListener("change", (e) => {
    dashStoreFilter = e.target.value;
    renderDashboard();
  });

  document.getElementById("store-select").addEventListener("change", (e) => {
    if (e.target.value) document.getElementById("note").value = e.target.value;
  });
  document.getElementById("note").addEventListener("input", () => {
    if (document.getElementById("note").value.trim()) {
      document.getElementById("store-select").value = "";
    }
  });
  document.getElementById("place-label").addEventListener("change", () => {
    addPlace = document.getElementById("place-label").value.trim();
    renderAddStoreDropdown();
  });
  document.getElementById("use-location").addEventListener("click", async () => {
    const status = document.getElementById("place-status");
    status.hidden = false;
    status.textContent = "Getting location…";
    try {
      const label = await resolvePlaceFromGPS();
      document.getElementById("place-label").value = label;
      addPlace = label;
      status.textContent = `Using area: ${label}`;
      renderAddStoreDropdown();
    } catch {
      status.textContent = "Location unavailable — enter area manually.";
    }
  });

  document.getElementById("search").addEventListener("input", renderExpenses);
  document.getElementById("save-expense").addEventListener("click", saveExpense);
  document.getElementById("go-add").addEventListener("click", () => showPanel("add"));
  document.getElementById("restore-from-empty")?.addEventListener("click", () => {
    showPanel("settings");
    triggerImportBackup();
  });

  document.getElementById("currency").addEventListener("change", (e) => {
    state.settings.currency = e.target.value;
    saveState();
  });
  document.getElementById("budget").addEventListener("change", (e) => {
    state.settings.budget = e.target.value ? Number(e.target.value) : null;
    saveState();
  });
  document.getElementById("export-json")?.addEventListener("click", () => exportFullBackup());
  document.getElementById("export-csv").addEventListener("click", exportCSV);
  document.getElementById("import-json-btn")?.addEventListener("click", triggerImportBackup);
  document.getElementById("import-json")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importFullBackupFromFile(file);
    e.target.value = "";
  });
  document.getElementById("feedback-link").href = FEEDBACK_URL;

  document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "add") resetAddForm();
      showPanel(btn.dataset.tab);
    });
  });

  showPanel("dashboard");
}

init();
