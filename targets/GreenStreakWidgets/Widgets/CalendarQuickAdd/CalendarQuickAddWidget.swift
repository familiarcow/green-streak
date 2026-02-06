import WidgetKit
import SwiftUI

/// Combined Calendar + QuickAdd widget
/// Medium size: Calendar + 2 stacked quick adds
/// Large size: Calendar + 4 quick adds (2x2 grid)
@available(iOS 17.0, *)
struct CalendarQuickAddWidget: Widget {
    let kind: String = "CalendarQuickAddWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: CalendarQuickAddConfigIntent.self,
            provider: CalendarQuickAddProvider()
        ) { entry in
            CalendarQuickAddView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Calendar + Quick Add")
        .description("View your streaks and quickly add completions")
        .supportedFamilies([.systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct CalendarQuickAddWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            CalendarQuickAddView(entry: .placeholder(family: .systemMedium))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")

            CalendarQuickAddView(entry: .placeholder(family: .systemLarge))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")
        }
    }
}
