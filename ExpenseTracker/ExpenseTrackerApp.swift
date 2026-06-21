import SwiftUI
import SwiftData

@main
struct ExpenseTrackerApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(for: [Expense.self, Category.self, AppSettings.self])
    }
}
