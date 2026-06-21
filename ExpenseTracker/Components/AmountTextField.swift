import SwiftUI

struct AmountTextField: View {
    @Binding var amountText: String
    let currencyCode: String

    var body: some View {
        VStack(spacing: 8) {
            Text("Amount")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(currencySymbol)
                    .font(.system(size: 36, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                TextField("0.00", text: $amountText)
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.leading)
                    .accessibilityLabel("Expense amount")
            }
            .padding(.vertical, 8)
        }
    }

    private var currencySymbol: String {
        Locale.current.localizedCurrencySymbol(forCurrencyCode: currencyCode) ?? "$"
    }
}

extension Locale {
    func localizedCurrencySymbol(forCurrencyCode code: String) -> String? {
        guard let identifier = Locale.availableIdentifiers.first(where: {
            Locale(identifier: $0).currency?.identifier == code
        }) else {
            return nil
        }
        return Locale(identifier: identifier).currencySymbol
    }
}
