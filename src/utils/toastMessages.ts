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

// Helper function to get a random message from a category
export const getRandomMessage = (category: keyof MessageCategory): string => {
  const messages = toastMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to determine message category based on streak
export const getStreakMessage = (currentStreak: number, previousStreak: number): string => {
  // Streak broken
  if (currentStreak === 1 && previousStreak > 1) {
    return getRandomMessage('streakBroken');
  }

  // First completion
  if (currentStreak === 1 && previousStreak === 0) {
    return getRandomMessage('firstCompletion');
  }

  // Major milestones
  if (currentStreak >= 100 && currentStreak % 100 === 0) {
    return getRandomMessage('majorMilestone');
  }

  // Month milestones
  if ([30, 60, 90].includes(currentStreak)) {
    return getRandomMessage('monthMilestone');
  }

  // Week milestones
  if ([7, 14, 21, 28].includes(currentStreak)) {
    return getRandomMessage('weekMilestone');
  }

  // Regular continuation
  return getRandomMessage('streakContinuation');
};

// Helper to determine if a streak is a milestone
export const isStreakMilestone = (streak: number): boolean => {
  return [7, 14, 21, 28, 30, 60, 90, 100, 365].includes(streak) || 
         (streak > 100 && streak % 100 === 0);
};

// Helper to get celebration level based on achievement
export const getCelebrationLevel = (streak: number): 'small' | 'medium' | 'large' => {
  if (streak >= 100) return 'large';
  if (streak >= 30) return 'medium';
  if (streak >= 7) return 'small';
  return 'small';
};

export default toastMessages;