import Foundation

struct CategoryTotal: Identifiable {
    let id: UUID
    let name: String
    let symbolName: String
    let colorHex: String
    let total: Decimal
}

enum ExpenseQueryService {
    static func expenses(in month: Date, from allExpenses: [Expense]) -> [Expense] {
        let start = month.startOfMonth
        let end = month.endOfMonth
        return allExpenses.filter { $0.date >= start && $0.date <= end }
    }

    static func total(for expenses: [Expense]) -> Decimal {
        expenses.reduce(into: Decimal.zero) { partial, expense in
            partial += expense.amount
        }
    }

    static func categoryTotals(for expenses: [Expense]) -> [CategoryTotal] {
        var grouped: [String: (category: Category?, total: Decimal)] = [:]

        for expense in expenses {
            let key = expense.category?.id.uuidString ?? "uncategorized"
            var entry = grouped[key] ?? (expense.category, .zero)
            entry.total += expense.amount
            grouped[key] = entry
        }

        return grouped.values
            .map { entry in
                CategoryTotal(
                    id: entry.category?.id ?? UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
                    name: entry.category?.name ?? "Uncategorized",
                    symbolName: entry.category?.symbolName ?? "questionmark.circle",
                    colorHex: entry.category?.colorHex ?? "8E8E93",
                    total: entry.total
                )
            }
            .sorted { $0.total > $1.total }
    }

    static func groupedByDay(_ expenses: [Expense]) -> [(date: Date, expenses: [Expense])] {
        let sorted = expenses.sorted { $0.date > $1.date }
        var groups: [(date: Date, expenses: [Expense])] = []
        var currentDay: Date?
        var currentGroup: [Expense] = []

        for expense in sorted {
            let dayStart = Calendar.current.startOfDay(for: expense.date)
            if currentDay == nil || !dayStart.isSameDay(as: currentDay!) {
                if let currentDay, !currentGroup.isEmpty {
                    groups.append((date: currentDay, expenses: currentGroup))
                }
                currentDay = dayStart
                currentGroup = [expense]
            } else {
                currentGroup.append(expense)
            }
        }

        if let currentDay, !currentGroup.isEmpty {
            groups.append((date: currentDay, expenses: currentGroup))
        }

        return groups
    }

    static func recentExpenses(from expenses: [Expense], limit: Int = 5) -> [Expense] {
        Array(expenses.sorted { $0.date > $1.date }.prefix(limit))
    }
}
