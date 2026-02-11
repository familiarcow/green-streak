/**
 * TemplateCatalogModal Component
 *
 * Full-screen modal for browsing and selecting habit templates.
 * Tapping a template opens the Edit Habit screen pre-filled with template data.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../common/Icon';
import { BaseModal } from '../modals/BaseModal';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { TemplateCatalogModalProps, HabitTemplate } from '../../types/templates';
import { CATEGORIES } from '../../data/habitTemplates';
import { useTemplateSearch } from '../../hooks/useTemplateSearch';
import { TemplateCard } from './TemplateCard';
import { CategoryTabs } from './CategoryTabs';
import { useSounds } from '../../hooks/useSounds';

export const TemplateCatalogModal: React.FC<TemplateCatalogModalProps> = ({
  visible,
  onClose,
  onCloseComplete,
  onSelectTemplate,
  previewGoals,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    clearFilters,
    hasActiveFilters,
  } = useTemplateSearch({ previewGoals });

  const { playRandomTap } = useSounds();

  // When a template is tapped, select it and open Edit Habit
  const handleTemplatePress = useCallback((template: HabitTemplate) => {
    playRandomTap();
    clearFilters();
    onSelectTemplate(template);
  }, [playRandomTap, clearFilters, onSelectTemplate]);

  const handleClose = useCallback(() => {
    clearFilters();
    onClose();
  }, [clearFilters, onClose]);

  const renderTemplate = useCallback(
    ({ item }: { item: HabitTemplate }) => (
      <TemplateCard
        template={item}
        onPress={handleTemplatePress}
      />
    ),
    [handleTemplatePress]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Icon name="target" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No templates found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or filter criteria
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [hasActiveFilters, clearFilters]
  );

  return (
    <BaseModal
      isVisible={visible}
      onClose={handleClose}
      onCloseComplete={onCloseComplete}
      height="95%"
      closeOnBackdropPress
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close template catalog"
            >
              <Icon
                name="x"
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose a Template</Text>
            <View style={styles.headerButton} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Icon name="target" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search templates..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  playRandomTap();
                  setSearchQuery('');
                }}>
                  <Icon name="x" size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Tabs */}
          <CategoryTabs
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Results Count */}
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Template Grid */}
          <FlatList
            key="template-grid-2col"
            data={filteredTemplates}
            renderItem={renderTemplate}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.text.primary,
    marginLeft: spacing[2],
    paddingVertical: spacing[1],
  },
  resultsInfo: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  resultsText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
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
  clearButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: radiusValues.box,
  },
  clearButtonText: {
    ...textStyles.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default TemplateCatalogModal;
