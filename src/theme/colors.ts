export const colors = {
  // US Graphics inspired eggshell background
  background: '#F9F7F4',
  surface: '#FFFFFF',
  
  // Warm accent colors
  accent: {
    warm: '#F8EAC7',  // Warm cream accent color
    light: '#FDF8F0', // Very light warm tint for backgrounds
  },
  
  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // GitHub-style contribution colors
  contribution: {
    empty: '#EBEDF0',
    level1: '#C6E48B',
    level2: '#7BC96F',
    level3: '#239A3B',
    level4: '#196127',
  },
  
  // Task color palette
  palette: [
    '#22c55e', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
    '#14b8a6', // teal
    '#a855f7', // purple
  ],
  
  // UI states
  primary: '#22c55e',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Borders and dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Interactive states
  interactive: {
    default: '#F3F4F6',
    hover: '#E5E7EB',
    pressed: '#D1D5DB',
    disabled: '#F9FAFB',
    warm: '#F8EAC7', // Warm interactive state for special elements
  },
  
  // Shadows
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    strong: 'rgba(0, 0, 0, 0.15)',
  },
  
  // Modal overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const getContributionColor = (count: number, maxCount: number): string => {
  if (count === 0) return colors.contribution.empty;
  
  const ratio = count / Math.max(maxCount, 1);
  
  if (ratio <= 0.25) return colors.contribution.level1;
  if (ratio <= 0.5) return colors.contribution.level2;
  if (ratio <= 0.75) return colors.contribution.level3;
  return colors.contribution.level4;
};

export const getTaskColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba with opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default colors;