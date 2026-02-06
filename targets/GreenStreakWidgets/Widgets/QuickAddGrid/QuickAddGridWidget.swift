import WidgetKit
import SwiftUI

/// QuickAdd Grid widget - a 2x2 grid to quickly add completions for 4 tasks
/// Shows task icons in a grid, colored when completed today
@available(iOS 17.0, *)
struct QuickAddGridWidget: Widget {
    let kind: String = "QuickAddGridWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: QuickAddGridConfigIntent.self,
            provider: QuickAddGridProvider()
        ) { entry in
            QuickAddGridView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Quick Add Grid")
        .description("Tap to add completions for up to 4 tasks")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct QuickAddGridWidget_Previews: PreviewProvider {
    static var previews: some View {
        QuickAddGridView(entry: QuickAddGridEntry.placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
