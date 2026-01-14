/**
 * TemplateCatalogModal Component
 *
 * Full-screen modal for browsing and selecting habit templates.
 * Uses a single modal with view switching instead of nested modals.
 */

import React, { useState, useCallback } from 'react';
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
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Icon } from '../common/Icon';
import { BaseModal } from '../modals/BaseModal';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { TemplateCatalogModalProps, HabitTemplate } from '../../types/templates';
import { CATEGORIES } from '../../data/habitTemplates';
import { useTemplateSearch } from '../../hooks/useTemplateSearch';
import { TemplateCard } from './TemplateCard';
import { CategoryTabs } from './CategoryTabs';
import { TemplatePreview } from './TemplatePreview';

export const TemplateCatalogModal: React.FC<TemplateCatalogModalProps> = ({
  visible,
  onClose,
  onSelectTemplate,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    clearFilters,
    hasActiveFilters,
  } = useTemplateSearch();

  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplatePress = useCallback((template: HabitTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  }, []);

  const handleCustomize = useCallback(() => {
    if (selectedTemplate) {
      const template = selectedTemplate;
      // Reset state before calling callback
      setShowPreview(false);
      setSelectedTemplate(null);
      clearFilters();
      onSelectTemplate(template);
    }
  }, [selectedTemplate, onSelectTemplate, clearFilters]);

  const handleQuickAdd = useCallback(() => {
    if (selectedTemplate) {
      const template = selectedTemplate;
      // Reset state before calling callback
      setShowPreview(false);
      setSelectedTemplate(null);
      clearFilters();
      onSelectTemplate(template);
    }
  }, [selectedTemplate, onSelectTemplate, clearFilters]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setSelectedTemplate(null);
  }, []);

  const handleClose = useCallback(() => {
    clearFilters();
    setSelectedTemplate(null);
    setShowPreview(false);
    onClose();
  }, [clearFilters, onClose]);

  const renderTemplate = useCallback(
    ({ item }: { item: HabitTemplate }) => (
      <TemplateCard
        template={item}
        onPress={handleTemplatePress}
        isSelected={selectedTemplate?.id === item.id}
      />
    ),
    [handleTemplatePress, selectedTemplate]
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
      height="95%"
      closeOnBackdropPress={!showPreview}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={showPreview ? handleClosePreview : handleClose}
              style={styles.headerButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={showPreview ? "Back to templates" : "Close template catalog"}
            >
              <Icon
                name={showPreview ? "chevron-left" : "x"}
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {showPreview ? 'Template Preview' : 'Choose a Template'}
            </Text>
            <View style={styles.headerButton} />
          </View>

          {/* Main Content - Catalog or Preview */}
          {!showPreview ? (
            <Animated.View
              style={styles.catalogContent}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
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
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
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
                data={filteredTemplates}
                renderItem={renderTemplate}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                keyboardShouldPersistTaps="handled"
              />
            </Animated.View>
          ) : (
            /* Preview View - shown in place of catalog */
            selectedTemplate && (
              <Animated.View
                style={styles.previewContent}
                entering={SlideInRight.duration(250)}
                exiting={SlideOutRight.duration(200)}
              >
                <TemplatePreview
                  template={selectedTemplate}
                  onCustomize={handleCustomize}
                  onQuickAdd={handleQuickAdd}
                  onClose={handleClosePreview}
                  embedded={true}
                />
              </Animated.View>
            )
          )}
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
  catalogContent: {
    flex: 1,
  },
  previewContent: {
    flex: 1,
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
