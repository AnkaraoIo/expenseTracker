import Foundation
import SwiftData

enum SeedDataService {
    static let defaultCategories: [(name: String, symbol: String, hex: String, order: Int)] = [
        ("Food", "fork.knife", "FF9500", 0),
        ("Transport", "car.fill", "007AFF", 1),
        ("Housing", "house.fill", "5856D6", 2),
        ("Shopping", "bag.fill", "FF2D55", 3),
        ("Health", "heart.fill", "34C759", 4),
        ("Entertainment", "film.fill", "AF52DE", 5),
        ("Bills", "doc.text.fill", "FF3B30", 6),
        ("Other", "ellipsis.circle.fill", "8E8E93", 7)
    ]

    static func seedIfNeeded(context: ModelContext) {
        var categoryDescriptor = FetchDescriptor<Category>()
        categoryDescriptor.fetchLimit = 1
        let hasCategories = (try? context.fetch(categoryDescriptor).isEmpty == false) ?? false

        if !hasCategories {
            for item in defaultCategories {
                let category = Category(
                    name: item.name,
                    symbolName: item.symbol,
                    colorHex: item.hex,
                    sortOrder: item.order,
                    isSystem: true
                )
                context.insert(category)
            }
        }

        var settingsDescriptor = FetchDescriptor<AppSettings>()
        settingsDescriptor.fetchLimit = 1
        let hasSettings = (try? context.fetch(settingsDescriptor).isEmpty == false) ?? false

        if !hasSettings {
            context.insert(AppSettings())
        }

        try? context.save()
    }

    static func otherCategory(from categories: [Category]) -> Category? {
        categories.first { $0.name == "Other" }
    }
}
