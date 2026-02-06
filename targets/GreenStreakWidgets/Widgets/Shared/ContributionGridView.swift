import SwiftUI
import WidgetKit

/// A contribution grid view for widgets - matches the app's LiveCalendar layout
/// Layout: Weeks are ROWS (stacked vertically), days are COLUMNS (7 days per row)
struct ContributionGridView: View {
    let dates: [ContributionDate]
    let palette: ColorPalette
    let weeksToShow: Int
    let boxSize: CGFloat
    let spacing: CGFloat

    /// Initialize with contribution data
    /// - Parameters:
    ///   - dates: Array of contribution dates (most recent should be last)
    ///   - palette: Color palette for contribution levels
    ///   - weeksToShow: Number of weeks to display
    ///   - boxSize: Size of each day box
    ///   - spacing: Spacing between boxes
    init(
        dates: [ContributionDate],
        palette: ColorPalette,
        weeksToShow: Int,
        boxSize: CGFloat = 10,
        spacing: CGFloat = 4
    ) {
        self.dates = dates
        self.palette = palette
        self.weeksToShow = weeksToShow
        self.boxSize = boxSize
        self.spacing = spacing
    }

    var body: some View {
        let gridData = buildGridData()

        // VStack of weeks (rows), each week is an HStack of 7 days
        VStack(spacing: spacing) {
            ForEach(gridData.indices, id: \.self) { weekIndex in
                HStack(spacing: spacing) {
                    ForEach(0..<7) { dayIndex in
                        if weekIndex < gridData.count && dayIndex < gridData[weekIndex].count {
                            let dayData = gridData[weekIndex][dayIndex]
                            ContributionDayView(
                                date: dayData,
                                palette: palette,
                                size: boxSize,
                                isToday: SharedDataStore.shared.isToday(dayData.date)
                            )
                        } else {
                            // Empty placeholder
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.clear)
                                .frame(width: boxSize, height: boxSize)
                        }
                    }
                }
            }
        }
    }

    /// Build the grid data organized by weeks (rows)
    /// Each week is an array of 7 days (displayed left to right)
    private func buildGridData() -> [[ContributionDate]] {
        let totalDays = weeksToShow * 7
        let calendar = Calendar.current
        let today = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        // Create a lookup dictionary for quick date access
        var dateLookup: [String: ContributionDate] = [:]
        for date in dates {
            dateLookup[date.date] = date
        }

        // Generate all days we need, ending with today
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

        // Split into weeks of 7 days each
        var weeks: [[ContributionDate]] = []
        for i in stride(from: 0, to: allDates.count, by: 7) {
            let endIndex = min(i + 7, allDates.count)
            let week = Array(allDates[i..<endIndex])
            weeks.append(week)
        }

        return weeks
    }
}

/// Individual day view in the contribution grid
struct ContributionDayView: View {
    let date: ContributionDate
    let palette: ColorPalette
    let size: CGFloat
    let isToday: Bool

    // Corner radius of 3 matches the app's borderRadius: 3
    private let cornerRadius: CGFloat = 3

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(palette.color(for: date.level))
            .frame(width: size, height: size)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .strokeBorder(
                        isToday ? Color(hex: "#FFD700") ?? .yellow : .clear,
                        lineWidth: isToday ? 2 : 0
                    )
            )
            .shadow(
                color: isToday ? Color(hex: "#FFD700")?.opacity(0.6) ?? .clear : .clear,
                radius: isToday ? 4 : 0
            )
    }
}

// MARK: - Previews

struct ContributionGridView_Previews: PreviewProvider {
    static var previews: some View {
        ContributionGridView(
            dates: WidgetSyncData.placeholder.contributionData.dates,
            palette: .defaultGreen,
            weeksToShow: 7,
            boxSize: 12,
            spacing: 2
        )
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
