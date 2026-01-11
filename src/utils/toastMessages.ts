export interface MessageCategory {
  streakContinuation: string[];
  weekMilestone: string[];
  monthMilestone: string[];
  majorMilestone: string[];
  streakBroken: string[];
  firstCompletion: string[];
  perfectDay: string[];
  perfectWeek: string[];
}

export const toastMessages: MessageCategory = {
  // 1-6 days streak continuation
  streakContinuation: [
    "Keep it up! 🔥",
    "You're on fire!",
    "Nice streak going!",
    "Way to go!",
    "LFG! 🚀",
    "Crushing it!",
    "Another one! 💪",
    "You're unstoppable!",
    "Keep the momentum!",
    "Building that habit!",
    "Consistency is key!",
    "You got this!",
    "Streak mode: ON",
    "Making it happen!",
    "That's the spirit!",
  ],

  // 7, 14, 21 day milestones
  weekMilestone: [
    "One week strong! 💪",
    "7 days of awesome!",
    "Week milestone unlocked! 🏆",
    "A whole week! Incredible!",
    "Weekly warrior! ⚔️",
    "7 day champion!",
    "Week complete! 🎯",
    "Magnificent seven!",
    "Week streak achieved!",
    "7 days and counting!",
  ],

  // 30, 60, 90 day milestones
  monthMilestone: [
    "Month milestone! 🏆",
    "30 days of dedication!",
    "Monthly master! 👑",
    "Habit hero status!",
    "A whole month! WOW!",
    "30 day legend!",
    "Monthly champion! 🥇",
    "Incredible consistency!",
    "Month streak unlocked!",
    "30 days stronger!",
  ],

  // 100+ day milestones
  majorMilestone: [
    "LEGENDARY STREAK! 🏆",
    "100 DAYS! INCREDIBLE! 💯",
    "Habit master achieved! 👑",
    "You're absolutely crushing it!",
    "Century club member! 🎉",
    "100 days of pure dedication!",
    "Unstoppable force! 🚀",
    "Elite status unlocked!",
    "True champion! 🏅",
    "Absolutely phenomenal!",
  ],

  // Streak broken
  streakBroken: [
    "No worries, start fresh!",
    "Every day is a new beginning",
    "You'll bounce back stronger!",
    "Progress, not perfection",
    "The journey continues!",
    "Fresh start, fresh energy!",
    "You've got this!",
    "Back on track!",
    "Ready for a new streak!",
    "Let's go again!",
  ],

  // First completion of a task
  firstCompletion: [
    "Great start! 🌟",
    "First step done!",
    "Journey begins!",
    "You've started something great!",
    "And so it begins! ✨",
    "Off to a great start!",
    "First of many!",
    "Welcome to your journey!",
    "The first step is always the hardest!",
    "You did it! 🎉",
  ],

  // Perfect day (completed all tasks)
  perfectDay: [
    "Perfect day! 🌟",
    "All tasks crushed!",
    "100% completion! 💯",
    "Flawless victory!",
    "Day = Dominated!",
    "Full sweep! 🎯",
    "Nothing can stop you!",
    "All green! ✅",
    "Perfect score!",
    "Outstanding day!",
  ],

  // Perfect week
  perfectWeek: [
    "PERFECT WEEK! 🏆",
    "7 days of perfection!",
    "Week = DOMINATED!",
    "Flawless week achieved!",
    "Weekly perfection! 💎",
    "Unstoppable for 7 days!",
    "Champion of the week!",
    "Perfect week unlocked!",
    "7/7 days crushed!",
    "Legendary week!",
  ],
};

// Helper function to get a random message from a category with optional streak number
export const getRandomMessage = (category: keyof MessageCategory, streakNumber?: number): string => {
  const messages = toastMessages[category];
  const baseMessage = messages[Math.floor(Math.random() * messages.length)];
  
  // Add streak number to the message if provided and it makes sense
  if (streakNumber !== undefined && streakNumber > 0) {
    // For certain categories, append the streak count
    if (category === 'streakContinuation' || category === 'weekMilestone' || 
        category === 'monthMilestone' || category === 'majorMilestone') {
      // Remove existing emoji at the end to insert streak count
      const messageWithoutEmoji = baseMessage.replace(/\s*[🔥🚀💪🏆⚔️🎯👑🥇🎉🏅💯🌟✨💎]/g, '');
      const emoji = baseMessage.match(/[🔥🚀💪🏆⚔️🎯👑🥇🎉🏅💯🌟✨💎]/)?.[0] || '';
      return `${messageWithoutEmoji} • ${streakNumber} day streak${emoji ? ' ' + emoji : ''}`;
    }
  }
  
  return baseMessage;
};

