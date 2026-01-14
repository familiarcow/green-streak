import { IconName } from '../components/common/Icon';

export interface IconCategory {
  id: string;
  name: string;
  icon: IconName;
  color: string;
}

export const ICON_CATEGORIES: IconCategory[] = [
  { id: 'all', name: 'All', icon: 'layers', color: '#6b7280' },
  { id: 'health', name: 'Health', icon: 'heart', color: '#ef4444' },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell', color: '#f97316' },
  { id: 'mind', name: 'Mind', icon: 'brain', color: '#8b5cf6' },
  { id: 'productivity', name: 'Productivity', icon: 'target', color: '#3b82f6' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'home', color: '#22c55e' },
  { id: 'food', name: 'Food', icon: 'apple', color: '#84cc16' },
  { id: 'social', name: 'Social', icon: 'users', color: '#ec4899' },
  { id: 'other', name: 'Other', icon: 'star', color: '#6b7280' },
];

// Maps each icon to its category for filtering
export const ICON_CATEGORY_MAP: Record<IconName, string> = {
  // UI/Navigation - excluded from picker (internal use only)
  settings: 'other',
  'chevron-right': 'other',
  'chevron-left': 'other',
  'chevron-up': 'other',
  'chevron-down': 'other',
  checkCircle: 'other',
  check: 'other',
  circle: 'other',
  plus: 'other',
  minus: 'other',
  x: 'other',
  moreHorizontal: 'other',
  loader: 'other',
  edit: 'other',
  search: 'other',
  // Health icons
  heart: 'health',
  pill: 'health',
  activity: 'health',
  droplet: 'health',
  stethoscope: 'health',
  thermometer: 'health',
  bandage: 'health',
  eye: 'health',
  ear: 'health',
  'heart-pulse': 'health',
  // Fitness icons
  dumbbell: 'fitness',
  footprints: 'fitness',
  bike: 'fitness',
  medal: 'fitness',
  trophy: 'fitness',
  timer: 'fitness',
  'timer-reset': 'fitness',
  // Mind icons
  brain: 'mind',
  book: 'mind',
  graduation: 'mind',
  lightbulb: 'mind',
  palette: 'mind',
  pen: 'mind',
  pencil: 'mind',
  notebook: 'mind',
  glasses: 'mind',
  // Productivity icons
  target: 'productivity',
  zap: 'productivity',
  calendar: 'productivity',
  today: 'productivity',
  clock: 'productivity',
  fileText: 'productivity',
  clipboard: 'productivity',
  'list-todo': 'productivity',
  layers: 'productivity',
  inbox: 'productivity',
  send: 'productivity',
  briefcase: 'productivity',
  laptop: 'productivity',
  code: 'productivity',
  trendingUp: 'productivity',
  barChart: 'productivity',
  // Lifestyle icons
  home: 'lifestyle',
  sun: 'lifestyle',
  moon: 'lifestyle',
  coffee: 'lifestyle',
  bed: 'lifestyle',
  bath: 'lifestyle',
  car: 'lifestyle',
  plane: 'lifestyle',
  map: 'lifestyle',
  compass: 'lifestyle',
  umbrella: 'lifestyle',
  shirt: 'lifestyle',
  broom: 'lifestyle',
  // Food icons
  apple: 'food',
  banana: 'food',
  carrot: 'food',
  utensils: 'food',
  wine: 'food',
  beer: 'food',
  pizza: 'food',
  salad: 'food',
  cookie: 'food',
  // Social icons
  user: 'social',
  users: 'social',
  phone: 'social',
  'message-circle': 'social',
  mail: 'social',
  video: 'social',
  camera: 'social',
  gift: 'social',
  smile: 'social',
  handshake: 'social',
  music: 'social',
  // Other icons
  star: 'other',
  flag: 'other',
  bookmark: 'other',
  tag: 'other',
  lock: 'other',
  key: 'other',
  bell: 'other',
  trash: 'other',
};

// Icons to display in the picker (excludes UI/navigation icons)
export const PICKER_ICONS: IconName[] = [
  // Health
  'heart', 'pill', 'activity', 'droplet', 'stethoscope', 'thermometer', 'bandage', 'eye', 'ear', 'heart-pulse',
  // Fitness
  'dumbbell', 'footprints', 'bike', 'medal', 'trophy', 'timer', 'timer-reset',
  // Mind
  'brain', 'book', 'graduation', 'lightbulb', 'palette', 'pen', 'pencil', 'notebook', 'glasses',
  // Productivity
  'target', 'zap', 'calendar', 'today', 'clock', 'fileText', 'clipboard', 'list-todo', 'layers', 'inbox', 'send', 'briefcase', 'laptop', 'code', 'trendingUp', 'barChart',
  // Lifestyle
  'home', 'sun', 'moon', 'coffee', 'bed', 'bath', 'car', 'plane', 'map', 'compass', 'umbrella', 'shirt', 'broom',
  // Food
  'apple', 'banana', 'carrot', 'utensils', 'wine', 'beer', 'pizza', 'salad', 'cookie',
  // Social
  'user', 'users', 'phone', 'message-circle', 'mail', 'video', 'camera', 'gift', 'smile', 'handshake', 'music',
  // Other
  'star', 'flag', 'bookmark', 'tag', 'lock', 'key', 'bell', 'checkCircle', 'trash', 'edit',
];
