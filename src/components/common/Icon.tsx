import React from 'react';
import { ViewStyle } from 'react-native';
import { 
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Check,
  Circle,
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
  Zap,
  Sun,
  Moon,
  Coffee,
  Home,
  User,
  Loader,
  type LucideIcon
} from 'lucide-react-native';
import { colors } from '../../theme';

// Map of icon names to Lucide components for easy usage
export const ICON_MAP = {
  settings: Settings,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  checkCircle: CheckCircle2,
  check: Check,
  circle: Circle,
  dumbbell: Dumbbell,
  book: BookOpen,
  brain: Brain,
  fileText: FileText,
  droplet: Droplet,
  graduation: GraduationCap,
  phone: Phone,
  broom: Sparkles,
  music: Music,
  activity: Activity,
  calendar: Calendar,
  today: CalendarDays,
  heart: Heart,
  pill: Pill,
  footprints: Footprints,
  apple: Apple,
  plus: Plus,
  minus: Minus,
  x: X,
  moreHorizontal: MoreHorizontal,
  trendingUp: TrendingUp,
  barChart: BarChart3,
  clock: Clock,
  target: Target,
  zap: Zap,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  home: Home,
  user: User,
  loader: Loader,
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