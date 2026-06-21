import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var settingsList: [AppSettings]
    @Query(sort: \Expense.date, order: .reverse) private var expenses: [Expense]

    @State private var budgetText = ""
    @State private var showShareSheet = false
    @State private var exportURL: URL?

    private var settings: AppSettings? { settingsList.first }

    private var currencyCode: String {
        settings?.currencyCode ?? Locale.current.currency?.identifier ?? "USD"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Currency") {
                    Picker("Currency", selection: Binding(
                        get: { currencyCode },
                        set: { updateCurrency($0) }
                    )) {
                        ForEach(currencyOptions, id: \.self) { code in
                            Text(code).tag(code)
                        }
                    }
                }

                Section("Budget") {
                    TextField("Monthly budget (optional)", text: $budgetText)
                        .keyboardType(.decimalPad)
                        .onAppear { syncBudgetText() }
                        .onChange(of: budgetText) { _, newValue in
                            updateBudget(from: newValue)
                        }
                }

                Section("Categories") {
                    NavigationLink("Manage categories") {
                        CategoryManagementView()
                    }
                }

                Section("Export") {
                    Button("Export all expenses as CSV") {
                        exportCSV()
                    }
                }
            }
            .navigationTitle("Settings")
            .onAppear { ensureSettings() }
            .sheet(isPresented: $showShareSheet, onDismiss: { exportURL = nil }) {
                if let exportURL {
                    ShareSheet(items: [exportURL])
                }
            }
        }
    }

    private let currencyOptions = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"]

    private func ensureSettings() {
        guard settingsList.isEmpty else {
            syncBudgetText()
            return
        }
        let created = AppSettings()
        modelContext.insert(created)
        try? modelContext.save()
        syncBudgetText()
    }

    private func syncBudgetText() {
        if let budget = settings?.monthlyBudget {
            budgetText = NSDecimalNumber(decimal: budget).stringValue
        }
    }

    private func updateCurrency(_ code: String) {
        if let settings {
            settings.currencyCode = code
        } else {
            let created = AppSettings(currencyCode: code)
            modelContext.insert(created)
        }
        saveSettings()
    }

    private func updateBudget(from text: String) {
        let sanitized = text.replacingOccurrences(of: ",", with: "")
        if let settings {
            if sanitized.isEmpty {
                settings.monthlyBudget = nil
            } else if let value = Decimal(string: sanitized) {
                settings.monthlyBudget = value
            }
        }
        saveSettings()
    }

    private func saveSettings() {
        try? modelContext.save()
    }

    private func exportCSV() {
        let csv = CSVExportService.makeCSV(
            expenses: expenses,
            currencyCode: currencyCode
        )

        let fileName = "expenses-\(Date.now.formatted(date: .numeric, time: .omitted)).csv"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

        do {
            try csv.write(to: url, atomically: true, encoding: .utf8)
            exportURL = url
            showShareSheet = true
        } catch {
            // Silent fail for MVP; user can retry
        }
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    SettingsView()
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self], inMemory: true)
}
