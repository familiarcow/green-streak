import Foundation
import WidgetKit

/// Service for reading/writing widget data from App Group shared storage
final class SharedDataStore {

    // MARK: - Constants

    private static let appGroupIdentifier = "group.com.greenstreak.shared"
    private static let widgetDataKey = "widgetData"
    private static let quickAddConfigKey = "quickAddConfig"
    private static let pendingActionsKey = "pendingWidgetActions"

    // MARK: - Singleton

    static let shared = SharedDataStore()

    private init() {}

    // MARK: - Shared UserDefaults

    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: Self.appGroupIdentifier)
    }

    // MARK: - Read Methods

    /// Load the current widget sync data from shared storage
    func loadWidgetData() -> WidgetSyncData? {
        guard let defaults = sharedDefaults else {
            print("[Widget] Failed to access App Group storage")
            return nil
        }

        guard let jsonString = defaults.string(forKey: Self.widgetDataKey) else {
            print("[Widget] No widget data found in storage")
            return nil
        }

        guard let data = jsonString.data(using: .utf8) else {
            print("[Widget] Failed to convert JSON string to data")
            return nil
        }

        do {
            let decoder = JSONDecoder()
            let widgetData = try decoder.decode(WidgetSyncData.self, from: data)
            print("[Widget] Successfully loaded widget data, version: \(widgetData.version)")
            return widgetData
        } catch {
            print("[Widget] Failed to decode widget data: \(error)")
            return nil
        }
    }

    /// Get contribution data for the widget
    /// Returns the most recent N days of contribution data
    func getContributionData(days: Int = 84) -> [ContributionDate] {
        guard let widgetData = loadWidgetData() else {
            return WidgetSyncData.placeholder.contributionData.dates
        }

        let dates = widgetData.contributionData.dates

        // Return the most recent 'days' worth of data
        if dates.count > days {
            return Array(dates.suffix(days))
        }

        return dates
    }

    /// Get the color palette from widget data
    func getColorPalette() -> ColorPalette {
        guard let widgetData = loadWidgetData() else {
            return .defaultGreen
        }
        return widgetData.contributionData.palette
    }

    /// Get the max count for color intensity calculation
    func getMaxCount() -> Int {
        guard let widgetData = loadWidgetData() else {
            return 4
        }
        return widgetData.contributionData.maxCount
    }

    /// Get all active tasks
    func getTasks() -> [TaskData] {
        guard let widgetData = loadWidgetData() else {
            return []
        }
        return widgetData.tasks.filter { !$0.isArchived }
    }

    /// Get the last update timestamp
    func getLastUpdated() -> Date? {
        guard let widgetData = loadWidgetData() else {
            return nil
        }

        let formatter = ISO8601DateFormatter()
        return formatter.date(from: widgetData.lastUpdated)
    }

    // MARK: - Pending Actions (for Interactive Widgets)

    /// Save a pending action for the app to process
    func savePendingAction(_ action: PendingWidgetAction) {
        guard let defaults = sharedDefaults else {
            print("[Widget] Failed to access App Group storage for pending action")
            return
        }

        // Load existing actions
        var actions = loadPendingActions()

        // Add new action
        actions.append(action)

        // Save back to storage
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(actions)
            if let jsonString = String(data: data, encoding: .utf8) {
                defaults.set(jsonString, forKey: Self.pendingActionsKey)
                defaults.synchronize()
                print("[Widget] Pending action saved: \(action.type) for task \(action.taskId)")
            }
        } catch {
            print("[Widget] Failed to save pending action: \(error)")
        }
    }

    /// Load all pending actions from shared storage
    func loadPendingActions() -> [PendingWidgetAction] {
        guard let defaults = sharedDefaults,
              let jsonString = defaults.string(forKey: Self.pendingActionsKey),
              let data = jsonString.data(using: .utf8) else {
            return []
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode([PendingWidgetAction].self, from: data)
        } catch {
            print("[Widget] Failed to decode pending actions: \(error)")
            return []
        }
    }

    /// Get count of unprocessed pending actions for a task (for optimistic UI)
    func getPendingActionsCount(for taskId: String) -> Int {
        let actions = loadPendingActions()
        let today = getTodayString()

        return actions
            .filter { $0.taskId == taskId && $0.date == today && !$0.processed }
            .reduce(0) { count, action in
                if action.type == "quick_add" {
                    return count + 1
                } else if action.type == "quick_remove" {
                    return count - 1
                }
                return count
            }
    }

    /// Clear all pending actions (called after app processes them)
    func clearPendingActions() {
        guard let defaults = sharedDefaults else { return }
        defaults.removeObject(forKey: Self.pendingActionsKey)
        defaults.synchronize()
        print("[Widget] Pending actions cleared")
    }

    /// Mark specific actions as processed
    func markActionsProcessed(_ actionIds: [String]) {
        guard let defaults = sharedDefaults else { return }

        var actions = loadPendingActions()
        for i in 0..<actions.count {
            if actionIds.contains(actions[i].id) {
                // Create new action with processed = true
                let action = actions[i]
                actions[i] = PendingWidgetAction(
                    id: action.id,
                    type: action.type,
                    taskId: action.taskId,
                    date: action.date,
                    timestamp: action.timestamp,
                    processed: true
                )
            }
        }

        // Remove processed actions older than 1 hour to keep storage clean
        let oneHourAgo = Date(timeIntervalSinceNow: -3600)
        let formatter = ISO8601DateFormatter()
        actions = actions.filter { action in
            if action.processed {
                if let timestamp = formatter.date(from: action.timestamp) {
                    return timestamp > oneHourAgo
                }
                return false
            }
            return true
        }

        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(actions)
            if let jsonString = String(data: data, encoding: .utf8) {
                defaults.set(jsonString, forKey: Self.pendingActionsKey)
                defaults.synchronize()
            }
        } catch {
            print("[Widget] Failed to update pending actions: \(error)")
        }
    }

    // MARK: - Utility Methods

    /// Check if data is stale (older than 1 hour)
    func isDataStale() -> Bool {
        guard let lastUpdated = getLastUpdated() else {
            return true
        }

        let staleDuration: TimeInterval = 60 * 60 // 1 hour
        return Date().timeIntervalSince(lastUpdated) > staleDuration
    }

    /// Get today's date string in YYYY-MM-DD format
    func getTodayString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    /// Check if a date string is today
    func isToday(_ dateString: String) -> Bool {
        return dateString == getTodayString()
    }
}
