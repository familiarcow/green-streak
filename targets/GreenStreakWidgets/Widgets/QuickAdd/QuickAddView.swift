import SwiftUI
import WidgetKit
import AppIntents

/// View for the QuickAdd widget - a single rounded square that fills the widget
/// Shows task icon, colored when completed today, gray when not
@available(iOS 17.0, *)
struct QuickAddView: View {
    let entry: QuickAddEntry

    /// Empty cell color (matches LiveCalendar)
    private let emptyColor = Color(hex: "#EBEDF0") ?? Color.gray.opacity(0.2)

    /// Common border radius from the app
    private let cornerRadius: CGFloat = 12

    var body: some View {
        if entry.isConfigured, let taskId = entry.taskId {
            // Interactive button - runs App Intent without opening app
            Button(intent: QuickAddIntent(taskId: taskId)) {
                widgetContent
            }
            .buttonStyle(.plain)
        } else {
            notConfiguredView
        }
    }

    /// Whether the task is completed today
    private var isCompletedToday: Bool {
        entry.todayCount > 0
    }

    /// Task color
    private var taskColor: Color {
        Color(hex: entry.taskColor) ?? .blue
    }

    /// Main widget content - rounded square that fills the entire widget
    private var widgetContent: some View {
        GeometryReader { geometry in
            ZStack {
                // Rounded square background - fills entire widget
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(isCompletedToday ? taskColor : emptyColor)

                // Content inside the square
                VStack(spacing: 4) {
                    // Task icon
                    if let systemImage = sfSymbolName(for: entry.taskIcon) {
                        Image(systemName: systemImage)
                            .font(.system(size: geometry.size.width * 0.35, weight: .semibold))
                            .foregroundColor(isCompletedToday ? .white : Color(hex: "#9CA3AF") ?? .gray)
                    }

                    // Count (show if > 0)
                    if entry.todayCount > 0 {
                        Text("\(entry.todayCount)")
                            .font(.system(size: geometry.size.width * 0.2, weight: .bold))
                            .foregroundColor(.white.opacity(0.9))
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    /// View shown when no task is configured
    private var notConfiguredView: some View {
        GeometryReader { geometry in
            ZStack {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(emptyColor)

                VStack(spacing: 4) {
                    Image(systemName: "plus")
                        .font(.system(size: geometry.size.width * 0.3, weight: .medium))
                        .foregroundColor(Color(hex: "#9CA3AF") ?? .gray)

                    Text("Tap to setup")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(hex: "#9CA3AF") ?? .gray)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
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

        // Fallback to checkmark
        return "checkmark.circle.fill"
    }
}

// MARK: - Preview

@available(iOS 17.0, *)
struct QuickAddView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Completed today
            QuickAddView(entry: QuickAddEntry(
                date: Date(),
                taskId: "1",
                taskName: "Exercise",
                taskIcon: "dumbbell",
                taskColor: "#4CAF50",
                todayCount: 4,
                currentStreak: 7,
                isConfigured: true
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Completed")

            // Not completed today
            QuickAddView(entry: QuickAddEntry(
                date: Date(),
                taskId: "1",
                taskName: "Exercise",
                taskIcon: "dumbbell",
                taskColor: "#4CAF50",
                todayCount: 0,
                currentStreak: 7,
                isConfigured: true
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Not Completed")

            // Not configured
            QuickAddView(entry: .notConfigured)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Not Configured")
        }
    }
}
