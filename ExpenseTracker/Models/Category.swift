import Foundation
import SwiftData
import SwiftUI

@Model
final class Category {
    var id: UUID
    var name: String
    var symbolName: String
    var colorHex: String
    var sortOrder: Int
    var isSystem: Bool

    @Relationship(deleteRule: .nullify, inverse: \Expense.category)
    var expenses: [Expense]?

    init(
        id: UUID = UUID(),
        name: String,
        symbolName: String,
        colorHex: String,
        sortOrder: Int,
        isSystem: Bool = false
    ) {
        self.id = id
        self.name = name
        self.symbolName = symbolName
        self.colorHex = colorHex
        self.sortOrder = sortOrder
        self.isSystem = isSystem
    }

    var color: Color {
        Color(hex: colorHex) ?? .accentColor
    }
}

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        guard hexSanitized.count == 6,
              let intValue = UInt64(hexSanitized, radix: 16) else {
            return nil
        }

        let red = Double((intValue >> 16) & 0xFF) / 255
        let green = Double((intValue >> 8) & 0xFF) / 255
        let blue = Double(intValue & 0xFF) / 255
        self.init(red: red, green: green, blue: blue)
    }
}
