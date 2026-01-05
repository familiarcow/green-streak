import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { sizes, fontSizes } from '../../theme/utils';
import { HistorySectionProps, ContributionData } from '../../types';
import { Icon } from '../common/Icon';

export const HistorySection: React.FC<HistorySectionProps> = React.memo(({
  showHistory,
  historyDays,
  contributionData,
  onToggleHistory,
  onHistoryDayPress,
  onLoadMore,
}) => {
  // Memoized render function for history day items
  const renderHistoryDay = useCallback(({ item: date }: { item: string }) => {
    const dayData = contributionData.find(d => d.date === date);
    const displayDate = new Date(date);
    const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const handleDayPress = () => onHistoryDayPress(date);
    
    return (
      <TouchableOpacity
        style={styles.historyDay}
        onPress={handleDayPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${monthDay}`}
      >
        <View style={styles.historyDayLeft}>
          <Text style={styles.historyDayName}>{dayName}</Text>
          <Text style={styles.historyDayDate}>{monthDay}</Text>
        </View>
        <View style={styles.historyDayRight}>
          {dayData && dayData.count > 0 ? (
            <>
              <View style={styles.historyCompletions}>
                {dayData.tasks.slice(0, 3).map((task, idx) => (
                  <View 
                    key={idx}
                    style={[
                      styles.historyTaskDot,
                      { backgroundColor: task.color }
                    ]}
                  />
                ))}
                {dayData.tasks.length > 3 && (
                  <Text style={styles.historyMoreText}>+{dayData.tasks.length - 3}</Text>
                )}
              </View>
              <Text style={styles.historyCount}>{dayData.count}</Text>
            </>
          ) : (
            <Text style={styles.historyEmptyText}>No activity</Text>
          )}
          <Icon name="chevron-right" size={fontSizes.small} color={colors.text.tertiary} />
        </View>
      </TouchableOpacity>
    );
  }, [contributionData, onHistoryDayPress]);

  // Memoize keyExtractor to avoid recreation
  const keyExtractor = useCallback((item: string) => item, []);

  return (
    <View style={styles.historySection}>
      <TouchableOpacity 
        style={styles.historyHeader}
        onPress={onToggleHistory}
        accessibilityRole="button"
        accessibilityLabel="Toggle history"
      >
        <Text style={styles.historySectionTitle}>History</Text>
        <Icon 
          name={showHistory ? 'chevron-up' : 'chevron-down'} 
          size={fontSizes.large} 
          color={colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {showHistory && (
        <FlatList
          data={historyDays}
          keyExtractor={keyExtractor}
          renderItem={renderHistoryDay}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={onLoadMore}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          }
          style={styles.historyList}
          scrollEnabled={false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  historySection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    backgroundColor: colors.surface,
    borderRadius: spacing[3],
    ...shadows.sm,
  },
  
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  historySectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  
  historyList: {
    maxHeight: 400,
  },
  
  historyDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  historyDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  
  historyDayName: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    width: sizes.badge.width * 1.875,
  },
  
  historyDayDate: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  
  historyDayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  
  historyCompletions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  
  historyTaskDot: {
    width: sizes.progressBar,
    height: sizes.progressBar,
    borderRadius: sizes.progressBar / 2,
  },
  
  historyMoreText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginLeft: spacing[1],
  },
  
  historyCount: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    minWidth: sizes.badge.width * 1.25,
    textAlign: 'right',
  },
  
  historyEmptyText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  
  loadMoreButton: {
    padding: spacing[4],
    alignItems: 'center',
  },
  
  loadMoreText: {
    ...textStyles.bodySmall,
    color: colors.primary,
  },
});

export default HistorySection;