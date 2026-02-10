import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAchievementsStore } from '../store/achievementsStore';
import { useAchievementGridStore } from '../store/achievementGridStore';
import { AchievementGrid, UnlockCelebration, CELEBRATION_DURATION } from '../components/achievements';
import { Icon } from '../components/common/Icon';
import { colors, textStyles, spacing } from '../theme';
import { glassStyles } from '../theme/glass';
import { radiusValues } from '../theme/utils';
import { RARITY_COLORS } from '../theme/achievements';
import { useSounds } from '../hooks/useSounds';
import { useAccentColor } from '../hooks/useAccentColor';
// Note: Sound/haptic handled by GlassBreakEffect component
import logger from '../utils/logger';
import {
  GridCell,
  UnlockedAchievement,
  AchievementProgress,
  AchievementGridState,
  AchievementDefinition,
} from '../types/achievements';

interface AchievementGridScreenProps {
  onClose: () => void;
}

/**
 * Kirby Air Ride-inspired achievement grid screen
 * Displays achievements in a 7x7 grid with adjacency-based visibility
 */
export const AchievementGridScreen: React.FC<AchievementGridScreenProps> = ({ onClose }) => {
  const { playRandomTap } = useSounds();
  const accentColor = useAccentColor();

  // Achievement state - access pendingUnlocks directly from store
  // (not through the hook which gates it with canShowModal)
  const {
    achievements,
    pendingUnlocks,
    loadAchievements,
    loadStats,
    loading,
    dismissPendingUnlock,
  } = useAchievementsStore();

  // Get the first pending unlock (FIFO queue)
  const pendingUnlock = pendingUnlocks.length > 0 ? pendingUnlocks[0] : null;

  // Grid state
  const {
    gridData,
    gridState,
    config,
    loading: gridLoading,
    initializeGrid,
    refreshGrid,
    getPositionForAchievement,
  } = useAchievementGridStore();

  // Selected cell for detail view
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const detailOpacity = useSharedValue(0);
  const detailScale = useSharedValue(0.9);

  // Unlock animation state
  const [animatingUnlockId, setAnimatingUnlockId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<typeof pendingUnlock>(null);
  const hasProcessedPendingUnlock = useRef<string | null>(null);
  const animationDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize grid and load achievements on mount
  useEffect(() => {
    initializeGrid();
    loadAchievements();
    loadStats();
  }, [initializeGrid, loadAchievements, loadStats]);

  // Handle pending unlocks - trigger animation when screen opens with pending unlock
  useEffect(() => {
    if (pendingUnlock && gridState && !animatingUnlockId && !animationDelayRef.current) {
      const achievementId = pendingUnlock.achievement.id;

      // Only process each pending unlock once
      if (hasProcessedPendingUnlock.current === achievementId) {
        return;
      }

      hasProcessedPendingUnlock.current = achievementId;
      logger.info('UI', 'Scheduling unlock animation', { achievementId, delay: 600 });

      // Wait for drawer to finish opening + user to see the grid (600ms)
      // Use ref to prevent timeout from being cleared on re-renders
      animationDelayRef.current = setTimeout(() => {
        logger.info('UI', 'Starting unlock animation for achievement', { achievementId });
        setAnimatingUnlockId(achievementId);
        animationDelayRef.current = null;
      }, 600);
    }
  }, [pendingUnlock, gridState, animatingUnlockId]);

  // Cleanup timeout on unmount only
  useEffect(() => {
    return () => {
      if (animationDelayRef.current) {
        clearTimeout(animationDelayRef.current);
        animationDelayRef.current = null;
      }
    };
  }, []);

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
  }, [animatingUnlockId, gridState, pendingUnlock]);

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

  // Build unlocked data maps from achievements
  const { unlockedIds, unlockedRecords, progressRecords } = useMemo(() => {
    const ids = new Set<string>();
    const unlocked = new Map<string, UnlockedAchievement>();
    const progress = new Map<string, AchievementProgress>();

    for (const achievement of achievements) {
      if (achievement.isUnlocked && achievement.unlocked) {
        ids.add(achievement.definition.id);
        unlocked.set(achievement.definition.id, achievement.unlocked);
      }
      if (achievement.progress) {
        progress.set(achievement.definition.id, achievement.progress);
      }
    }

    return { unlockedIds: ids, unlockedRecords: unlocked, progressRecords: progress };
  }, [achievements]);

  // Refresh grid when achievements data changes
  useEffect(() => {
    if (gridData && achievements.length > 0) {
      refreshGrid(unlockedIds, unlockedRecords, progressRecords);
    }
  }, [gridData, achievements, unlockedIds, unlockedRecords, progressRecords, refreshGrid]);

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

  // Calculate progress
  const progressPercentage = gridState
    ? Math.round((gridState.unlockedCount / gridState.totalCount) * 100)
    : 0;

  const isLoading = loading || gridLoading || !gridState;

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
      {isLoading ? (
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

/**
 * Collapsible dropdown list of achievements with full details
 */
interface AchievementListProps {
  gridState: AchievementGridState;
}

const CompletedAchievementsList: React.FC<AchievementListProps> = ({ gridState }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all unlocked cells, sorted by unlock date (most recent first)
  const completedCells = useMemo(() => {
    const unlocked: GridCell[] = [];
    for (const row of gridState.cells) {
      for (const cell of row) {
        if (cell.state === 'unlocked' && cell.achievement && cell.unlocked) {
          unlocked.push(cell);
        }
      }
    }
    // Sort by unlock date descending (most recent first)
    return unlocked.sort((a, b) => {
      const dateA = a.unlocked?.unlockedAt ? new Date(a.unlocked.unlockedAt).getTime() : 0;
      const dateB = b.unlocked?.unlockedAt ? new Date(b.unlocked.unlockedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [gridState]);

  if (completedCells.length === 0) {
    return null;
  }

  return (
    <View style={styles.dropdownSection}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTitle}>Completed ({completedCells.length})</Text>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.dropdownContent}>
          {completedCells.map((cell) => {
            const achievement = cell.achievement!;
            const rarityColor = RARITY_COLORS[achievement.rarity];
            return (
              <View
                key={achievement.id}
                style={[styles.achievementRow, { borderLeftColor: rarityColor }]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementNameRow}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.rarityBadgeText}>
                        {achievement.rarity.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.achievementDescription} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {cell.unlocked && (
                    <Text style={styles.achievementDate}>
                      Unlocked {new Date(cell.unlocked.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/**
 * Collapsible dropdown list of available achievements (visible but not yet unlocked)
 */
const AvailableAchievementsList: React.FC<AchievementListProps> = ({ gridState }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all visible (not yet unlocked) cells
  const availableCells = useMemo(() => {
    const visible: GridCell[] = [];
    for (const row of gridState.cells) {
      for (const cell of row) {
        if (cell.state === 'visible' && cell.achievement) {
          visible.push(cell);
        }
      }
    }
    // Sort by progress percentage descending (closest to completion first)
    return visible.sort((a, b) => {
      const progressA = a.progress?.percentage || 0;
      const progressB = b.progress?.percentage || 0;
      return progressB - progressA;
    });
  }, [gridState]);

  if (availableCells.length === 0) {
    return null;
  }

  return (
    <View style={styles.dropdownSection}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTitle}>Available ({availableCells.length})</Text>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.dropdownContent}>
          {availableCells.map((cell) => {
            const achievement = cell.achievement!;
            const rarityColor = RARITY_COLORS[achievement.rarity];
            const progress = cell.progress;
            return (
              <View
                key={achievement.id}
                style={[styles.achievementRow, styles.achievementRowAvailable, { borderLeftColor: `${rarityColor}60` }]}
              >
                <Text style={[styles.achievementIcon, styles.achievementIconFaded]}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementNameRow}>
                    <Text style={[styles.achievementName, styles.achievementNameFaded]}>{achievement.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}60` }]}>
                      <Text style={styles.rarityBadgeText}>
                        {achievement.rarity.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.achievementDescription, styles.achievementDescriptionFaded]} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {progress && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressBarSmall}>
                        <View
                          style={[
                            styles.progressFillSmall,
                            { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: rarityColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressTextSmall}>
                        {progress.currentValue}/{progress.targetValue}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/**
 * Detail panel for showing achievement information
 */
interface AchievementDetailPanelProps {
  cell: GridCell;
  onClose: () => void;
}

const AchievementDetailPanel: React.FC<AchievementDetailPanelProps> = ({ cell, onClose }) => {
  const { state, achievement, unlocked, progress } = cell;

  if (!achievement) {
    return null;
  }

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const isUnlocked = state === 'unlocked';
  const isVisible = state === 'visible';

  return (
    <View style={[styles.detailContent, { borderColor: rarityColor }]}>
      {/* Header row: Icon, Name, Rarity badge, Close button */}
      <View style={styles.detailHeader}>
        <View style={[styles.detailIconContainer, { backgroundColor: `${rarityColor}30` }]}>
          <Text style={styles.detailIcon}>{achievement.icon}</Text>
          {isUnlocked && (
            <View style={[styles.detailUnlockedBadge, { backgroundColor: rarityColor }]}>
              <Icon name="check" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.detailNameContainer}>
          <Text style={styles.detailName}>{achievement.name}</Text>
          <View style={[styles.detailRarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.detailRarityText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.detailCloseButton} onPress={onClose}>
          <Icon name="x" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Description - full width */}
      <Text style={styles.detailDescription}>
        {isVisible ? `Objective: ${achievement.description}` : achievement.description}
      </Text>

      {/* Footer: Progress bar OR unlock date */}
      {isVisible && progress ? (
        <View style={styles.detailProgressContainer}>
          <View style={styles.detailProgressBar}>
            <View
              style={[
                styles.detailProgressFill,
                { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: rarityColor },
              ]}
            />
          </View>
          <Text style={styles.detailProgressText}>
            {progress.currentValue}/{progress.targetValue}
          </Text>
        </View>
      ) : isUnlocked && unlocked ? (
        <Text style={styles.detailUnlockDate}>
          Unlocked {new Date(unlocked.unlockedAt).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  // Collapsible achievement dropdowns
  dropdownSection: {
    marginBottom: spacing[4],
    ...glassStyles.cardSubtle,
    borderRadius: radiusValues.lg,
    overflow: 'hidden',
  },

  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },

  dropdownTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  achievementRow: {
    flexDirection: 'row',
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderLeftWidth: 3,
  },

  achievementRowAvailable: {
    opacity: 0.85,
  },

  achievementIcon: {
    fontSize: 28,
    marginRight: spacing[3],
  },

  achievementIconFaded: {
    opacity: 0.6,
  },

  achievementInfo: {
    flex: 1,
  },

  achievementNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },

  achievementName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },

  achievementNameFaded: {
    color: colors.text.secondary,
  },

  rarityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
  },

  rarityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },

  achievementDescription: {
    ...textStyles.caption,
    color: colors.text.secondary,
    lineHeight: 16,
    marginBottom: spacing[1],
  },

  achievementDescriptionFaded: {
    color: colors.text.tertiary,
  },

  achievementDate: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: colors.interactive.default,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFillSmall: {
    height: '100%',
    borderRadius: 2,
  },

  progressTextSmall: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    minWidth: 45,
  },

  // Inline detail section above dropdowns
  detailSection: {
    marginBottom: spacing[4],
  },

  detailContent: {
    ...glassStyles.card,
    backgroundColor: colors.surface,
    borderRadius: radiusValues.xl,
    padding: spacing[4],
    borderWidth: 2,
    gap: spacing[3],
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },

  detailIcon: {
    fontSize: 24,
  },

  detailUnlockedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  detailNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },

  detailName: {
    ...textStyles.h4,
    color: colors.text.primary,
  },

  detailRarityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
  },

  detailRarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  detailDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  detailProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  detailProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.interactive.default,
    borderRadius: 3,
    overflow: 'hidden',
  },

  detailProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  detailProgressText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },

  detailUnlockDate: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  detailCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default AchievementGridScreen;
