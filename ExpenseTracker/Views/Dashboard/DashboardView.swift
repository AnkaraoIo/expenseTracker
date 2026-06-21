import SwiftUI
import SwiftData
import Charts

struct DashboardView: View {
    var onAddExpense: (() -> Void)?

    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]
    @Query private var settingsList: [AppSettings]

    @State private var selectedMonth = Date.now.startOfMonth
    @State private var expenseToEdit: Expense?

    private var settings: AppSettings? { settingsList.first }

    private var currencyCode: String {
        settings?.currencyCode ?? Locale.current.currency?.identifier ?? "USD"
    }

    private var monthExpenses: [Expense] {
        ExpenseQueryService.expenses(in: selectedMonth, from: expenses)
    }

    private var monthTotal: Decimal {
        ExpenseQueryService.total(for: monthExpenses)
    }

    private var categoryTotals: [CategoryTotal] {
        ExpenseQueryService.categoryTotals(for: monthExpenses)
    }

    private var recentExpenses: [Expense] {
        ExpenseQueryService.recentExpenses(from: monthExpenses)
    }

    private var budgetProgress: Double? {
        guard let budget = settings?.monthlyBudget, budget > 0 else { return nil }
        let spent = NSDecimalNumber(decimal: monthTotal).doubleValue
        let limit = NSDecimalNumber(decimal: budget).doubleValue
        return min(spent / limit, 1.5)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    MonthNavigator(selectedMonth: $selectedMonth)

                    heroCard

                    if categoryTotals.isEmpty {
                        emptyMonthCard
                    } else {
                        categoryChartSection
                        recentSection
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .sheet(item: $expenseToEdit) { expense in
                AddExpenseView(expenseToEdit: expense)
            }
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Spent this month")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text(monthTotal.formatted(currencyCode: currencyCode))
                .font(.system(size: 40, weight: .bold, design: .rounded))

            if let budget = settings?.monthlyBudget {
                HStack {
                    Text("Budget: \(budget.formatted(currencyCode: currencyCode))")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Spacer()

                    if monthTotal > budget {
                        Label("Over budget", systemImage: "exclamationmark.triangle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.red)
                    }
                }

                if let progress = budgetProgress {
                    ProgressView(value: min(progress, 1.0))
                        .tint(progress > 1 ? .red : .accentColor)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }

    private var emptyMonthCard: some View {
        ContentUnavailableView {
            Label("No expenses yet", systemImage: "chart.pie")
        } description: {
            Text("Log an expense to see your monthly breakdown.")
        } actions: {
            Button("Add first expense") {
                onAddExpense?()
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }

    private var categoryChartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("By category")
                .font(.headline)

            Chart(categoryTotals) { item in
                BarMark(
                    x: .value("Amount", NSDecimalNumber(decimal: item.total).doubleValue),
                    y: .value("Category", item.name)
                )
                .foregroundStyle(Color(hex: item.colorHex) ?? .accentColor)
                .cornerRadius(4)
            }
            .frame(height: CGFloat(max(categoryTotals.count * 36, 120)))
            .chartXAxis {
                AxisMarks(format: .currency(code: currencyCode))
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent")
                .font(.headline)

            ForEach(recentExpenses, id: \.id) { expense in
                ExpenseRowView(expense: expense, currencyCode: currencyCode)
                    .onTapGesture { expenseToEdit = expense }

                if expense.id != recentExpenses.last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self], inMemory: true)
}
