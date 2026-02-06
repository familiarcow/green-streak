import WidgetKit
import SwiftUI

/// Timeline entry for the QuickAdd widget
@available(iOS 17.0, *)
struct QuickAddEntry: TimelineEntry {
    let date: Date
    let taskId: String?
    let taskName: String
    let taskIcon: String
    let taskColor: String
    let todayCount: Int
    let currentStreak: Int
    let isConfigured: Bool

    /// Placeholder entry for preview/loading states
    static var placeholder: QuickAddEntry {
        QuickAddEntry(
            date: Date(),
            taskId: nil,
            taskName: "Exercise",
            taskIcon: "figure.run",
            taskColor: "#4CAF50",
            todayCount: 0,
            currentStreak: 0,
            isConfigured: false
        )
    }

    /// Entry for when no task is selected
    static var notConfigured: QuickAddEntry {
        QuickAddEntry(
            date: Date(),
            taskId: nil,
            taskName: "Select Task",
            taskIcon: "plus.circle",
            taskColor: "#9CA3AF",
            todayCount: 0,
            currentStreak: 0,
            isConfigured: false
        )
    }
}

/// Timeline provider for the QuickAdd widget (iOS 17+)
@available(iOS 17.0, *)
struct QuickAddProvider: AppIntentTimelineProvider {
    typealias Entry = QuickAddEntry
    typealias Intent = QuickAddConfigIntent

    func placeholder(in context: Context) -> QuickAddEntry {
        return .placeholder
    }

    func snapshot(for configuration: QuickAddConfigIntent, in context: Context) async -> QuickAddEntry {
        return createEntry(for: configuration)
    }

    func timeline(for configuration: QuickAddConfigIntent, in context: Context) async -> Timeline<QuickAddEntry> {
        let entry = createEntry(for: configuration)

        // Refresh every 15 minutes to keep count in sync
        let nextRefresh = Date(timeIntervalSinceNow: 15 * 60)
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))

        return timeline
    }

    /// Create an entry from the configuration and current data
    private func createEntry(for configuration: QuickAddConfigIntent) -> QuickAddEntry {
        guard let selectedTask = configuration.task else {
            return .notConfigured
        }

        let dataStore = SharedDataStore.shared

        // Get task data from shared storage
        let tasks = dataStore.getTasks()
        guard let taskData = tasks.first(where: { $0.id == selectedTask.id }) else {
            // Task no longer exists
            return .notConfigured
        }

        // Get pending actions count for optimistic UI
        let pendingCount = dataStore.getPendingActionsCount(for: taskData.id)

        return QuickAddEntry(
            date: Date(),
            taskId: taskData.id,
            taskName: taskData.name,
            taskIcon: taskData.icon,
            taskColor: taskData.color,
            todayCount: taskData.todayCount + pendingCount,
            currentStreak: taskData.currentStreak,
            isConfigured: true
        )
    }
}
