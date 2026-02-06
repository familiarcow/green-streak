import SwiftUI
import WidgetKit
import AppIntents

/// View for the QuickAdd Grid widget - a 2x2 grid of task cells
/// Each cell shows the task icon and is tappable for quick add
@available(iOS 17.0, *)
struct QuickAddGridView: View {
    let entry: QuickAddGridEntry

    /// Empty cell color (matches LiveCalendar)
    private let emptyColor = Color(hex: "#EBEDF0") ?? Color.gray.opacity(0.2)

    /// Grid spacing
    private let gridSpacing: CGFloat = 4

    /// Corner radius for cells
    private let cornerRadius: CGFloat = 12

    var body: some View {
        GeometryReader { geometry in
            let cellSize = (min(geometry.size.width, geometry.size.height) - gridSpacing) / 2

            VStack(spacing: gridSpacing) {
                HStack(spacing: gridSpacing) {
                    taskCell(entry.tasks[0], size: cellSize)
                    taskCell(entry.tasks[1], size: cellSize)
                }
                HStack(spacing: gridSpacing) {
                    taskCell(entry.tasks[2], size: cellSize)
                    taskCell(entry.tasks[3], size: cellSize)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .padding(6)
    }

    /// Individual task cell
    @ViewBuilder
    private func taskCell(_ task: QuickAddGridTaskData, size: CGFloat) -> some View {
        if task.isConfigured {
            Button(intent: QuickAddIntent(taskId: task.id)) {
                cellContent(task, size: size)
            }
            .buttonStyle(.plain)
        } else {
            cellContent(task, size: size)
        }
    }

    /// Cell content (icon and optional count)
    private func cellContent(_ task: QuickAddGridTaskData, size: CGFloat) -> some View {
        let isCompleted = task.todayCount > 0
        let taskColor = Color(hex: task.color) ?? .blue

        return ZStack {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(isCompleted ? taskColor : emptyColor)

            VStack(spacing: 2) {
                // Task icon
                if let systemImage = sfSymbolName(for: task.icon) {
                    Image(systemName: systemImage)
                        .font(.system(size: size * 0.3, weight: .semibold))
                        .foregroundColor(isCompleted ? .white : Color(hex: "#9CA3AF") ?? .gray)
                }

                // Count (show if > 0)
                if task.todayCount > 0 {
                    Text("\(task.todayCount)")
                        .font(.system(size: size * 0.18, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
        }
        .frame(width: size, height: size)
    }

    /// Map icon names to SF Symbols
    /// Supports both Lucide icon names (from app) and SF Symbol names
    private func sfSymbolName(for icon: String) -> String? {
        let iconMap: [String: String] = [
            // Lucide icon names (from React Native app)
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
            "pen": "pencil",
            "notebook": "book.closed.fill",
            "glasses": "eyeglasses",
            "clipboard": "doc.on.clipboard.fill",
            "list-todo": "checklist",
            "layers": "square.3.layers.3d",
            "inbox": "tray.fill",
            "send": "paperplane.fill",
            "briefcase": "briefcase.fill",
            "laptop": "laptopcomputer",
            "code": "chevron.left.forwardslash.chevron.right",
            "bath": "shower.fill",
            "map": "map.fill",
            "compass": "safari.fill",
            "umbrella": "umbrella.fill",
            "shirt": "tshirt.fill",
            "apple": "apple.logo",
            "banana": "leaf.fill",
            "carrot": "carrot.fill",
            "wine": "wineglass.fill",
            "beer": "mug.fill",
            "pizza": "fork.knife",
            "salad": "leaf.fill",
            "cookie": "birthday.cake.fill",
            "message-circle": "message.fill",
            "video": "video.fill",
            "smile": "face.smiling.fill",
            "handshake": "hands.clap.fill",
            "flag": "flag.fill",
            "bookmark": "bookmark.fill",
            "tag": "tag.fill",
            "lock": "lock.fill",
            "key": "key.fill",
            "bell": "bell.fill",
            "trash": "trash.fill",
            "activity": "waveform.path.ecg",
            "stethoscope": "stethoscope",
            "thermometer": "thermometer",
            "bandage": "bandage.fill",
            "eye": "eye.fill",
            "ear": "ear.fill",
            "heart-pulse": "heart.fill",
            "graduation": "graduationcap.fill",
            "broom": "sparkles",
            "checkCircle": "checkmark.circle.fill",
            "plus.circle": "plus.circle",

            // SF Symbol names (direct passthrough)
            "drop.fill": "drop.fill",
            "bed.double.fill": "bed.double.fill",
            "book.fill": "book.fill",
            "heart.fill": "heart.fill",
            "star.fill": "star.fill",
            "sun.max.fill": "sun.max.fill",
            "moon.fill": "moon.fill",
            "leaf.fill": "leaf.fill",
            "flame.fill": "flame.fill",
            "bolt.fill": "bolt.fill",
            "checkmark.circle.fill": "checkmark.circle.fill",
            "pills.fill": "pills.fill",
            "cup.and.saucer.fill": "cup.and.saucer.fill",
            "fork.knife": "fork.knife",
            "music.note": "music.note",
            "gamecontroller.fill": "gamecontroller.fill",
            "paintbrush.fill": "paintbrush.fill",
            "camera.fill": "camera.fill",
            "phone.fill": "phone.fill",
            "envelope.fill": "envelope.fill",
            "clock.fill": "clock.fill",
            "house.fill": "house.fill",
            "car.fill": "car.fill",
            "airplane": "airplane",
            "banknote.fill": "banknote.fill",
            "cart.fill": "cart.fill",
            "gift.fill": "gift.fill",
            "person.fill": "person.fill",
            "person.2.fill": "person.2.fill",
            "pawprint.fill": "pawprint.fill",
            "figure.run": "figure.run",
            "figure.walk": "figure.walk"
        ]

        if let mapped = iconMap[icon] {
            return mapped
        }

        // If icon contains "." or "figure", assume it's already an SF Symbol
        if icon.contains(".") || icon.contains("figure") {
            return icon
        }

        // Fallback to plus for empty cells
        return "plus.circle"
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct QuickAddGridView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // All configured
            QuickAddGridView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("All Configured")

            // Not configured
            QuickAddGridView(entry: .notConfigured)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Not Configured")
        }
    }
}
