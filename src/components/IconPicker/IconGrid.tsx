/**
 * IconGrid Component
 *
 * Displays a grid of icons for selection in the icon picker.
 * Uses FlatList for efficient rendering of large icon sets.
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Icon, IconName } from '../common/Icon';
import { colors, spacing, textStyles } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface IconGridProps {
  icons: IconName[];
  selectedIcon: IconName;
  onSelectIcon: (icon: IconName) => void;
}

const NUM_COLUMNS = 5;
const ICON_SIZE = 56;
const ICON_GAP = spacing[2];

export const IconGrid: React.FC<IconGridProps> = React.memo(({
  icons,
  selectedIcon,
  onSelectIcon,
}) => {
  const renderIcon = useCallback(
    ({ item, index }: { item: IconName; index: number }) => {
      const isSelected = selectedIcon === item;
      return (
        <Animated.View
          entering={FadeIn.delay(Math.min(index * 10, 200)).duration(150)}
          style={styles.iconWrapper}
        >
          <TouchableOpacity
            style={[
              styles.iconButton,
              isSelected && styles.iconButtonSelected,
            ]}
            onPress={() => onSelectIcon(item)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${item} icon`}
            accessibilityState={{ selected: isSelected }}
          >
            <Icon
              name={item}
              size={24}
              color={isSelected ? colors.primary : colors.text.primary}
            />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [selectedIcon, onSelectIcon]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Icon name="search" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No icons found</Text>
        <Text style={styles.emptyText}>
          Try a different search term
        </Text>
      </View>
    ),
    []
  );

  return (
    <FlatList
      data={icons}
      renderItem={renderIcon}
      keyExtractor={(item) => item}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.gridContent}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={renderEmptyState}
    />
  );
});

const styles = StyleSheet.create({
  gridContent: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[4],
  },
  row: {
    justifyContent: 'center',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    margin: ICON_GAP / 2,
  },
  iconButton: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  iconButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent.light,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    width: '100%',
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default IconGrid;
