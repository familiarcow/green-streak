import AppIntents
import WidgetKit

/// Entity representing a task in the widget configuration picker
@available(iOS 17.0, *)
struct TaskEntity: AppEntity {
    let id: String
    let name: String
    let icon: String
    let color: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Task"
    static var defaultQuery = TaskEntityQuery()

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }
}

/// Query to fetch tasks for the configuration picker
@available(iOS 17.0, *)
struct TaskEntityQuery: EntityQuery {
    func entities(for identifiers: [TaskEntity.ID]) async throws -> [TaskEntity] {
        let tasks = SharedDataStore.shared.getTasks()
        return tasks
            .filter { identifiers.contains($0.id) }
            .map { TaskEntity(id: $0.id, name: $0.name, icon: $0.icon, color: $0.color) }
    }

    func suggestedEntities() async throws -> [TaskEntity] {
        let tasks = SharedDataStore.shared.getTasks()
        return tasks.map { TaskEntity(id: $0.id, name: $0.name, icon: $0.icon, color: $0.color) }
    }

    func defaultResult() async -> TaskEntity? {
        let tasks = SharedDataStore.shared.getTasks()
        guard let first = tasks.first else { return nil }
        return TaskEntity(id: first.id, name: first.name, icon: first.icon, color: first.color)
    }
}

/// Configuration intent for selecting which task the QuickAdd widget tracks
@available(iOS 17.0, *)
struct QuickAddConfigIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select Task"
    static var description = IntentDescription("Choose which task to track")

    @Parameter(title: "Task")
    var task: TaskEntity?

    init() {}

    init(task: TaskEntity?) {
        self.task = task
    }
}