// Helper function to determine message category based on streak
export const getStreakMessage = (currentStreak: number, previousStreak: number): string => {
  // Streak broken - starting fresh
  if (currentStreak === 1 && previousStreak > 1) {
    return "Back on track! Let's rebuild! • Day 1";
  }

  // First completion ever
  if (currentStreak === 1 && previousStreak === 0) {
    return "Let's go! Starting fresh! • Day 1 🚀";
  }

  // Major milestones (100, 200, 300, etc.)
  if (currentStreak >= 100 && currentStreak % 100 === 0) {
    return `LEGENDARY! • ${currentStreak} day streak! 🏆`;
  }

  // 365 day milestone
  if (currentStreak === 365) {
    return `ONE FULL YEAR! • ${currentStreak} day streak! 🎊`;
  }

  // Month milestones (30, 60, 90)
  if (currentStreak === 30) {
    return `One month strong! • ${currentStreak} day streak! 🏆`;
  }
  if (currentStreak === 60) {
    return `Two months! Incredible! • ${currentStreak} day streak! 💪`;
  }
  if (currentStreak === 90) {
    return `Three months! Unstoppable! • ${currentStreak} day streak! 🌟`;
  }

  // Week milestones
  if (currentStreak === 7) {
    return `One week down! • ${currentStreak} day streak! 🔥`;
  }
  if (currentStreak === 14) {
    return `Two weeks strong! • ${currentStreak} day streak! 💪`;
  }
  if (currentStreak === 21) {
    return `Three weeks! Habit formed! • ${currentStreak} day streak! 🎯`;
  }
  if (currentStreak === 28) {
    return `Four weeks! Nearly a month! • ${currentStreak} day streak! 🏆`;
  }

  // Special streak counts with custom messages
  if (currentStreak === 2) {
    return `Back for more! • ${currentStreak} day streak! 🔥`;
  }
  if (currentStreak === 3) {
    return `Three's a pattern! • ${currentStreak} day streak! 🚀`;
  }
  if (currentStreak === 4) {
    return `Building momentum! • ${currentStreak} day streak! 💪`;
  }
  if (currentStreak === 5) {
    return `High five! • ${currentStreak} day streak! ✋`;
  }
  if (currentStreak === 6) {
    return `Almost a week! • ${currentStreak} day streak! 🔥`;
  }
  if (currentStreak === 50) {
    return `Halfway to 100! • ${currentStreak} day streak! 🌟`;
  }
  if (currentStreak === 75) {
    return `Three quarters to 100! • ${currentStreak} day streak! 🎯`;
  }

  // Regular continuation with streak count
  const regularMessages = [
    `Keep it up! • ${currentStreak} day streak! 🔥`,
    `You're on fire! • ${currentStreak} day streak!`,
    `Nice streak! • Day ${currentStreak}! 💪`,
    `Crushing it! • ${currentStreak} days strong! 🚀`,
    `LFG! • Day ${currentStreak}! 🔥`,
    `Consistency pays off! • ${currentStreak} day streak!`,
    `Another one! • Day ${currentStreak}! 💪`,
    `Unstoppable! • ${currentStreak} days and counting!`,
    `Keep the momentum! • Day ${currentStreak}! 🔥`,
    `Making it happen! • ${currentStreak} day streak!`,
  ];
  
  return regularMessages[Math.floor(Math.random() * regularMessages.length)];
};

// Helper to determine if a streak is a milestone
export const isStreakMilestone = (streak: number): boolean => {
  return [7, 14, 21, 28, 30, 60, 90, 100, 365].includes(streak) || 
         (streak > 100 && streak % 100 === 0);
};

// Helper to get celebration level based on achievement
export const getCelebrationLevel = (streak: number): 'small' | 'medium' | 'large' | 'epic' => {
  // Epic celebrations for truly special milestones
  if (streak === 365) return 'epic';  // One full year
  if (streak >= 200 && streak % 100 === 0) return 'epic';  // 200, 300, 400, etc.
  
  // Large celebrations for major milestones
  if (streak === 100) return 'large';  // First 100
  if (streak === 90) return 'large';   // Three months
  if (streak === 75) return 'medium';  // Three quarters to 100
  
  // Medium celebrations for monthly milestones
  if (streak === 60) return 'medium';  // Two months
  if (streak === 50) return 'medium';  // Halfway to 100
  if (streak === 30) return 'medium';  // One month
  
  // Small celebrations for weekly milestones
  if (streak === 28) return 'small';   // Four weeks
  if (streak === 21) return 'small';   // Three weeks
  if (streak === 14) return 'small';   // Two weeks
  if (streak === 7) return 'small';    // One week
  
  return 'small';
};

// Helper to get confetti type based on streak
export const getConfettiType = (streak: number): false | 'burst' | 'fireworks' | 'rain' => {
  const level = getCelebrationLevel(streak);
  
  // No confetti for non-milestones
  if (!isStreakMilestone(streak)) return false;
  
  switch (level) {
    case 'epic':
      return 'rain';      // Most spectacular - confetti rain
    case 'large':
      return 'fireworks'; // Fireworks for major achievements
    case 'medium':
      return 'burst';     // Burst for monthly milestones
    case 'small':
      return 'burst';     // Small burst for weekly milestones
    default:
      return false;
  }
};

// Helper to determine if we should show a streak toast
export const shouldShowStreakToast = (
  currentStreak: number, 
  previousStreak: number,
  completionCount: number
): boolean => {
  // Don't show toast for multiple completions on the same day
  // (only show for the first completion)
  if (completionCount > 1) {
    return false;
  }

  // Don't show toast if streak didn't actually increase
  // (this handles backfilling - if current streak is same as before, we're backfilling)
  if (currentStreak === previousStreak) {
    return false;
  }

  // Show toast for any streak continuation or start
  // This includes:
  // - Starting a new streak (1 from 0)
  // - Continuing a streak (any increase)
  // - Recovering from broken streak (1 from higher number)
  return true;
};

export default toastMessages;