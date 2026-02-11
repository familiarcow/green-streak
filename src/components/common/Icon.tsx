import React from 'react';
import { ViewStyle } from 'react-native';
import {
  // Existing icons
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Check,
  Dumbbell,
  BookOpen,
  Brain,
  FileText,
  Droplet,
  GraduationCap,
  Phone,
  Sparkles,
  Music,
  Activity,
  Calendar,
  CalendarDays,
  Heart,
  Pill,
  Footprints,
  Apple,
  Plus,
  Minus,
  X,
  MoreHorizontal,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  Goal,
  Zap,
  Sun,
  Moon,
  Coffee,
  Home,
  User,
  Loader,
  Edit3,
  // Health icons
  Stethoscope,
  Thermometer,
  Bandage,
  Eye,
  Ear,
  HeartPulse,
  // Fitness icons
  Bike,
  Medal,
  Trophy,
  Timer,
  TimerReset,
  // Mind icons
  Lightbulb,
  Palette,
  Pen,
  Pencil,
  Notebook,
  Glasses,
  // Productivity icons
  Clipboard,
  ListTodo,
  Layers,
  Inbox,
  Send,
  Briefcase,
  Laptop,
  Code,
  // Lifestyle icons
  Bed,
  Bath,
  Car,
  Plane,
  Map,
  Compass,
  Umbrella,
  Shirt,
  // Food icons
  Banana,
  Carrot,
  Utensils,
  Wine,
  Beer,
  Pizza,
  Salad,
  Cookie,
  // Social icons
  Users,
  MessageCircle,
  Mail,
  Video,
  Camera,
  Gift,
  Smile,
  Handshake,
  // Other icons
  Star,
  Flag,
  Bookmark,
  Tag,
  Lock,
  Key,
  Bell,
  Trash,
  Search,
  GripVertical,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  type LucideIcon
} from 'lucide-react-native';
import { colors } from '../../theme';

// Map of icon names to Lucide components for easy usage
export const ICON_MAP = {
  // UI/Navigation icons
  settings: Settings,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  checkCircle: CheckCircle2,
  check: Check,
  plus: Plus,
  minus: Minus,
  x: X,
  moreHorizontal: MoreHorizontal,
  loader: Loader,
  edit: Edit3,
  search: Search,
  // Health icons
  heart: Heart,
  pill: Pill,
  activity: Activity,
  droplet: Droplet,
  stethoscope: Stethoscope,
  thermometer: Thermometer,
  bandage: Bandage,
  eye: Eye,
  ear: Ear,
  'heart-pulse': HeartPulse,
  // Fitness icons
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  medal: Medal,
  trophy: Trophy,
  timer: Timer,
  'timer-reset': TimerReset,
  // Mind icons
  brain: Brain,
  book: BookOpen,
  graduation: GraduationCap,
  lightbulb: Lightbulb,
  palette: Palette,
  pen: Pen,
  pencil: Pencil,
  notebook: Notebook,
  glasses: Glasses,
  // Productivity icons
  target: Target,
  goal: Goal,
  zap: Zap,
  calendar: Calendar,
  today: CalendarDays,
  clock: Clock,
  fileText: FileText,
  clipboard: Clipboard,
  'list-todo': ListTodo,
  layers: Layers,
  inbox: Inbox,
  send: Send,
  briefcase: Briefcase,
  laptop: Laptop,
  code: Code,
  trendingUp: TrendingUp,
  barChart: BarChart3,
  // Lifestyle icons
  home: Home,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  bed: Bed,
  bath: Bath,
  car: Car,
  plane: Plane,
  map: Map,
  compass: Compass,
  umbrella: Umbrella,
  shirt: Shirt,
  broom: Sparkles,
  // Food icons
  apple: Apple,
  banana: Banana,
  carrot: Carrot,
  utensils: Utensils,
  wine: Wine,
  beer: Beer,
  pizza: Pizza,
  salad: Salad,
  cookie: Cookie,
  // Social icons
  user: User,
  users: Users,
  phone: Phone,
  'message-circle': MessageCircle,
  mail: Mail,
  video: Video,
  camera: Camera,
  gift: Gift,
  smile: Smile,
  handshake: Handshake,
  music: Music,
  // Other icons
  star: Star,
  flag: Flag,
  bookmark: Bookmark,
  tag: Tag,
  lock: Lock,
  key: Key,
  bell: Bell,
  trash: Trash,
  volume: Volume2,
  'volume-x': VolumeX,
  'grip-vertical': GripVertical,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = React.memo(({
  name,
  size = 24,
  color = colors.text.primary,
  style,
}) => {
  const IconComponent = ICON_MAP[name] as LucideIcon;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      style={style}
    />
  );
});

// Convenience component for common icon sizes
export const SmallIcon: React.FC<Omit<IconProps, 'size'>> = React.memo((props) => (
  <Icon {...props} size={16} />
));

export const MediumIcon: React.FC<Omit<IconProps, 'size'>> = React.memo((props) => (
  <Icon {...props} size={20} />
));

export const LargeIcon: React.FC<Omit<IconProps, 'size'>> = React.memo((props) => (
  <Icon {...props} size={24} />
));

export default Icon;