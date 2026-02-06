import WidgetKit
import SwiftUI

/// Data for a single task cell in the grid
@available(iOS 17.0, *)
struct QuickAddGridTaskData: Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: String
    let todayCount: Int
    let currentStreak: Int
    let isConfigured: Bool

    static var empty: QuickAddGridTaskData {
        QuickAddGridTaskData(
            id: "",
            name: "",
            icon: "plus.circle",
            color: "#9CA3AF",
            todayCount: 0,
            currentStreak: 0,
            isConfigured: false
        )
    }
}

/// Timeline entry for the QuickAdd Grid widget
@available(iOS 17.0, *)
struct QuickAddGridEntry: TimelineEntry {
    let date: Date
    let tasks: [QuickAddGridTaskData]

    /// Placeholder entry for preview/loading states
    static var placeholder: QuickAddGridEntry {
        QuickAddGridEntry(
            date: Date(),
            tasks: [
                QuickAddGridTaskData(id: "1", name: "Exercise", icon: "dumbbell", color: "#4CAF50", todayCount: 1, currentStreak: 7, isConfigured: true),
                QuickAddGridTaskData(id: "2", name: "Read", icon: "book", color: "#2196F3", todayCount: 0, currentStreak: 3, isConfigured: true),
                QuickAddGridTaskData(id: "3", name: "Meditate", icon: "brain", color: "#9C27B0", todayCount: 2, currentStreak: 14, isConfigured: true),
                QuickAddGridTaskData(id: "4", name: "Water", icon: "droplet", color: "#00BCD4", todayCount: 5, currentStreak: 21, isConfigured: true)
            ]
        )
    }

    /// Entry for when no tasks are configured
    static var notConfigured: QuickAddGridEntry {
        QuickAddGridEntry(
            date: Date(),
            tasks: [.empty, .empty, .empty, .empty]
        )
    }
}

/// Timeline provider for the QuickAdd Grid widget (iOS 17+)
@available(iOS 17.0, *)
struct QuickAddGridProvider: AppIntentTimelineProvider {
    typealias Entry = QuickAddGridEntry
    typealias Intent = QuickAddGridConfigIntent

    func placeholder(in context: Context) -> QuickAddGridEntry {
        return .placeholder
    }

    func snapshot(for configuration: QuickAddGridConfigIntent, in context: Context) async -> QuickAddGridEntry {
        return createEntry(for: configuration)
    }

    func timeline(for configuration: QuickAddGridConfigIntent, in context: Context) async -> Timeline<QuickAddGridEntry> {
        let entry = createEntry(for: configuration)

        // Refresh every 15 minutes to keep counts in sync
        let nextRefresh = Date(timeIntervalSinceNow: 15 * 60)
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))

        return timeline
    }

    /// Create an entry from the configuration and current data
    private func createEntry(for configuration: QuickAddGridConfigIntent) -> QuickAddGridEntry {
        let dataStore = SharedDataStore.shared
        let allTasks = dataStore.getTasks()

        // Get configured task entities
        let taskEntities = [configuration.task1, configuration.task2, configuration.task3, configuration.task4]

        // Check if all configured tasks are the same (meaning defaults were used)
        // In this case, use sequential tasks from the task list
        let configuredIds = taskEntities.compactMap { $0?.id }
        let allSameTask = configuredIds.count == 4 && Set(configuredIds).count == 1

        var taskDataList: [QuickAddGridTaskData] = []

        for index in 0..<4 {
            let taskData: TaskData?

            if allSameTask {
                // Use sequential tasks when defaults are in place
                if index < allTasks.count {
                    taskData = allTasks[index]
                } else if !allTasks.isEmpty {
                    // Fall back to first task for unused slots
                    taskData = allTasks[0]
                } else {
                    taskData = nil
                }
            } else {
                // Use explicitly configured task
                if let entity = taskEntities[index] {
                    taskData = allTasks.first(where: { $0.id == entity.id })
                } else if index < allTasks.count {
                    taskData = allTasks[index]
                } else if !allTasks.isEmpty {
                    taskData = allTasks[0]
                } else {
                    taskData = nil
                }
            }

            guard let task = taskData else {
                taskDataList.append(.empty)
                continue
            }

            // Get pending actions count for optimistic UI
            let pendingCount = dataStore.getPendingActionsCount(for: task.id)

            taskDataList.append(QuickAddGridTaskData(
                id: task.id,
                name: task.name,
                icon: task.icon,
                color: task.color,
                todayCount: task.todayCount + pendingCount,
                currentStreak: task.currentStreak,
                isConfigured: true
            ))
        }

        return QuickAddGridEntry(date: Date(), tasks: taskDataList)
    }
}
