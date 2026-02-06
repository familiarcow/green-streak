import SwiftUI
import WidgetKit
import AppIntents

/// Combined Calendar + QuickAdd widget view
/// Medium: Calendar (identical to small calendar widget) + 2 stacked quick adds
/// Large: Calendar + 4 quick adds (2x2 grid)
@available(iOS 17.0, *)
struct CalendarQuickAddView: View {
    let entry: CalendarQuickAddEntry

    /// Surface color (matches LiveCalendarView)
    private let surfaceColor = Color.white

    /// Empty cell color
    private let emptyColor = Color(hex: "#EBEDF0") ?? Color.gray.opacity(0.2)

    /// Corner radius for quick add cells (matches QuickAddView)
    private let quickAddCornerRadius: CGFloat = 12

    var body: some View {
        GeometryReader { geometry in
            // For medium widget: use ~75% width to simulate 3-app width
            // Content should be calendar (square) + quick adds (stacked squares)
            let padding: CGFloat = 12
            let spacing: CGFloat = 8
            let availableHeight = geometry.size.height - (padding * 2)

            // Quick add cells should be square and fit 2 vertically
            let quickAddCellSize = (availableHeight - spacing) / 2

            // Calendar should be square, same height as the widget content area
            let calendarSize = availableHeight

            // Total content width
            let contentWidth = calendarSize + spacing + quickAddCellSize

            HStack(spacing: spacing) {
                // Calendar section - square
                calendarSection(size: calendarSize)

                // Quick add section - 2 stacked squares
                VStack(spacing: spacing) {
                    quickAddCell(entry.tasks[safe: 0], size: quickAddCellSize)
                    quickAddCell(entry.tasks[safe: 1], size: quickAddCellSize)
                }
            }
            .frame(width: contentWidth, height: availableHeight)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading) // Align left, leave space on right
        }
        .padding(12)
        .background(surfaceColor)
    }

    // MARK: - Calendar Section (matches LiveCalendarView exactly)

    private func calendarSection(size: CGFloat) -> some View {
        let spacing: CGFloat = 4
        let labelFontSize: CGFloat = 9
        let weeksToShow = 5

        // Calculate box size to fit in square
        let labelHeight: CGFloat = labelFontSize + 4
        let gridHeight = size - labelHeight - spacing
        let boxSize = (gridHeight - (spacing * CGFloat(weeksToShow - 1))) / CGFloat(weeksToShow)

        return VStack(spacing: 0) {
            // Day labels row
            HStack(spacing: spacing) {
                ForEach(0..<7, id: \.self) { index in
                    Text(dayLabels[index])
                        .font(.system(size: labelFontSize, weight: .medium))
                        .foregroundColor(Color(hex: "#9CA3AF") ?? .gray)
                        .frame(width: boxSize)
                }
            }

            Spacer().frame(height: spacing)

            // Calendar grid
            let gridData = buildGridData(weeksToShow: weeksToShow)
            VStack(spacing: spacing) {
                ForEach(0..<gridData.count, id: \.self) { weekIndex in
                    HStack(spacing: spacing) {
                        ForEach(0..<7, id: \.self) { dayIndex in
                            if dayIndex < gridData[weekIndex].count {
                                let dayData = gridData[weekIndex][dayIndex]
                                dayCell(for: dayData, size: boxSize)
                            } else {
                                emptyDayCell(size: boxSize)
                            }
                        }
                    }
                }
            }
        }
        .frame(width: size, height: size)
    }

    // MARK: - Day Cell (matches LiveCalendarView)

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

    private func emptyDayCell(size: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 3)
            .fill(emptyColor)
            .frame(width: size, height: size)
    }

    // MARK: - Quick Add Cell (matches QuickAddView)

    @ViewBuilder
    private func quickAddCell(_ task: CalendarQuickAddTaskData?, size: CGFloat) -> some View {
        let taskData = task ?? .empty

        if taskData.isConfigured {
            Button(intent: QuickAddIntent(taskId: taskData.id)) {
                quickAddCellContent(taskData, size: size)
            }
            .buttonStyle(.plain)
        } else {
            quickAddCellContent(taskData, size: size)
        }
    }

    private func quickAddCellContent(_ task: CalendarQuickAddTaskData, size: CGFloat) -> some View {
        let isCompleted = task.todayCount > 0
        let taskColor = Color(hex: task.color) ?? .blue

        return ZStack {
            RoundedRectangle(cornerRadius: quickAddCornerRadius)
                .fill(isCompleted ? taskColor : emptyColor)

            VStack(spacing: 4) {
                if let systemImage = sfSymbolName(for: task.icon) {
                    Image(systemName: systemImage)
                        .font(.system(size: size * 0.35, weight: .semibold))
                        .foregroundColor(isCompleted ? .white : Color(hex: "#9CA3AF") ?? .gray)
                }

                if task.todayCount > 0 {
                    Text("\(task.todayCount)")
                        .font(.system(size: size * 0.2, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
        }
        .frame(width: size, height: size)
    }

    // MARK: - Day Labels

    private var dayLabels: [String] {
        let dayNames = ["S", "M", "T", "W", "T", "F", "S"]
        let calendar = Calendar.current
        let today = Date()
        let totalDays = 5 * 7

        guard let startDate = calendar.date(byAdding: .day, value: -(totalDays - 1), to: today) else {
            return ["M", "T", "W", "T", "F", "S", "S"]
        }

        let firstDayOfWeek = calendar.component(.weekday, from: startDate) - 1

        var rotatedLabels: [String] = []
        for i in 0..<7 {
            rotatedLabels.append(dayNames[(firstDayOfWeek + i) % 7])
        }
        return rotatedLabels
    }

    // MARK: - Grid Data Builder

    private func buildGridData(weeksToShow: Int) -> [[ContributionDate]] {
        let totalDays = weeksToShow * 7
        let calendar = Calendar.current
        let today = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        var dateLookup: [String: ContributionDate] = [:]
        for date in entry.contributionDates {
            dateLookup[date.date] = date
        }

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

        var weeks: [[ContributionDate]] = []
        for i in stride(from: 0, to: allDates.count, by: 7) {
            let endIndex = min(i + 7, allDates.count)
            weeks.append(Array(allDates[i..<endIndex]))
        }

        return weeks
    }

    // MARK: - Icon Mapping

    private func sfSymbolName(for icon: String) -> String? {
        let iconMap: [String: String] = [
            "droplet": "drop.fill",
            "heart": "heart.fill",
            "star": "star.fill",
            "sun": "sun.max.fill",
            "moon": "moon.fill",
            "zap": "bolt.fill",
            "target": "target",
            "pill": "pills.fill",
            "coffee": "cup.and.saucer.fill",
            "utensils": "fork.knife",
            "music": "music.note",
            "palette": "paintbrush.fill",
            "camera": "camera.fill",
            "phone": "phone.fill",
            "mail": "envelope.fill",
            "clock": "clock.fill",
            "calendar": "calendar",
            "home": "house.fill",
            "car": "car.fill",
            "plane": "airplane",
            "gift": "gift.fill",
            "user": "person.fill",
            "users": "person.2.fill",
            "book": "book.fill",
            "bed": "bed.double.fill",
            "dumbbell": "dumbbell.fill",
            "brain": "brain.head.profile",
            "pencil": "pencil",
            "footprints": "figure.walk",
            "bike": "bicycle",
            "medal": "medal.fill",
            "trophy": "trophy.fill",
            "timer": "timer",
            "lightbulb": "lightbulb.fill",
            "activity": "waveform.path.ecg",
            "checkCircle": "checkmark.circle.fill",
            "plus.circle": "plus.circle"
        ]

        if let mapped = iconMap[icon] {
            return mapped
        }

        if icon.contains(".") || icon.contains("figure") {
            return icon
        }

        return "checkmark.circle.fill"
    }
}

// MARK: - Safe Array Access

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct CalendarQuickAddView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            CalendarQuickAddView(entry: .placeholder(family: .systemMedium))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")

            CalendarQuickAddView(entry: .placeholder(family: .systemLarge))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")
        }
    }
}
