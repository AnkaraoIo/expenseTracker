import Foundation

enum CSVExportService {
    static func makeCSV(expenses: [Expense], currencyCode: String) -> String {
        var lines = ["Date,Category,Amount,Note,Currency"]
        let sorted = expenses.sorted { $0.date > $1.date }

        for expense in sorted {
            let date = expense.date.formatted(date: .numeric, time: .omitted)
            let category = csvEscape(expense.category?.name ?? expense.categoryName ?? "Uncategorized")
            let amount = NSDecimalNumber(decimal: expense.amount).stringValue
            let note = csvEscape(expense.note ?? "")
            lines.append("\(date),\(category),\(amount),\(note),\(currencyCode)")
        }

        return lines.joined(separator: "\n")
    }

    private static func csvEscape(_ value: String) -> String {
        if value.contains(",") || value.contains("\"") || value.contains("\n") {
            return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
        }
        return value
    }
}
