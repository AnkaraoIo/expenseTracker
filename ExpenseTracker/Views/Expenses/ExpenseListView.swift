import SwiftUI
import SwiftData

struct ExpenseListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Expense.date, order: .reverse) private var allExpenses: [Expense]
    @Query private var settingsList: [AppSettings]

    @State private var searchText = ""
    @State private var expenseToEdit: Expense?
    @State private var expensePendingDelete: Expense?
    @State private var showDeleteConfirmation = false

    private var currencyCode: String {
        settingsList.first?.currencyCode ?? Locale.current.currency?.identifier ?? "USD"
    }

    private var filteredExpenses: [Expense] {
        guard !searchText.isEmpty else { return allExpenses }

        return allExpenses.filter { expense in
            let categoryName = expense.category?.name ?? expense.categoryName ?? ""
            let note = expense.note ?? ""
            return categoryName.localizedCaseInsensitiveContains(searchText)
                || note.localizedCaseInsensitiveContains(searchText)
        }
    }

    private var groupedExpenses: [(date: Date, expenses: [Expense])] {
        ExpenseQueryService.groupedByDay(filteredExpenses)
    }

    var body: some View {
        NavigationStack {
            Group {
                if groupedExpenses.isEmpty {
                    ContentUnavailableView {
                        Label("No Expenses", systemImage: "tray")
                    } description: {
                        Text(searchText.isEmpty
                             ? "Add your first expense from the Add tab."
                             : "No expenses match your search.")
                    }
                } else {
                    List {
                        ForEach(groupedExpenses, id: \.date) { group in
                            Section(group.date.daySectionTitle) {
                                ForEach(group.expenses, id: \.id) { expense in
                                    ExpenseRowView(expense: expense, currencyCode: currencyCode)
                                        .onTapGesture {
                                            expenseToEdit = expense
                                        }
                                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                            Button(role: .destructive) {
                                                expensePendingDelete = expense
                                                showDeleteConfirmation = true
                                            } label: {
                                                Label("Delete", systemImage: "trash")
                                            }
                                        }
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Expenses")
            .searchable(text: $searchText, prompt: "Search notes or categories")
            .sheet(item: $expenseToEdit) { expense in
                AddExpenseView(expenseToEdit: expense)
            }
            .confirmationDialog(
                "Delete this expense?",
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    if let expense = expensePendingDelete {
                        modelContext.delete(expense)
                        try? modelContext.save()
                    }
                    expensePendingDelete = nil
                }
                Button("Cancel", role: .cancel) {
                    expensePendingDelete = nil
                }
            }
        }
    }
}

#Preview {
    ExpenseListView()
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self], inMemory: true)
}
