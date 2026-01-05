import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { ContributionData } from '../../types';
import { ContributionDay } from './ContributionDay';
import { LiveCalendar, ViewType } from './LiveCalendar';
import { colors, textStyles, shadows, spacing } from '../../theme';
import { fontSizes, radiusValues, sizes } from '../../theme/utils';
import { getMonthName, getTodayString } from '../../utils/dateHelpers';

interface ContributionGraphProps {
  data: ContributionData[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  firstDayOfWeek?: 'sunday' | 'monday';
}

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_PADDING = spacing[4];
const DAYS_PER_WEEK = 7;

type TimePeriod = 'LIVE' | '1M' | '2M' | '4M' | '1Y';

const TIME_PERIODS: { label: string; value: TimePeriod; name: string; description: string }[] = [
  { label: 'Live', value: 'LIVE', name: 'Live View', description: 'Last 35 days' },
  { label: '1M', value: '1M', name: 'Current Month', description: 'This calendar month' },
  { label: '2M', value: '2M', name: '2 Months', description: 'Current + previous month' },
  { label: '4M', value: '4M', name: '4 Months', description: 'Last 4 calendar months' },
  { label: '1Y', value: '1Y', name: 'This Year', description: 'Current calendar year' },
];

interface MonthData {
  monthName: string;
  year: number;
  weeks: ContributionData[][];
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  onDayPress,
  selectedDate,
  firstDayOfWeek = 'sunday',
}) => {
  const [selectedDateInternal, setSelectedDateInternal] = useState<string | undefined>(selectedDate);
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(20);
  const todayString = getTodayString();
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('LIVE');
  const [viewType, setViewType] = useState<ViewType>('live');
  const [periodOffset, setPeriodOffset] = useState(0); // For navigation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousPeriod = useRef<TimePeriod>('LIVE');

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  // Always render the new LiveCalendar with view type support
  return (
    <LiveCalendar
      data={data}
      onDayPress={onDayPress}
      selectedDate={selectedDate || selectedDateInternal}
      viewType={viewType}
      onViewTypeChange={setViewType}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: spacing[3],
    position: 'relative',
  },

  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing[8],
  },
});

export default ContributionGraph;