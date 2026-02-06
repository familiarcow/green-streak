/**
 * CategoryTabs Component
 *
 * Horizontal scrolling category filter tabs for the template catalog.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { CategoryTabsProps, TemplateCategory } from '../../types/templates';
import { useSounds } from '../../hooks/useSounds';

export const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(
  ({ categories, selectedCategory, onSelectCategory }) => {
    const { playRandomType } = useSounds();

    const handleSelectCategory = (categoryId: TemplateCategory | 'all') => {
      playRandomType();
      onSelectCategory(categoryId);
    };

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* All Tab */}
          <TouchableOpacity
            style={[styles.tab, selectedCategory === 'all' && styles.tabSelected]}
            onPress={() => handleSelectCategory('all')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedCategory === 'all' }}
          >
            <Text
              style={[styles.tabText, selectedCategory === 'all' && styles.tabTextSelected]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Category Tabs */}
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.tab,
                  isSelected && styles.tabSelected,
                  isSelected && { backgroundColor: `${category.color}15`, borderColor: category.color },
                ]}
                onPress={() => handleSelectCategory(category.id)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Icon
                  name={category.icon}
                  size={14}
                  color={isSelected ? category.color : colors.text.secondary}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextSelected,
                    isSelected && { color: category.color },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: spacing[4],
    backgroundColor: colors.interactive.default,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.primary,
  },
  tabIcon: {
    marginRight: spacing[1],
  },
  tabText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default CategoryTabs;
