//
//  GreenStreakWidgetsBundle.swift
//  GreenStreakWidgets
//
//  Created by Tyler Bond on 1/19/26.
//

import WidgetKit
import SwiftUI

@main
struct GreenStreakWidgetsBundle: WidgetBundle {
    var body: some Widget {
        LiveCalendarWidget()

        if #available(iOS 17.0, *) {
            QuickAddWidget()
            QuickAddGridWidget()
            CalendarQuickAddWidget()
        }
    }
}
