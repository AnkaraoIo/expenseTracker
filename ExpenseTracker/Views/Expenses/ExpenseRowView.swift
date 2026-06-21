import SwiftUI
import SwiftData

struct ExpenseRowView: View {
    let expense: Expense
    let currencyCode: String

    var body: some View {
        HStack(spacing: 12) {
            if let category = expense.category {
                Image(systemName: category.symbolName)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(category.color)
                    .frame(width: 36, height: 36)
                    .background(category.color.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                Image(systemName: "questionmark.circle")
                    .frame(width: 36, height: 36)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(expense.category?.name ?? expense.categoryName ?? "Uncategorized")
                    .font(.body.weight(.medium))

                if let note = expense.note, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Text(expense.amount.formatted(currencyCode: currencyCode))
                .font(.body.weight(.semibold))
                .foregroundStyle(.primary)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}
