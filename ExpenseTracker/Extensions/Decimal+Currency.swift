import Foundation

extension Decimal {
    func formatted(currencyCode: String) -> String {
        formatted(.currency(code: currencyCode).precision(.fractionLength(2)))
    }
}
