import Foundation

extension Date {
    var startOfMonth: Date {
        Calendar.current.date(from: Calendar.current.dateComponents([.year, .month], from: self)) ?? self
    }

    var endOfMonth: Date {
        guard let nextMonth = Calendar.current.date(byAdding: .month, value: 1, to: startOfMonth),
              let end = Calendar.current.date(byAdding: .second, value: -1, to: nextMonth) else {
            return self
        }
        return end
    }

    func addingMonths(_ value: Int) -> Date {
        Calendar.current.date(byAdding: .month, value: value, to: self) ?? self
    }

    var monthYearTitle: String {
        formatted(.dateTime.month(.wide).year())
    }

    var daySectionTitle: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(self) {
            return "Today"
        }
        if calendar.isDateInYesterday(self) {
            return "Yesterday"
        }
        return formatted(date: .abbreviated, time: .omitted)
    }

    func isSameDay(as other: Date) -> Bool {
        Calendar.current.isDate(self, inSameDayAs: other)
    }
}
