import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAchievementGrid } from '../hooks/useAchievementGrid';
import {
  AchievementGrid,
  UnlockCelebration,
  CELEBRATION_DURATION,
  CompletedAchievementsList,
  AvailableAchievementsList,
  AchievementDetailPanel,
} from '../components/achievements';
import { Icon } from '../components/common/Icon';
import { colors, textStyles, spacing } from '../theme';
import { radiusValues } from '../theme/utils';
import { RARITY_COLORS } from '../theme/achievements';
import { useSounds } from '../hooks/useSounds';
import { useAccentColor } from '../hooks/useAccentColor';
import logger from '../utils/logger';
import { GridCell, AchievementUnlockEvent } from '../types/achievements';

interface AchievementGridScreenProps {
  onClose: () => void;
}

/**
 * Kirby Air Ride-inspired achievement grid screen
 * Displays achievements in a dynamic grid (8x8 for 54 achievements) with adjacency-based visibility
 */
export const AchievementGridScreen: React.FC<AchievementGridScreenProps> = ({ onClose }) => {
  const { playRandomTap } = useSounds();
  const accentColor = useAccentColor();

  // Use the dedicated achievement grid hook
  const {
    gridState,
    config,
    loading,
    pendingUnlock,
    animatingUnlockId,
    setAnimatingUnlockId,
    dismissPendingUnlock,
    progressPercentage,
  } = useAchievementGrid();

  // Selected cell for detail view
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const detailOpacity = useSharedValue(0);
  const detailScale = useSharedValue(0.9);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<AchievementUnlockEvent | null>(null);

  // Log when animatingUnlockId changes
  useEffect(() => {
    if (animatingUnlockId && gridState) {
      // Check if there's a matching cell
      let foundCell = false;
      for (const row of gridState.cells) {
        for (const cell of row) {
          if (cell.achievement?.id === animatingUnlockId) {
            foundCell = true;
            logger.info('UI', 'Found cell for animation', {
              achievementId: animatingUnlockId,
              cellState: cell.state,
              achievementName: cell.achievement?.name,
            });
            break;
          }
        }
        if (foundCell) break;
      }
      if (!foundCell) {
        logger.warn('UI', 'No cell found for animatingUnlockId', { animatingUnlockId });
      }
    }
  }, [animatingUnlockId, gridState]);

  // Handle unlock animation complete - show celebration overlay
  const handleUnlockAnimationComplete = useCallback(() => {
    logger.info('UI', 'Unlock animation complete callback fired');
    if (animatingUnlockId && gridState && pendingUnlock) {
      // Store achievement for celebration
      setCelebrationAchievement(pendingUnlock);
      setShowCelebration(true);

      // Clear animation state
      setAnimatingUnlockId(null);
    }
  }, [animatingUnlockId, gridState, pendingUnlock, setAnimatingUnlockId]);

  // Handle celebration complete - show detail panel
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);

    if (celebrationAchievement && gridState) {
      // Find the cell for the unlocked achievement
      for (const row of gridState.cells) {
        for (const cell of row) {
          if (cell.achievement?.id === celebrationAchievement.achievement.id) {
            // Show the detail panel for the newly unlocked achievement
            setSelectedCell(cell);
            detailOpacity.value = withTiming(1, { duration: 200 });
            detailScale.value = withSpring(1, { damping: 20 });
            break;
          }
        }
      }
    }

    // Dismiss pending unlock
    dismissPendingUnlock();
    setCelebrationAchievement(null);
  }, [celebrationAchievement, gridState, detailOpacity, detailScale, dismissPendingUnlock]);

  // Handle close
  const handleClose = useCallback(() => {
    playRandomTap();
    onClose();
  }, [playRandomTap, onClose]);

  // Handle cell press
  const handleCellPress = useCallback((cell: GridCell) => {
    playRandomTap();
    setSelectedCell(cell);
    detailOpacity.value = withTiming(1, { duration: 200 });
    detailScale.value = withSpring(1, { damping: 20 });
  }, [playRandomTap, detailOpacity, detailScale]);

  // Handle close detail
  const handleCloseDetail = useCallback(() => {
    playRandomTap();
    detailOpacity.value = withTiming(0, { duration: 150 });
    detailScale.value = withTiming(0.9, { duration: 150 });
    setTimeout(() => setSelectedCell(null), 150);
  }, [playRandomTap, detailOpacity, detailScale]);

  // Detail panel animation
  const detailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailOpacity.value,
    transform: [{ scale: detailScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.headerRight}>
          <Text style={styles.statsText}>
            {gridState?.unlockedCount || 0}/{gridState?.totalCount || 0}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="x" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        // Grid content
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 100% Completion Banner */}
          {gridState?.isComplete && (
            <View style={styles.completionBanner}>
              <Text style={styles.completionIcon}>👑</Text>
              <View style={styles.completionTextContainer}>
                <Text style={styles.completionTitle}>Completionist!</Text>
                <Text style={styles.completionSubtitle}>
                  All {gridState.totalCount} achievements unlocked
                </Text>
              </View>
            </View>
          )}

          {/* Progress Bar - inline with percentage */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, gridState?.isComplete && styles.progressBarComplete]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                  progressPercentage === 100 && styles.progressComplete,
                ]}
              />
            </View>
            <Text style={[styles.progressText, gridState?.isComplete && styles.progressTextComplete]}>
              {progressPercentage}%
            </Text>
          </View>

          {/* Achievement Grid */}
          <View style={styles.gridContainer}>
            <AchievementGrid
              gridState={gridState!}
              onCellPress={handleCellPress}
              accentColor={accentColor}
              animatingUnlockId={animatingUnlockId}
              onUnlockAnimationComplete={handleUnlockAnimationComplete}
              selectedAchievementId={selectedCell?.achievement?.id}
              gridSize={config.size}
            />
          </View>

          {/* Selected Achievement Detail - inline section */}
          {selectedCell && selectedCell.achievement && (
            <Animated.View style={[styles.detailSection, detailAnimatedStyle]}>
              <AchievementDetailPanel
                cell={selectedCell}
                onClose={handleCloseDetail}
              />
            </Animated.View>
          )}

          {/* Completed Achievements Dropdown */}
          <CompletedAchievementsList gridState={gridState!} />

          {/* Available Achievements Dropdown (visible but not unlocked) */}
          <AvailableAchievementsList gridState={gridState!} />
        </ScrollView>
      )}

      {/* Celebration overlay - appears after glass break animation */}
      <UnlockCelebration
        visible={showCelebration}
        achievement={celebrationAchievement?.achievement || null}
        cellPosition={null}
        onComplete={handleCelebrationComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Needed for absolute children to position correctly
    position: 'relative',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statsText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },

  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },

  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.interactive.default,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  progressComplete: {
    backgroundColor: RARITY_COLORS.legendary,
  },

  progressText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    minWidth: 36,
  },

  progressBarComplete: {
    borderWidth: 1,
    borderColor: RARITY_COLORS.legendary,
    shadowColor: RARITY_COLORS.legendary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },

  progressTextComplete: {
    color: RARITY_COLORS.legendary,
    fontWeight: '600',
  },

  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${RARITY_COLORS.legendary}15`,
    borderWidth: 1,
    borderColor: RARITY_COLORS.legendary,
    borderRadius: radiusValues.xl,
    padding: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    shadowColor: RARITY_COLORS.legendary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  completionIcon: {
    fontSize: 32,
    marginRight: spacing[3],
  },

  completionTextContainer: {
    flex: 1,
  },

  completionTitle: {
    ...textStyles.h3,
    color: RARITY_COLORS.legendary,
    marginBottom: spacing[1],
  },

  completionSubtitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },

  gridContainer: {
    marginBottom: spacing[4],
  },

  // Inline detail section above dropdowns
  detailSection: {
    marginBottom: spacing[4],
  },
});

export default AchievementGridScreen;
