import SwiftUI
import SwiftData

struct CategoryManagementView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Category.sortOrder) private var categories: [Category]

    @State private var showAddCategory = false
    @State private var newCategoryName = ""
    @State private var newCategorySymbol = "tag.fill"
    @State private var newCategoryColor = "007AFF"

    private let symbolOptions = [
        "tag.fill", "star.fill", "gift.fill", "book.fill",
        "pawprint.fill", "leaf.fill", "bolt.fill", "cup.and.saucer.fill"
    ]

    private let colorOptions = [
        "FF9500", "007AFF", "5856D6", "FF2D55",
        "34C759", "AF52DE", "FF3B30", "8E8E93"
    ]

    var body: some View {
        List {
            ForEach(categories.sorted { $0.sortOrder < $1.sortOrder }, id: \.id) { category in
                @Bindable var category = category
                HStack(spacing: 12) {
                    Image(systemName: category.symbolName)
                        .foregroundStyle(category.color)
                        .frame(width: 32, height: 32)
                        .background(category.color.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    TextField("Name", text: $category.name)
                        .disabled(category.isSystem && category.name == "Other")

                    if category.isSystem {
                        Text("System")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .onDelete(perform: deleteCategories)
            .onMove(perform: moveCategories)
        }
        .navigationTitle("Categories")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                EditButton()
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showAddCategory = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showAddCategory) {
            NavigationStack {
                Form {
                    Section("Details") {
                        TextField("Name", text: $newCategoryName)

                        Picker("Icon", selection: $newCategorySymbol) {
                            ForEach(symbolOptions, id: \.self) { symbol in
                                Label(symbol, systemImage: symbol).tag(symbol)
                            }
                        }

                        Picker("Color", selection: $newCategoryColor) {
                            ForEach(colorOptions, id: \.self) { hex in
                                HStack {
                                    Circle()
                                        .fill(Color(hex: hex) ?? .accentColor)
                                        .frame(width: 16, height: 16)
                                    Text(hex)
                                }
                                .tag(hex)
                            }
                        }
                    }
                }
                .navigationTitle("New Category")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { showAddCategory = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Add") { addCategory() }
                            .disabled(newCategoryName.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
            .presentationDetents([.medium])
        }
    }

    private func addCategory() {
        let name = newCategoryName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }

        let nextOrder = (categories.map(\.sortOrder).max() ?? -1) + 1
        let category = Category(
            name: name,
            symbolName: newCategorySymbol,
            colorHex: newCategoryColor,
            sortOrder: nextOrder,
            isSystem: false
        )
        modelContext.insert(category)
        try? modelContext.save()

        newCategoryName = ""
        newCategorySymbol = "tag.fill"
        newCategoryColor = "007AFF"
        showAddCategory = false
    }

    private func moveCategories(from source: IndexSet, to destination: Int) {
        var sorted = categories.sorted { $0.sortOrder < $1.sortOrder }
        sorted.move(fromOffsets: source, toOffset: destination)

        for (index, category) in sorted.enumerated() {
            category.sortOrder = index
        }

        try? modelContext.save()
    }

    private func deleteCategories(at offsets: IndexSet) {
        let sorted = categories.sorted { $0.sortOrder < $1.sortOrder }
        let other = SeedDataService.otherCategory(from: categories)

        for index in offsets {
            let category = sorted[index]
            guard !category.isSystem else { continue }

            if let linked = category.expenses {
                for expense in linked {
                    expense.category = other
                    expense.syncCategoryName()
                }
            }

            modelContext.delete(category)
        }

        try? modelContext.save()
    }
}
