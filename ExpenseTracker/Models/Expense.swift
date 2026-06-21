import Foundation
import SwiftData

@Model
final class Expense {
    var id: UUID
    var amount: Decimal
    var date: Date
    var note: String?
    var createdAt: Date
    var categoryName: String?

    var category: Category?

    init(
        id: UUID = UUID(),
        amount: Decimal,
        date: Date = .now,
        note: String? = nil,
        category: Category? = nil,
        createdAt: Date = .now
    ) {
        self.id = id
        self.amount = amount
        self.date = date
        self.note = note
        self.category = category
        self.categoryName = category?.name
        self.createdAt = createdAt
    }

    func syncCategoryName() {
        categoryName = category?.name
    }
}
