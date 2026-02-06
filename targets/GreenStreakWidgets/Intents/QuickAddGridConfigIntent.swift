import AppIntents
import WidgetKit

/// Configuration intent for selecting 4 tasks for the QuickAdd Grid widget
@available(iOS 17.0, *)
struct QuickAddGridConfigIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select Tasks"
    static var description = IntentDescription("Choose up to 4 tasks to track")

    @Parameter(title: "Task 1")
    var task1: TaskEntity?

    @Parameter(title: "Task 2")
    var task2: TaskEntity?

    @Parameter(title: "Task 3")
    var task3: TaskEntity?

    @Parameter(title: "Task 4")
    var task4: TaskEntity?

    init() {}

    init(task1: TaskEntity?, task2: TaskEntity?, task3: TaskEntity?, task4: TaskEntity?) {
        self.task1 = task1
        self.task2 = task2
        self.task3 = task3
        self.task4 = task4
    }

    /// Get all configured tasks as an array
    var configuredTasks: [TaskEntity] {
        [task1, task2, task3, task4].compactMap { $0 }
    }
}
