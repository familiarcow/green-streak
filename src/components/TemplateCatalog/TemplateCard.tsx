/**
 * TemplateCard Component
 *
 * Displays a single habit template in a grid layout.
 * Features a large centered icon with the template name below.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { TemplateCardProps } from '../../types/templates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing[3];
const CARD_PADDING = spacing[4];
// Calculate card width for 2-column grid with gaps
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export const TemplateCard: React.FC<TemplateCardProps> = React.memo(
  ({ template, onPress }) => {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(template)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${template.name} template`}
      >
        {/* Icon Container with colored background */}
        <View style={[styles.iconContainer, { backgroundColor: `${template.color}15` }]}>
          <Icon name={template.icon} size={32} color={template.color} />
        </View>

        {/* Template Name */}
        <Text style={styles.name} numberOfLines={2}>
          {template.name}
        </Text>

        {/* Color accent bar at bottom */}
        <View style={[styles.accentBar, { backgroundColor: template.color }]} />
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    marginBottom: CARD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  name: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: radiusValues.box,
    borderBottomRightRadius: radiusValues.box,
  },
});

export default TemplateCard;
