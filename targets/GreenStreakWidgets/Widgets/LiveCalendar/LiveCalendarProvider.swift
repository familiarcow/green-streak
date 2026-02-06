import WidgetKit
import SwiftUI

/// Timeline entry for the LiveCalendar widget
struct LiveCalendarEntry: TimelineEntry {
    let date: Date
    let contributionDates: [ContributionDate]
    let palette: ColorPalette
    let maxCount: Int
    let lastUpdated: Date?

    /// Placeholder entry for preview/loading states
    static var placeholder: LiveCalendarEntry {
        let placeholderData = WidgetSyncData.placeholder
        return LiveCalendarEntry(
            date: Date(),
            contributionDates: placeholderData.contributionData.dates,
            palette: placeholderData.contributionData.palette,
            maxCount: placeholderData.contributionData.maxCount,
            lastUpdated: nil
        )
    }
}

/// Timeline provider for the LiveCalendar widget
struct LiveCalendarProvider: TimelineProvider {

    // MARK: - TimelineProvider Protocol

    /// Provide a placeholder entry for the widget gallery
    func placeholder(in context: Context) -> LiveCalendarEntry {
        return .placeholder
    }

    /// Provide a snapshot for the widget gallery and transitions
    func getSnapshot(in context: Context, completion: @escaping (LiveCalendarEntry) -> Void) {
        let entry = createEntry()
        completion(entry)
    }

    /// Provide the timeline of entries for the widget
    func getTimeline(in context: Context, completion: @escaping (Timeline<LiveCalendarEntry>) -> Void) {
        let entry = createEntry()

        // Calculate the next refresh time
        // During active hours (6 AM - 10 PM): refresh every 15 minutes
        // During inactive hours: refresh every hour
        let nextRefresh = calculateNextRefresh()

        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    // MARK: - Private Methods

    /// Create a timeline entry from current data
    private func createEntry() -> LiveCalendarEntry {
        let dataStore = SharedDataStore.shared

        if let widgetData = dataStore.loadWidgetData() {
            // Get pending actions count for today (optimistic UI)
            let todayString = dataStore.getTodayString()
            let pendingActions = dataStore.loadPendingActions()
            let todayPendingCount = pendingActions
                .filter { $0.date == todayString && !$0.processed && $0.type == "quick_add" }
                .count

            // Add optimistic count to today's contribution data
            var contributionDates = widgetData.contributionData.dates
            if todayPendingCount > 0 {
                if let todayIndex = contributionDates.firstIndex(where: { $0.date == todayString }) {
                    // Update existing today entry
                    let existing = contributionDates[todayIndex]
                    let newCount = existing.count + todayPendingCount
                    let newLevel = calculateLevel(count: newCount, maxCount: widgetData.contributionData.maxCount)
                    contributionDates[todayIndex] = ContributionDate(
                        date: existing.date,
                        count: newCount,
                        level: newLevel
                    )
                } else {
                    // Add new today entry
                    let newLevel = calculateLevel(count: todayPendingCount, maxCount: widgetData.contributionData.maxCount)
                    contributionDates.append(ContributionDate(
                        date: todayString,
                        count: todayPendingCount,
                        level: newLevel
                    ))
                }
            }

            return LiveCalendarEntry(
                date: Date(),
                contributionDates: contributionDates,
                palette: widgetData.contributionData.palette,
                maxCount: widgetData.contributionData.maxCount,
                lastUpdated: dataStore.getLastUpdated()
            )
        } else {
            // Return placeholder if no data available
            return .placeholder
        }
    }

    /// Calculate contribution level (0-4) based on count
    private func calculateLevel(count: Int, maxCount: Int) -> Int {
        if count == 0 { return 0 }

        let intensity = Double(count) / Double(max(maxCount, 1))

        if intensity <= 0.25 { return 1 }
        if intensity <= 0.5 { return 2 }
        if intensity <= 0.75 { return 3 }
        return 4
    }

    /// Calculate when the widget should next refresh
    private func calculateNextRefresh() -> Date {
        let calendar = Calendar.current
        let now = Date()
        let hour = calendar.component(.hour, from: now)

        // Active hours: 6 AM to 10 PM (6-22)
        let isActiveHours = hour >= 6 && hour < 22

        let refreshInterval: TimeInterval
        if isActiveHours {
            // Refresh every 15 minutes during active hours
            refreshInterval = 15 * 60
        } else {
            // Refresh every hour during inactive hours
            refreshInterval = 60 * 60
        }

        return Date(timeIntervalSinceNow: refreshInterval)
    }
}
