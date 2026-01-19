import { IconName } from '../components/common/Icon';

/**
 * Maps IconNames to their closest emoji equivalents for use in notifications.
 * Notifications can only display text/emoji, not SVG icons.
 */
export const ICON_TO_EMOJI: Record<IconName, string> = {
  // UI/Navigation icons
  'settings': '⚙️',
  'chevron-right': '▶️',
  'chevron-left': '◀️',
  'chevron-up': '🔼',
  'chevron-down': '🔽',
  'checkCircle': '✅',
  'check': '✓',
  'circle': '⭕',
  'plus': '➕',
  'minus': '➖',
  'x': '❌',
  'moreHorizontal': '•••',
  'loader': '⏳',
  'edit': '✏️',
  'search': '🔍',
  // Health icons
  'heart': '❤️',
  'pill': '💊',
  'activity': '📈',
  'droplet': '💧',
  'stethoscope': '🩺',
  'thermometer': '🌡️',
  'bandage': '🩹',
  'eye': '👁️',
  'ear': '👂',
  'heart-pulse': '💓',
  // Fitness icons
  'dumbbell': '🏋️',
  'footprints': '👣',
  'bike': '🚴',
  'medal': '🏅',
  'trophy': '🏆',
  'timer': '⏱️',
  'timer-reset': '⏱️',
  // Mind icons
  'brain': '🧠',
  'book': '📚',
  'graduation': '🎓',
  'lightbulb': '💡',
  'palette': '🎨',
  'pen': '🖊️',
  'pencil': '✏️',
  'notebook': '📓',
  'glasses': '👓',
  // Productivity icons
  'target': '🎯',
  'zap': '⚡',
  'calendar': '📅',
  'today': '📆',
  'clock': '⏰',
  'fileText': '📄',
  'clipboard': '📋',
  'list-todo': '📝',
  'layers': '📚',
  'inbox': '📥',
  'send': '📤',
  'briefcase': '💼',
  'laptop': '💻',
  'code': '👨‍💻',
  'trendingUp': '📈',
  'barChart': '📊',
  // Lifestyle icons
  'home': '🏠',
  'sun': '☀️',
  'moon': '🌙',
  'coffee': '☕',
  'bed': '🛏️',
  'bath': '🛁',
  'car': '🚗',
  'plane': '✈️',
  'map': '🗺️',
  'compass': '🧭',
  'umbrella': '☂️',
  'shirt': '👕',
  'broom': '✨',
  // Food icons
  'apple': '🍎',
  'banana': '🍌',
  'carrot': '🥕',
  'utensils': '🍴',
  'wine': '🍷',
  'beer': '🍺',
  'pizza': '🍕',
  'salad': '🥗',
  'cookie': '🍪',
  // Social icons
  'user': '👤',
  'users': '👥',
  'phone': '📱',
  'message-circle': '💬',
  'mail': '📧',
  'video': '📹',
  'camera': '📷',
  'gift': '🎁',
  'smile': '😊',
  'handshake': '🤝',
  'music': '🎵',
  // Other icons
  'star': '⭐',
  'flag': '🚩',
  'bookmark': '🔖',
  'tag': '🏷️',
  'lock': '🔒',
  'key': '🔑',
  'bell': '🔔',
  'trash': '🗑️',
  'grip-vertical': '⋮',
};

/**
 * Category-based fallback emojis for when an icon isn't directly mapped
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  // Keywords that might appear in custom icon names
  'health': '❤️',
  'fitness': '🏋️',
  'exercise': '🏋️',
  'work': '💼',
  'study': '📚',
  'food': '🍎',
  'sleep': '🛏️',
  'water': '💧',
  'meditation': '🧘',
  'mindfulness': '🧠',
};

/**
 * Get emoji for an icon name, with intelligent fallbacks
 * 1. Direct mapping from ICON_TO_EMOJI
 * 2. Category-based fallback if icon name contains a keyword
 * 3. Default bell emoji (since this is for notifications)
 */
export const getIconEmoji = (iconName: string): string => {
  // Direct mapping
  if (ICON_TO_EMOJI[iconName as IconName]) {
    return ICON_TO_EMOJI[iconName as IconName];
  }

  // Category-based fallback
  const lowerName = iconName.toLowerCase();
  for (const [keyword, emoji] of Object.entries(CATEGORY_FALLBACKS)) {
    if (lowerName.includes(keyword)) {
      return emoji;
    }
  }

  // Default fallback - bell emoji since this is for notifications
  return '🔔';
};
