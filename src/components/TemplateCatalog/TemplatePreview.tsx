/**
 * TemplatePreview Component
 *
 * Shows a detailed preview of a selected template with options to customize or quick add.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { TemplatePreviewProps } from '../../types/templates';
import { getCategoryInfo } from '../../data/habitTemplates';

export const TemplatePreview: React.FC<TemplatePreviewProps> = React.memo(
  ({ template, onCustomize, onQuickAdd, onClose, embedded = false }) => {
    const categoryInfo = getCategoryInfo(template.category);
    const { suggestedSettings } = template;

    return (
      <View style={[styles.container, embedded && styles.containerEmbedded]}>
        {/* Header - only shown when not embedded */}
        {!embedded && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Icon name="x" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Template Preview</Text>
            <View style={styles.closeButton} />
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Template Icon & Name */}
          <View style={styles.templateHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${template.color}20` }]}>
              <Icon name={template.icon} size={40} color={template.color} />
            </View>
            <Text style={styles.templateName}>{template.name}</Text>
            {categoryInfo && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryInfo.color}15` }]}>
                <Icon name={categoryInfo.icon} size={12} color={categoryInfo.color} />
                <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                  {categoryInfo.name}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{template.description}</Text>
          </View>

          {/* Suggested Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Settings</Text>
            <View style={styles.settingsContainer}>
              {suggestedSettings.reminderTime && (
                <View style={styles.settingRow}>
                  <Icon name="clock" size={16} color={colors.text.secondary} />
                  <Text style={styles.settingText}>
                    Reminder at {suggestedSettings.reminderTime}
                  </Text>
                </View>
              )}
              {suggestedSettings.reminderFrequency && (
                <View style={styles.settingRow}>
                  <Icon name="calendar" size={16} color={colors.text.secondary} />
                  <Text style={styles.settingText}>
                    {suggestedSettings.reminderFrequency === 'daily' ? 'Daily' : 'Weekly'} reminder
                  </Text>
                </View>
              )}
              {suggestedSettings.streakEnabled && (
                <View style={styles.settingRow}>
                  <Icon name="zap" size={16} color={colors.text.secondary} />
                  <Text style={styles.settingText}>
                    Streak tracking enabled
                    {suggestedSettings.streakSkipWeekends && ' (weekends optional)'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags */}
          {template.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {template.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.customizeButton}
            onPress={onCustomize}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Customize this template"
          >
            <Icon name="edit" size={18} color={colors.primary} style={styles.buttonIcon} />
            <Text style={styles.customizeButtonText}>Customize</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: template.color }]}
            onPress={onQuickAdd}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add this habit with default settings"
          >
            <Icon name="plus" size={18} color={colors.text.inverse} style={styles.buttonIcon} />
            <Text style={styles.addButtonText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing[4],
    borderTopRightRadius: spacing[4],
  },
  containerEmbedded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  templateHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  templateName: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radiusValues.box,
    gap: spacing[1],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  description: {
    ...textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  settingsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  settingText: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    backgroundColor: colors.interactive.default,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radiusValues.box,
  },
  tagText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  customizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: radiusValues.box,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  customizeButtonText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.primary,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: radiusValues.box,
  },
  addButtonText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  buttonIcon: {
    marginRight: spacing[2],
  },
});

export default TemplatePreview;
