import Foundation
import WidgetKit
import React

@objc(WidgetBridge)
class WidgetBridge: NSObject {

  private let appGroupIdentifier = "group.com.greenstreak.shared"
  private let widgetDataKey = "widgetData"
  private let quickAddConfigKey = "quickAddConfig"
  private let pendingActionsKey = "pendingWidgetActions"

  // MARK: - Shared UserDefaults

  private var sharedDefaults: UserDefaults? {
    return UserDefaults(suiteName: appGroupIdentifier)
  }

  // MARK: - Phase 1: Data Sync Methods

  /// Sync widget data from React Native to App Group shared storage
  @objc
  func syncWidgetData(_ jsonString: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("SYNC_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    // Validate JSON before storing
    guard let data = jsonString.data(using: .utf8),
          let _ = try? JSONSerialization.jsonObject(with: data, options: []) else {
      rejecter("SYNC_ERROR", "Invalid JSON data", nil)
      return
    }

    defaults.set(jsonString, forKey: widgetDataKey)
    defaults.synchronize()

    resolver(["success": true])
  }

  /// Reload all widget timelines
  @objc
  func reloadWidgets(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      resolver(["success": true])
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14 or later", nil)
    }
  }

  /// Reload a specific widget by kind
  @objc
  func reloadWidget(_ kind: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
      resolver(["success": true])
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14 or later", nil)
    }
  }

  /// Get current widget data from shared storage
  @objc
  func getWidgetData(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("READ_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    let data = defaults.string(forKey: widgetDataKey)
    resolver(data as Any)
  }

  // MARK: - Phase 2+ Stubs: Quick Add Configuration

  /// Set quick add widget configuration (stub for Phase 2+)
  @objc
  func setQuickAddConfig(_ jsonString: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("CONFIG_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    defaults.set(jsonString, forKey: quickAddConfigKey)
    defaults.synchronize()

    resolver(["success": true])
  }

  /// Get quick add widget configuration (stub for Phase 2+)
  @objc
  func getQuickAddConfig(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("CONFIG_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    let config = defaults.string(forKey: quickAddConfigKey)
    resolver(config as Any)
  }

  // MARK: - Pending Actions (Widget Quick Add)

  /// Get pending widget actions from App Group shared storage
  @objc
  func getPendingActions(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("PENDING_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    let actionsJson = defaults.string(forKey: pendingActionsKey) ?? "[]"
    resolver(actionsJson)
  }

  /// Mark specific actions as processed and clean up old processed actions
  @objc
  func markActionsProcessed(_ actionIds: NSArray, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let defaults = sharedDefaults else {
      rejecter("PENDING_ERROR", "Failed to access App Group shared storage", nil)
      return
    }

    // Load existing actions
    guard let jsonString = defaults.string(forKey: pendingActionsKey),
          let jsonData = jsonString.data(using: .utf8),
          var actions = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [[String: Any]] else {
      // No actions to process
      resolver(["success": true, "processed": 0])
      return
    }

    let idsToMark = actionIds.compactMap { $0 as? String }
    var processedCount = 0

    // Mark matching actions as processed
    for i in 0..<actions.count {
      if let actionId = actions[i]["id"] as? String, idsToMark.contains(actionId) {
        actions[i]["processed"] = true
        processedCount += 1
      }
    }

    // Clean up processed actions older than 1 hour
    let oneHourAgo = Date(timeIntervalSinceNow: -3600)
    let formatter = ISO8601DateFormatter()
    actions = actions.filter { action in
      guard let processed = action["processed"] as? Bool, processed else {
        return true // Keep unprocessed actions
      }
      guard let timestampString = action["timestamp"] as? String,
            let timestamp = formatter.date(from: timestampString) else {
        return false // Remove if can't parse timestamp
      }
      return timestamp > oneHourAgo
    }

    // Save updated actions back to storage
    do {
      let updatedData = try JSONSerialization.data(withJSONObject: actions, options: [])
      if let updatedJson = String(data: updatedData, encoding: .utf8) {
        defaults.set(updatedJson, forKey: pendingActionsKey)
        defaults.synchronize()
      }
      resolver(["success": true, "processed": processedCount])
    } catch {
      rejecter("PENDING_ERROR", "Failed to update pending actions", error)
    }
  }

  // MARK: - Phase 2+ Stubs: Event Emitter (for widget action callbacks)

  /// Register the module as an event emitter (stub for Phase 2+)
  @objc
  func registerEventEmitter(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Stub for future interactive widget support
    // Will be implemented when Quick Add widgets are added
    resolver(["registered": true, "phase": 1])
  }

  /// Get current widget state info (stub for Phase 2+)
  @objc
  func getWidgetState(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.getCurrentConfigurations { result in
        switch result {
        case .success(let widgets):
          let widgetInfo = widgets.map { widget -> [String: Any] in
            return [
              "kind": widget.kind,
              "family": self.familyToString(widget.family)
            ]
          }
          resolver(["widgets": widgetInfo, "count": widgets.count])
        case .failure(let error):
          rejecter("STATE_ERROR", error.localizedDescription, error)
        }
      }
    } else {
      rejecter("UNSUPPORTED", "Widgets require iOS 14 or later", nil)
    }
  }

  // MARK: - Helper Methods

  @available(iOS 14.0, *)
  private func familyToString(_ family: WidgetFamily) -> String {
    switch family {
    case .systemSmall:
      return "small"
    case .systemMedium:
      return "medium"
    case .systemLarge:
      return "large"
    case .systemExtraLarge:
      return "extraLarge"
    case .accessoryCircular:
      return "accessoryCircular"
    case .accessoryRectangular:
      return "accessoryRectangular"
    case .accessoryInline:
      return "accessoryInline"
    @unknown default:
      return "unknown"
    }
  }

  // MARK: - Module Configuration

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
