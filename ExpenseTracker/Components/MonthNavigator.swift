import SwiftUI

struct MonthNavigator: View {
    @Binding var selectedMonth: Date

    var body: some View {
        HStack {
            Button {
                selectedMonth = selectedMonth.addingMonths(-1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Previous month")

            Spacer()

            Text(selectedMonth.monthYearTitle)
                .font(.headline)

            Spacer()

            Button {
                selectedMonth = selectedMonth.addingMonths(1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.body.weight(.semibold))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Next month")
            .disabled(Calendar.current.isDate(selectedMonth, equalTo: Date(), toGranularity: .month))
            .opacity(Calendar.current.isDate(selectedMonth, equalTo: Date(), toGranularity: .month) ? 0.35 : 1)
        }
    }
}
