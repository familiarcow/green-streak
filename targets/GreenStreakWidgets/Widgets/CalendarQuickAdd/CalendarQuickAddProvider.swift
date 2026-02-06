import WidgetKit
import SwiftUI

/// Data for a quick add task in the combined widget
@available(iOS 17.0, *)
struct CalendarQuickAddTaskData: Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: String
    let todayCount: Int
    let isConfigured: Bool

    static var empty: CalendarQuickAddTaskData {
        CalendarQuickAddTaskData(
            id: "",
            name: "",
            icon: "plus.circle",
            color: "#9CA3AF",
            todayCount: 0,
            isConfigured: false
        )
    }
}

/// Timeline entry for the Calendar + QuickAdd widget
@available(iOS 17.0, *)
struct CalendarQuickAddEntry: TimelineEntry {
    let date: Date
    let contributionDates: [ContributionDate]
    let palette: ColorPalette
    let maxCount: Int
    let tasks: [CalendarQuickAddTaskData]
    let family: WidgetFamily

    /// Placeholder entry
    static func placeholder(family: WidgetFamily) -> CalendarQuickAddEntry {
        let placeholderData = WidgetSyncData.placeholder
        let taskCount = family == .systemLarge ? 4 : 2
        let tasks: [CalendarQuickAddTaskData] = [
            CalendarQuickAddTaskData(id: "1", name: "Exercise", icon: "dumbbell", color: "#4CAF50", todayCount: 1, isConfigured: true),
            CalendarQuickAddTaskData(id: "2", name: "Read", icon: "book", color: "#2196F3", todayCount: 0, isConfigured: true),
            CalendarQuickAddTaskData(id: "3", name: "Meditate", icon: "brain", color: "#9C27B0", todayCount: 2, isConfigured: true),
            CalendarQuickAddTaskData(id: "4", name: "Water", icon: "droplet", color: "#00BCD4", todayCount: 5, isConfigured: true)
        ]

        return CalendarQuickAddEntry(
            date: Date(),
            contributionDates: placeholderData.contributionData.dates,
            palette: placeholderData.contributionData.palette,
            maxCount: placeholderData.contributionData.maxCount,
            tasks: Array(tasks.prefix(taskCount)),
            family: family
        )
    }
}

/// Timeline provider for the Calendar + QuickAdd widget
@available(iOS 17.0, *)
struct CalendarQuickAddProvider: AppIntentTimelineProvider {
    typealias Entry = CalendarQuickAddEntry
    typealias Intent = CalendarQuickAddConfigIntent

    func placeholder(in context: Context) -> CalendarQuickAddEntry {
        return .placeholder(family: context.family)
    }

    func snapshot(for configuration: CalendarQuickAddConfigIntent, in context: Context) async -> CalendarQuickAddEntry {
        return createEntry(for: configuration, family: context.family)
    }

    func timeline(for configuration: CalendarQuickAddConfigIntent, in context: Context) async -> Timeline<CalendarQuickAddEntry> {
        let entry = createEntry(for: configuration, family: context.family)

        // Refresh every 15 minutes
        let nextRefresh = Date(timeIntervalSinceNow: 15 * 60)
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))

        return timeline
    }

    private func createEntry(for configuration: CalendarQuickAddConfigIntent, family: WidgetFamily) -> CalendarQuickAddEntry {
        let dataStore = SharedDataStore.shared
        let allTasks = dataStore.getTasks()

        // Load contribution data with optimistic updates
        let todayString = dataStore.getTodayString()
        let pendingActions = dataStore.loadPendingActions()
        let todayPendingCount = pendingActions
            .filter { $0.date == todayString && !$0.processed && $0.type == "quick_add" }
            .count

        var contributionDates: [ContributionDate]
        var palette: ColorPalette
        var maxCount: Int

        if let widgetData = dataStore.loadWidgetData() {
            contributionDates = widgetData.contributionData.dates
            palette = widgetData.contributionData.palette
            maxCount = widgetData.contributionData.maxCount

            // Add optimistic count to today
            if todayPendingCount > 0 {
                if let todayIndex = contributionDates.firstIndex(where: { $0.date == todayString }) {
                    let existing = contributionDates[todayIndex]
                    let newCount = existing.count + todayPendingCount
                    let newLevel = calculateLevel(count: newCount, maxCount: maxCount)
                    contributionDates[todayIndex] = ContributionDate(
                        date: existing.date,
                        count: newCount,
                        level: newLevel
                    )
                }
            }
        } else {
            let placeholder = WidgetSyncData.placeholder
            contributionDates = placeholder.contributionData.dates
            palette = placeholder.contributionData.palette
            maxCount = placeholder.contributionData.maxCount
        }

        // Get tasks based on widget size
        let taskCount = family == .systemLarge ? 4 : 2
        let taskEntities = [configuration.task1, configuration.task2, configuration.task3, configuration.task4]

        // Check if using defaults (all same task)
        let configuredIds = taskEntities.prefix(taskCount).compactMap { $0?.id }
        let allSameTask = configuredIds.count == taskCount && Set(configuredIds).count == 1

        var taskDataList: [CalendarQuickAddTaskData] = []

        for index in 0..<taskCount {
            let taskData: TaskData?

            if allSameTask {
                // Use sequential tasks when defaults are in place
                if index < allTasks.count {
                    taskData = allTasks[index]
                } else if !allTasks.isEmpty {
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

            let pendingCount = dataStore.getPendingActionsCount(for: task.id)

            taskDataList.append(CalendarQuickAddTaskData(
                id: task.id,
                name: task.name,
                icon: task.icon,
                color: task.color,
                todayCount: task.todayCount + pendingCount,
                isConfigured: true
            ))
        }

        return CalendarQuickAddEntry(
            date: Date(),
            contributionDates: contributionDates,
            palette: palette,
            maxCount: maxCount,
            tasks: taskDataList,
            family: family
        )
    }

    private func calculateLevel(count: Int, maxCount: Int) -> Int {
        if count == 0 { return 0 }
        let intensity = Double(count) / Double(max(maxCount, 1))
        if intensity <= 0.25 { return 1 }
        if intensity <= 0.5 { return 2 }
        if intensity <= 0.75 { return 3 }
        return 4
    }
}
