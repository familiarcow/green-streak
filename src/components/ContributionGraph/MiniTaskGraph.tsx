import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ContributionData, Task } from '../../types';
import { getTaskColorWithOpacity } from '../../theme/colors';
import { colors, spacing } from '../../theme';

interface MiniTaskGraphProps {
  data: ContributionData[];
  task: Task;
  maxDays?: number;
  daySize?: number;
}

export const MiniTaskGraph: React.FC<MiniTaskGraphProps> = ({
  data,
  task,
  maxDays = 30,
  daySize = 8,
}) => {
  const { recentData, maxCount } = useMemo(() => {
    // Take only the most recent days
    const recentData = data.slice(-maxDays);
    const maxCount = Math.max(...recentData.map(d => d.count), 1);
    
    return { recentData, maxCount };
  }, [data, maxDays]);

  const getIntensityColor = (count: number) => {
    if (count === 0) {
      return colors.contribution.empty;
    }
    
    const intensity = Math.min(count / maxCount, 1);
    return getTaskColorWithOpacity(task.color, 0.2 + intensity * 0.8);
  };

  if (recentData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {recentData.map((day, index) => (
        <View
          key={day.date}
          style={[
            styles.day,
            {
              width: daySize,
              height: daySize,
              backgroundColor: getIntensityColor(day.count),
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] / 2,
  },
  
  day: {
    borderRadius: 2,
  },
});

export default MiniTaskGraph;