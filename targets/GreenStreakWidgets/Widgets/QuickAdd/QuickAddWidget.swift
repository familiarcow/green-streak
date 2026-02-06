import WidgetKit
import SwiftUI

/// QuickAdd widget - a simple 1x1 widget to quickly add task completions
/// Shows the task icon, colored in if completed today
@available(iOS 17.0, *)
struct QuickAddWidget: Widget {
    let kind: String = "QuickAddWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: QuickAddConfigIntent.self,
            provider: QuickAddProvider()
        ) { entry in
            QuickAddView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Quick Add")
        .description("Tap to add completions for a task")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct QuickAddWidget_Previews: PreviewProvider {
    static var previews: some View {
        QuickAddView(entry: QuickAddEntry.placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
