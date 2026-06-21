import SwiftUI
import SwiftData

struct AddExpenseView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @Query(sort: \Category.sortOrder) private var categories: [Category]
    @Query private var settingsList: [AppSettings]

    var expenseToEdit: Expense?
    var onSaved: (() -> Void)?

    @State private var amountText = ""
    @State private var selectedCategory: Category?
    @State private var date = Date.now
    @State private var note = ""
    @State private var showValidationError = false

    private var isEditing: Bool { expenseToEdit != nil }

    private var settings: AppSettings? { settingsList.first }

    private var currencyCode: String {
        settings?.currencyCode ?? Locale.current.currency?.identifier ?? "USD"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    AmountTextField(amountText: $amountText, currencyCode: currencyCode)

                    CategoryPickerGrid(
                        categories: categories,
                        selectedCategory: $selectedCategory
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        DatePicker(
                            "Expense date",
                            selection: $date,
                            displayedComponents: .date
                        )
                        .datePickerStyle(.compact)
                        .labelsHidden()
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Note")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        TextField("Optional note", text: $note, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .lineLimit(2...4)
                    }
                }
                .padding()
            }
            .navigationTitle(isEditing ? "Edit Expense" : "Add Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if isEditing {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveExpense() }
                        .fontWeight(.semibold)
                }
            }
            .alert("Enter a valid amount", isPresented: $showValidationError) {
                Button("OK", role: .cancel) {}
            }
            .onAppear { populateIfEditing() }
        }
    }

    private func populateIfEditing() {
        guard let expense = expenseToEdit else {
            if selectedCategory == nil {
                selectedCategory = categories.first
            }
            return
        }

        amountText = NSDecimalNumber(decimal: expense.amount).stringValue
        selectedCategory = expense.category ?? categories.first
        date = expense.date
        note = expense.note ?? ""
    }

    private func saveExpense() {
        guard let amount = parseAmount(from: amountText), amount > 0 else {
            showValidationError = true
            return
        }

        guard let category = selectedCategory ?? categories.first else { return }

        if let expense = expenseToEdit {
            expense.amount = amount
            expense.date = date
            expense.note = note.isEmpty ? nil : note
            expense.category = category
            expense.syncCategoryName()
        } else {
            let expense = Expense(
                amount: amount,
                date: date,
                note: note.isEmpty ? nil : note,
                category: category
            )
            modelContext.insert(expense)
        }

        do {
            try modelContext.save()
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            onSaved?()
            if isEditing {
                dismiss()
            } else {
                resetForm()
            }
        } catch {
            showValidationError = true
        }
    }

    private func resetForm() {
        amountText = ""
        note = ""
        date = .now
        selectedCategory = categories.first
    }

    private func parseAmount(from text: String) -> Decimal? {
        let sanitized = text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: ",", with: "")
        return Decimal(string: sanitized)
    }
}

#Preview {
    AddExpenseView()
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self], inMemory: true)
}
