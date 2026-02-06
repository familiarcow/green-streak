import AppIntents
import WidgetKit

/// Configuration intent for the combined Calendar + QuickAdd widget
/// Supports 2 tasks for medium size, 4 tasks for large size
@available(iOS 17.0, *)
struct CalendarQuickAddConfigIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configure Tasks"
    static var description = IntentDescription("Choose tasks for quick add")

    @Parameter(title: "Task 1")
    var task1: TaskEntity?

    @Parameter(title: "Task 2")
    var task2: TaskEntity?

    @Parameter(title: "Task 3 (Large only)")
    var task3: TaskEntity?

    @Parameter(title: "Task 4 (Large only)")
    var task4: TaskEntity?

    init() {}

    init(task1: TaskEntity?, task2: TaskEntity?, task3: TaskEntity?, task4: TaskEntity?) {
        self.task1 = task1
        self.task2 = task2
        self.task3 = task3
        self.task4 = task4
    }
}
