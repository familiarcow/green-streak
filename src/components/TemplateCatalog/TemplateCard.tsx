/**
 * TemplateCard Component
 *
 * Displays a single habit template in the catalog grid.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { TemplateCardProps } from '../../types/templates';
import { getCategoryInfo } from '../../data/habitTemplates';

export const TemplateCard: React.FC<TemplateCardProps> = React.memo(
  ({ template, onPress, isSelected = false }) => {
    const categoryInfo = getCategoryInfo(template.category);

    return (
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.containerSelected,
          { borderLeftColor: template.color },
        ]}
        onPress={() => onPress(template)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${template.name} template. ${template.description}`}
        accessibilityState={{ selected: isSelected }}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${template.color}20` }]}>
          <Icon name={template.icon} size={24} color={template.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {template.description}
          </Text>

          {/* Category Badge */}
          {categoryInfo && (
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryInfo.color}15` }]}>
              <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                {categoryInfo.name}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerSelected: {
    backgroundColor: colors.accent.light,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  description: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: spacing[1],
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TemplateCard;
