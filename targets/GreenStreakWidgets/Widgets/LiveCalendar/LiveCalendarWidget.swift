import WidgetKit
import SwiftUI

/// LiveCalendar widget definition
/// Displays a GitHub-style contribution grid showing habit completion history
struct LiveCalendarWidget: Widget {
    let kind: String = "LiveCalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LiveCalendarProvider()) { entry in
            if #available(iOS 17.0, *) {
                LiveCalendarView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                LiveCalendarView(entry: entry)
            }
        }
        .configurationDisplayName("Green Streak")
        .description("View your habit completion history at a glance.")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

struct LiveCalendarWidget_Previews: PreviewProvider {
    static var previews: some View {
        LiveCalendarView(entry: LiveCalendarEntry.placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small")
    }
}
