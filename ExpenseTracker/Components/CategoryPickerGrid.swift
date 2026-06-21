import SwiftUI

struct CategoryPickerGrid: View {
    let categories: [Category]
    @Binding var selectedCategory: Category?

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Category")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(categories.sorted { $0.sortOrder < $1.sortOrder }, id: \.id) { category in
                    Button {
                        selectedCategory = category
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: category.symbolName)
                                .font(.title3)
                                .frame(width: 44, height: 44)
                                .background(
                                    Circle()
                                        .fill(category.color.opacity(selectedCategory?.id == category.id ? 0.25 : 0.12))
                                )
                                .foregroundStyle(category.color)

                            Text(category.name)
                                .font(.caption2)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(
                                    selectedCategory?.id == category.id ? category.color : Color.clear,
                                    lineWidth: 2
                                )
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(category.name)
                    .accessibilityAddTraits(selectedCategory?.id == category.id ? .isSelected : [])
                }
            }
        }
    }
}
