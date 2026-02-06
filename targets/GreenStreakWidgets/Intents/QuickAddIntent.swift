import AppIntents
import WidgetKit

/// Intent that executes when user taps the QuickAdd widget to add a completion
@available(iOS 17.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Add Completion"
    static var description = IntentDescription("Add a completion for the task")

    @Parameter(title: "Task ID")
    var taskId: String

    init() {
        self.taskId = ""
    }

    init(taskId: String) {
        self.taskId = taskId
    }

    func perform() async throws -> some IntentResult {
        guard !taskId.isEmpty else {
            return .result()
        }

        // Create pending action
        let action = PendingWidgetAction(
            id: UUID().uuidString,
            type: "quick_add",
            taskId: taskId,
            date: SharedDataStore.shared.getTodayString(),
            timestamp: ISO8601DateFormatter().string(from: Date()),
            processed: false
        )

        // Save to App Groups for the app to process
        SharedDataStore.shared.savePendingAction(action)

        // Reload all widget timelines to show updated count
        WidgetCenter.shared.reloadTimelines(ofKind: "QuickAddWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "QuickAddGridWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "LiveCalendarWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "CalendarQuickAddWidget")

        return .result()
    }
}

/// Structure for pending actions to be processed by the React Native app
struct PendingWidgetAction: Codable {
    let id: String
    let type: String
    let taskId: String
    let date: String
    let timestamp: String
    let processed: Bool
}
