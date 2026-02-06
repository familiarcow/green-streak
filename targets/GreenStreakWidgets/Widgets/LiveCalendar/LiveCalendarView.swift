import SwiftUI
import WidgetKit

/// Main view for the LiveCalendar widget - exact replica of the app's LiveCalendar
struct LiveCalendarView: View {
    @Environment(\.widgetFamily) var family
    let entry: LiveCalendarEntry

    /// App's eggshell background color
    private let backgroundColor = Color(hex: "#F9F7F4") ?? Color(.systemBackground)

    /// App's surface color (card background)
    private let surfaceColor = Color.white

    /// App's empty cell color
    private let emptyColor = Color(hex: "#EBEDF0") ?? Color.gray.opacity(0.2)

    var body: some View {
        GeometryReader { geometry in
            let gridConfig = calculateGridConfig(for: geometry.size)

            VStack(spacing: 0) {
                // Day labels row (M T W T F S S)
                HStack(spacing: gridConfig.spacing) {
                    ForEach(0..<7, id: \.self) { index in
                        Text(dayLabels[index])
                            .font(.system(size: labelFontSize, weight: .medium))
                            .foregroundColor(Color(hex: "#9CA3AF") ?? .gray)
                            .frame(width: gridConfig.boxSize)
                    }
                }

                Spacer().frame(height: gridConfig.spacing)

                // Calendar grid
                let gridData = buildGridData()
                VStack(spacing: gridConfig.spacing) {
                    ForEach(0..<gridData.count, id: \.self) { weekIndex in
                        HStack(spacing: gridConfig.spacing) {
                            ForEach(0..<7, id: \.self) { dayIndex in
                                if dayIndex < gridData[weekIndex].count {
                                    let dayData = gridData[weekIndex][dayIndex]
                                    dayCell(for: dayData, size: gridConfig.boxSize)
                                } else {
                                    emptyCell(size: gridConfig.boxSize)
                                }
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .padding(12)
        .background(surfaceColor)
        .widgetURL(URL(string: "greenstreak://calendar?date=\(todayDateString)"))
    }

    // MARK: - Grid Configuration

    private func calculateGridConfig(for size: CGSize) -> (boxSize: CGFloat, spacing: CGFloat) {
        let spacing: CGFloat = 4
        let horizontalPadding: CGFloat = 0 // Already handled by outer padding

        // Calculate box size based on width (7 boxes + 6 gaps)
        let availableWidth = size.width - horizontalPadding
        let boxSizeFromWidth = (availableWidth - (spacing * 6)) / 7

        // Calculate box size based on height (5 rows + 4 gaps + label row + label gap)
        let labelHeight: CGFloat = labelFontSize + 4
        let availableHeight = size.height - labelHeight - spacing
        let boxSizeFromHeight = (availableHeight - (spacing * 4)) / 5

        // Use the smaller of the two to ensure squares fit
        let boxSize = min(boxSizeFromWidth, boxSizeFromHeight)

        return (boxSize: max(boxSize, 8), spacing: spacing)
    }

    // MARK: - Day Labels

    /// Calculate day labels based on the first day of the grid
    private var dayLabels: [String] {
        let dayNames = ["S", "M", "T", "W", "T", "F", "S"]
        let calendar = Calendar.current
        let today = Date()
        let totalDays = weeksToShow * 7

        // Calculate start date
        guard let startDate = calendar.date(byAdding: .day, value: -(totalDays - 1), to: today) else {
            return ["M", "T", "W", "T", "F", "S", "S"]
        }

        let firstDayOfWeek = calendar.component(.weekday, from: startDate) - 1 // 0 = Sunday

        // Rotate labels to match
        var rotatedLabels: [String] = []
        for i in 0..<7 {
            rotatedLabels.append(dayNames[(firstDayOfWeek + i) % 7])
        }
        return rotatedLabels
    }

    // MARK: - Day Cells

    private func dayCell(for data: ContributionDate, size: CGFloat) -> some View {
        let isToday = SharedDataStore.shared.isToday(data.date)
        let color = entry.palette.color(for: data.level)

        return RoundedRectangle(cornerRadius: 3)
            .fill(data.level == 0 ? emptyColor : color)
            .frame(width: size, height: size)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .strokeBorder(
                        isToday ? Color(hex: "#FFD700") ?? .yellow : .clear,
                        lineWidth: isToday ? 2 : 0
                    )
            )
            .shadow(
                color: isToday ? Color(hex: "#FFD700")?.opacity(0.6) ?? .clear : .clear,
                radius: isToday ? 6 : 0
            )
    }

    private func emptyCell(size: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 3)
            .fill(emptyColor)
            .frame(width: size, height: size)
    }

    // MARK: - Grid Data Builder

    private func buildGridData() -> [[ContributionDate]] {
        let totalDays = weeksToShow * 7
        let calendar = Calendar.current
        let today = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        // Create lookup dictionary
        var dateLookup: [String: ContributionDate] = [:]
        for date in entry.contributionDates {
            dateLookup[date.date] = date
        }

        // Generate all days ending with today
        var allDates: [ContributionDate] = []
        for dayOffset in (0..<totalDays).reversed() {
            if let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) {
                let dateString = formatter.string(from: date)

                if let existingData = dateLookup[dateString] {
                    allDates.append(existingData)
                } else {
                    allDates.append(ContributionDate(
                        date: dateString,
                        count: 0,
                        level: 0
                    ))
                }
            }
        }

        // Split into weeks
        var weeks: [[ContributionDate]] = []
        for i in stride(from: 0, to: allDates.count, by: 7) {
            let endIndex = min(i + 7, allDates.count)
            weeks.append(Array(allDates[i..<endIndex]))
        }

        return weeks
    }

    // MARK: - Configuration

    private var weeksToShow: Int {
        switch family {
        case .systemSmall: return 5
        case .systemMedium: return 5
        case .systemLarge: return 8
        @unknown default: return 5
        }
    }

    private var labelFontSize: CGFloat {
        switch family {
        case .systemSmall: return 9
        case .systemMedium: return 11
        case .systemLarge: return 12
        @unknown default: return 9
        }
    }

    // MARK: - Helpers

    private var todayDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

// MARK: - Preview

struct LiveCalendarView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LiveCalendarView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            LiveCalendarView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))

            LiveCalendarView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
