/**
 * IconPickerModal Component
 *
 * Full-screen modal for browsing and selecting icons.
 * Includes search functionality and category filtering.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Icon, IconName } from '../common/Icon';
import { BaseModal } from '../modals/BaseModal';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { ICON_CATEGORIES } from '../../data/iconCategories';
import { useIconSearch } from '../../hooks/useIconSearch';
import { IconCategoryTabs } from './IconCategoryTabs';
import { IconGrid } from './IconGrid';

interface IconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedIcon: IconName;
  onSelectIcon: (icon: IconName) => void;
  selectedColor?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  visible,
  onClose,
  selectedIcon,
  onSelectIcon,
  selectedColor = colors.primary,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredIcons,
    clearFilters,
  } = useIconSearch();

  const handleSelectIcon = useCallback(
    (icon: IconName) => {
      onSelectIcon(icon);
      clearFilters();
      onClose();
    },
    [onSelectIcon, clearFilters, onClose]
  );

  const handleClose = useCallback(() => {
    clearFilters();
    onClose();
  }, [clearFilters, onClose]);

  return (
    <BaseModal
      isVisible={visible}
      onClose={handleClose}
      height="90%"
      closeOnBackdropPress={true}
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
              accessibilityLabel="Close icon picker"
            >
              <Icon name="x" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Icon Preview */}
            <View style={styles.previewContainer}>
              <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
                <Icon name={selectedIcon} size={24} color={selectedColor} />
              </View>
              <Text style={styles.headerTitle}>Choose Icon</Text>
            </View>

            <View style={styles.headerButton} />
          </View>

          {/* Main Content */}
          <Animated.View
            style={styles.content}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Icon name="search" size={18} color={colors.text.tertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search icons..."
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
            <IconCategoryTabs
              categories={ICON_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Results Count */}
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Icon Grid */}
            <IconGrid
              icons={filteredIcons}
              selectedIcon={selectedIcon}
              onSelectIcon={handleSelectIcon}
            />
          </Animated.View>
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
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  content: {
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
});

export default IconPickerModal;
