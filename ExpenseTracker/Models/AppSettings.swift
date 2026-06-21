import Foundation
import SwiftData

@Model
final class AppSettings {
    var id: UUID
    var currencyCode: String
    var monthlyBudget: Decimal?

    init(
        id: UUID = UUID(),
        currencyCode: String = Locale.current.currency?.identifier ?? "USD",
        monthlyBudget: Decimal? = nil
    ) {
        self.id = id
        self.currencyCode = currencyCode
        self.monthlyBudget = monthlyBudget
    }
}
