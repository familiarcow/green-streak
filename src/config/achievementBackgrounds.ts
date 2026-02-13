/**
 * Achievement Grid Background Configuration
 *
 * Monet paintings used as backgrounds for the achievement grid.
 * One is randomly selected per user and persisted.
 */

export interface AchievementBackground {
  id: string;
  name: string;
  artist: string;
  year: string;
  source: ReturnType<typeof require>;
}

/**
 * Available Monet paintings for the achievement grid background.
 * Add images to assets/grid-backgrounds/ with these exact filenames.
 */
export const ACHIEVEMENT_BACKGROUNDS: AchievementBackground[] = [
  {
    id: 'monet_water_lilies',
    name: 'Water Lilies',
    artist: 'Claude Monet',
    year: '1906',
    source: require('../../assets/grid-backgrounds/monet_water_lilies.jpg'),
  },
  {
    id: 'monet_impression_sunrise',
    name: 'Impression, Sunrise',
    artist: 'Claude Monet',
    year: '1872',
    source: require('../../assets/grid-backgrounds/monet_impression_sunrise.jpg'),
  },
  {
    id: 'monet_garden_giverny',
    name: "The Artist's Garden at Giverny",
    artist: 'Claude Monet',
    year: '1900',
    source: require('../../assets/grid-backgrounds/monet_garden_giverny.jpg'),
  },
  {
    id: 'monet_poplars',
    name: 'Poplars',
    artist: 'Claude Monet',
    year: '1891',
    source: require('../../assets/grid-backgrounds/monet_poplars.jpg'),
  },
];

/**
 * Get a random background index for new users.
 */
export const getRandomBackgroundIndex = (): number => {
  return Math.floor(Math.random() * ACHIEVEMENT_BACKGROUNDS.length);
};

/**
 * Get a background by index, with fallback to first background.
 */
export const getBackgroundByIndex = (index: number): AchievementBackground => {
  const validIndex = index >= 0 && index < ACHIEVEMENT_BACKGROUNDS.length ? index : 0;
  return ACHIEVEMENT_BACKGROUNDS[validIndex];
};
