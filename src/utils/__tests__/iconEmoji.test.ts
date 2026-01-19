import { getIconEmoji, ICON_TO_EMOJI } from '../iconEmoji';

describe('iconEmoji', () => {
  describe('ICON_TO_EMOJI mapping', () => {
    it('contains all expected icon categories', () => {
      // Verify key icons from each category are present
      expect(ICON_TO_EMOJI['settings']).toBe('⚙️');
      expect(ICON_TO_EMOJI['heart']).toBe('❤️');
      expect(ICON_TO_EMOJI['dumbbell']).toBe('🏋️');
      expect(ICON_TO_EMOJI['brain']).toBe('🧠');
      expect(ICON_TO_EMOJI['target']).toBe('🎯');
      expect(ICON_TO_EMOJI['home']).toBe('🏠');
      expect(ICON_TO_EMOJI['apple']).toBe('🍎');
      expect(ICON_TO_EMOJI['user']).toBe('👤');
      expect(ICON_TO_EMOJI['star']).toBe('⭐');
    });

    it('maps checkCircle to checkmark emoji', () => {
      expect(ICON_TO_EMOJI['checkCircle']).toBe('✅');
    });

    it('maps bell to bell emoji', () => {
      expect(ICON_TO_EMOJI['bell']).toBe('🔔');
    });
  });

  describe('getIconEmoji', () => {
    it('returns correct emoji for known icon names', () => {
      expect(getIconEmoji('heart')).toBe('❤️');
      expect(getIconEmoji('dumbbell')).toBe('🏋️');
      expect(getIconEmoji('book')).toBe('📚');
      expect(getIconEmoji('coffee')).toBe('☕');
      expect(getIconEmoji('sun')).toBe('☀️');
      expect(getIconEmoji('moon')).toBe('🌙');
    });

    it('returns correct emoji for kebab-case icon names', () => {
      expect(getIconEmoji('chevron-right')).toBe('▶️');
      expect(getIconEmoji('chevron-left')).toBe('◀️');
      expect(getIconEmoji('heart-pulse')).toBe('💓');
      expect(getIconEmoji('timer-reset')).toBe('⏱️');
      expect(getIconEmoji('list-todo')).toBe('📝');
      expect(getIconEmoji('message-circle')).toBe('💬');
      expect(getIconEmoji('grip-vertical')).toBe('⋮');
    });

    it('returns category-based fallback for unmapped icons with keywords', () => {
      expect(getIconEmoji('health-icon')).toBe('❤️');
      expect(getIconEmoji('fitness-tracker')).toBe('🏋️');
      expect(getIconEmoji('exercise-routine')).toBe('🏋️');
      expect(getIconEmoji('work-task')).toBe('💼');
      expect(getIconEmoji('study-session')).toBe('📚');
      expect(getIconEmoji('food-diary')).toBe('🍎');
      expect(getIconEmoji('sleep-tracker')).toBe('🛏️');
      expect(getIconEmoji('water-intake')).toBe('💧');
      expect(getIconEmoji('meditation-timer')).toBe('🧘');
      expect(getIconEmoji('mindfulness-practice')).toBe('🧠');
    });

    it('returns bell emoji as default fallback for unknown icons', () => {
      expect(getIconEmoji('unknown-icon')).toBe('🔔');
      expect(getIconEmoji('random')).toBe('🔔');
      expect(getIconEmoji('')).toBe('🔔');
      expect(getIconEmoji('xyz123')).toBe('🔔');
    });

    it('handles case-insensitive category fallbacks', () => {
      expect(getIconEmoji('HEALTH-tracker')).toBe('❤️');
      expect(getIconEmoji('FITNESS_log')).toBe('🏋️');
      expect(getIconEmoji('MyWaterApp')).toBe('💧');
    });

    it('prioritizes direct mapping over category fallback', () => {
      // 'droplet' is directly mapped, but also contains no category keywords
      expect(getIconEmoji('droplet')).toBe('💧');
      // 'heart' is directly mapped
      expect(getIconEmoji('heart')).toBe('❤️');
    });
  });
});
