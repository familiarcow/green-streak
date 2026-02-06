import Foundation
import SwiftUI

// MARK: - Widget Data Models

/// Main data structure synced from the React Native app
struct WidgetSyncData: Codable {
    let version: Int
    let lastUpdated: String
    let contributionData: ContributionDataPayload
    let tasks: [TaskData]
    let quickAddConfig: QuickAddConfig
    let pendingActions: [PendingAction]
}

/// Contribution data with dates and color palette
struct ContributionDataPayload: Codable {
    let dates: [ContributionDate]
    let maxCount: Int
    let palette: ColorPalette
}

/// Single day contribution data
struct ContributionDate: Codable, Identifiable {
    let date: String
    let count: Int
    let level: Int

    var id: String { date }

    /// Parse the date string into a Date object
    var dateObject: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date)
    }
}

/// Color palette for contribution levels
struct ColorPalette: Codable {
    let empty: String
    let level1: String
    let level2: String
    let level3: String
    let level4: String

    /// Get the SwiftUI Color for a given level
    func color(for level: Int) -> Color {
        let hexString: String
        switch level {
        case 0:
            hexString = empty
        case 1:
            hexString = level1
        case 2:
            hexString = level2
        case 3:
            hexString = level3
        default:
            hexString = level4
        }
        return Color(hex: hexString) ?? Color.gray.opacity(0.2)
    }
}

/// Task data from the app
struct TaskData: Codable, Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: String
    let todayCount: Int
    let currentStreak: Int
    let bestStreak: Int
    let isMultiCompletion: Bool
    let isArchived: Bool
    let sortOrder: Int
    let streakEnabled: Bool

    /// Get the SwiftUI Color for this task
    var swiftUIColor: Color {
        Color(hex: color) ?? .blue
    }
}

/// Quick add widget configuration (for future use)
struct QuickAddConfig: Codable {
    let singleTaskId: String?
    let multiTaskIds: [String]
}

/// Pending widget action (for future interactive widgets)
struct PendingAction: Codable {
    let id: String
    let type: String
    let taskId: String
    let date: String
    let timestamp: String
    let processed: Bool
}

// MARK: - Default Values

extension WidgetSyncData {
    /// Default placeholder data for when no real data is available
    static var placeholder: WidgetSyncData {
        let calendar = Calendar.current
        let today = Date()

        // Generate placeholder dates for the last 35 days
        var placeholderDates: [ContributionDate] = []
        for dayOffset in (0..<35).reversed() {
            if let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                let dateString = formatter.string(from: date)

                // Random-ish level based on date
                let level = dayOffset % 5
                placeholderDates.append(ContributionDate(
                    date: dateString,
                    count: level,
                    level: level
                ))
            }
        }

        return WidgetSyncData(
            version: 1,
            lastUpdated: ISO8601DateFormatter().string(from: Date()),
            contributionData: ContributionDataPayload(
                dates: placeholderDates,
                maxCount: 4,
                palette: .defaultGreen
            ),
            tasks: [],
            quickAddConfig: QuickAddConfig(singleTaskId: nil, multiTaskIds: []),
            pendingActions: []
        )
    }
}

extension ColorPalette {
    /// Default green palette (GitHub-style)
    static var defaultGreen: ColorPalette {
        ColorPalette(
            empty: "#EBEDF0",
            level1: "#9BE9A8",
            level2: "#40C463",
            level3: "#30A14E",
            level4: "#216E39"
        )
    }
}

// MARK: - Color Extension

extension Color {
    /// Initialize a Color from a hex string
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0

        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else {
            return nil
        }

        let length = hexSanitized.count

        if length == 6 {
            let r = Double((rgb & 0xFF0000) >> 16) / 255.0
            let g = Double((rgb & 0x00FF00) >> 8) / 255.0
            let b = Double(rgb & 0x0000FF) / 255.0

            self.init(red: r, green: g, blue: b)
        } else if length == 3 {
            let r = Double((rgb & 0xF00) >> 8) / 15.0
            let g = Double((rgb & 0x0F0) >> 4) / 15.0
            let b = Double(rgb & 0x00F) / 15.0

            self.init(red: r, green: g, blue: b)
        } else {
            return nil
        }
    }
}
