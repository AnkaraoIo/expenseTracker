const STORAGE_KEY = "expense-tracker-pwa";
const APP_VERSION = "0.1.0-beta";
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    expenses: [],
    settings: { currency: "USD", budget: null },
  };
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
  const expenses = monthExpenses();
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

  const chart = document.getElementById("category-chart");
  const empty = document.getElementById("dashboard-empty");
  const recent = document.getElementById("recent-list");

  if (!cats.length) {
    chart.innerHTML = "";
    document.getElementById("chart-card").hidden = true;
    empty.hidden = false;
    recent.innerHTML = "";
    return;
  }

  document.getElementById("chart-card").hidden = false;
  empty.hidden = true;
  chart.innerHTML = cats
    .map(
      (c) => `
    <div class="bar-row">
      <div class="bar-label"><span>${c.emoji} ${c.name}</span><span>${formatMoney(c.total)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(c.total / maxCat) * 100}%;background:${c.color}"></div></div>
    </div>`
    )
    .join("");

  recent.innerHTML = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(expenseRowHTML)
    .join("");
}

function expenseRowInnerHTML(e, withDelete = false) {
  const c = categoryById(e.categoryId);
  return `
      <div class="cat-icon" style="background:${c.color}22;color:${c.color}">${c.emoji}</div>
      <div class="row-main">
        <div class="row-title">${c.name}</div>
        ${e.note ? `<div class="row-note">${escapeHtml(e.note)}</div>` : ""}
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
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
  selectedCategory = DEFAULT_CATEGORIES[0].id;
  document.getElementById("add-title").textContent = "Add Expense";
  renderCategoryGrid();
}

function openEdit(id) {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return;
  editingId = id;
  selectedCategory = e.categoryId;
  document.getElementById("amount").value = e.amount;
  document.getElementById("note").value = e.note || "";
  document.getElementById("date").value = e.date.slice(0, 10);
  document.getElementById("add-title").textContent = "Edit Expense";
  showPanel("add");
  renderCategoryGrid();
}

function saveExpense() {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }
  const payload = {
    id: editingId || uid(),
    amount,
    categoryId: selectedCategory,
    date: new Date(document.getElementById("date").value).toISOString(),
    note: document.getElementById("note").value.trim() || null,
    createdAt: new Date().toISOString(),
  };

  if (editingId) {
    state.expenses = state.expenses.map((e) => (e.id === editingId ? { ...e, ...payload } : e));
  } else {
    state.expenses.push(payload);
  }

  saveState();
  resetAddForm();
  showPanel("dashboard");
}

function exportCSV() {
  const rows = [["Date", "Category", "Amount", "Note", "Currency"]];
  for (const e of [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date))) {
    const c = categoryById(e.categoryId);
    rows.push([
      e.date.slice(0, 10),
      c.name,
      e.amount,
      e.note || "",
      state.settings.currency,
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
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
  if (active === "add") renderCategoryGrid();
  if (active === "settings") {
    document.getElementById("currency").value = state.settings.currency;
    document.getElementById("budget").value = state.settings.budget ?? "";
    document.getElementById("app-version").textContent = APP_VERSION;
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

function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  showInstallBannerIfNeeded();
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

  document.getElementById("search").addEventListener("input", renderExpenses);
  document.getElementById("save-expense").addEventListener("click", saveExpense);
  document.getElementById("go-add").addEventListener("click", () => showPanel("add"));

  document.getElementById("currency").addEventListener("change", (e) => {
    state.settings.currency = e.target.value;
    saveState();
  });
  document.getElementById("budget").addEventListener("change", (e) => {
    state.settings.budget = e.target.value ? Number(e.target.value) : null;
    saveState();
  });
  document.getElementById("export-csv").addEventListener("click", exportCSV);
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
