import SwiftUI
import SwiftData

struct RootTabView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(onAddExpense: { selectedTab = 2 })
                .tabItem {
                    Label("Dashboard", systemImage: "chart.pie.fill")
                }
                .tag(0)

            ExpenseListView()
                .tabItem {
                    Label("Expenses", systemImage: "list.bullet")
                }
                .tag(1)

            AddExpenseView(onSaved: { selectedTab = 0 })
                .tabItem {
                    Label("Add", systemImage: "plus.circle.fill")
                }
                .tag(2)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(3)
        }
        .onAppear {
            SeedDataService.seedIfNeeded(context: modelContext)
        }
    }
}

#Preview {
    RootTabView()
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self], inMemory: true)
}
