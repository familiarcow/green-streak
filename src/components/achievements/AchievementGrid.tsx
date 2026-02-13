import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { AchievementGridState, GridCell } from '../../types/achievements';
import { RARITY_COLORS } from '../../theme/achievements';
import { AchievementGridCell, CornerRadius } from './AchievementGridCell';

interface AchievementGridProps {
  gridState: AchievementGridState;
  onCellPress: (cell: GridCell) => void;
  accentColor: string;
  animatingUnlockId?: string | null;
  onUnlockAnimationComplete?: () => void;
  backgroundImage?: any;
  selectedAchievementId?: string | null;
  gridSize?: number; // Dynamic grid size (7 for version 1, 8 for version 2, etc.)
}

const DEFAULT_GRID_SIZE = 8; // Default to 8x8 grid
const GAP = 0;

/**
 * Check if a cell state is "hidden" (not showing the background)
 */
const isHiddenState = (state: string | undefined): boolean => {
  return state === 'locked' || state === 'visible';
};

/**
 * Placeholder background pattern component
 */
const PlaceholderBackground: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const blockSize = Math.max(width, height) / 4;

  return (
    <View style={[styles.placeholderBg, { width, height }]}>
      <View style={[styles.bgBlock, {
        backgroundColor: RARITY_COLORS.legendary,
        width: blockSize * 2,
        height: blockSize * 2,
        top: 0,
        left: 0,
        opacity: 0.8,
      }]} />
      <View style={[styles.bgBlock, {
        backgroundColor: RARITY_COLORS.epic,
        width: blockSize * 1.8,
        height: blockSize * 2.5,
        top: blockSize * 0.5,
        right: 0,
        opacity: 0.85,
      }]} />
      <View style={[styles.bgBlock, {
        backgroundColor: RARITY_COLORS.rare,
        width: blockSize * 2.2,
        height: blockSize * 1.5,
        bottom: blockSize,
        left: blockSize * 0.5,
        opacity: 0.75,
      }]} />
      <View style={[styles.bgBlock, {
        backgroundColor: RARITY_COLORS.uncommon,
        width: blockSize * 1.5,
        height: blockSize * 2,
        bottom: 0,
        right: blockSize * 0.3,
        opacity: 0.9,
      }]} />
      <View style={[styles.bgBlock, {
        backgroundColor: '#FF6B6B',
        width: blockSize * 1.2,
        height: blockSize * 1.2,
        top: blockSize * 1.5,
        left: blockSize * 1.5,
        opacity: 0.7,
        borderRadius: blockSize * 0.3,
      }]} />
      <View style={[styles.bgBlock, {
        backgroundColor: '#4ECDC4',
        width: blockSize * 1.8,
        height: blockSize * 1.3,
        bottom: blockSize * 0.8,
        left: 0,
        opacity: 0.65,
      }]} />
      <View style={[styles.bgOverlay, { width, height }]} />
    </View>
  );
};

/**
 * Compute corner radius for a cell based on its state and position
 *
 * For LOCKED cells:
 * - Corner is SQUARE if all 4 cells meeting at that corner are hidden
 * - Corner is SQUARE on grid edges (except the 4 grid corners which stay rounded)
 * - Corner is ROUNDED if any adjacent cell is revealed
 *
 * For VISIBLE cells (unlocked but not completed):
 * - Always fully rounded EXCEPT on grid edges
 * - Edge sides are NOT rounded (to align with grid boundary)
 * - Grid corners (the 4 corners of the entire grid) ARE rounded
 */
const computeCornerRadius = (
  cells: GridCell[][],
  row: number,
  col: number,
  gridSize: number
): CornerRadius => {
  const getCellState = (r: number, c: number): string | undefined => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      return undefined;
    }
    return cells[r]?.[c]?.state;
  };

  const currentState = getCellState(row, col);

  // Edge detection (applies to both visible and locked cells)
  const isTopEdge = row === 0;
  const isBottomEdge = row === gridSize - 1;
  const isLeftEdge = col === 0;
  const isRightEdge = col === gridSize - 1;

  // Grid corners are always rounded (the 4 extreme corners of the grid)
  const isTopLeftGridCorner = isTopEdge && isLeftEdge;
  const isTopRightGridCorner = isTopEdge && isRightEdge;
  const isBottomLeftGridCorner = isBottomEdge && isLeftEdge;
  const isBottomRightGridCorner = isBottomEdge && isRightEdge;

  // For VISIBLE cells: always rounded except on edges (but grid corners stay rounded)
  if (currentState === 'visible') {
    return {
      // Top-left: rounded unless on top or left edge (except grid corner)
      topLeft: isTopLeftGridCorner || (!isTopEdge && !isLeftEdge),
      // Top-right: rounded unless on top or right edge (except grid corner)
      topRight: isTopRightGridCorner || (!isTopEdge && !isRightEdge),
      // Bottom-left: rounded unless on bottom or left edge (except grid corner)
      bottomLeft: isBottomLeftGridCorner || (!isBottomEdge && !isLeftEdge),
      // Bottom-right: rounded unless on bottom or right edge (except grid corner)
      bottomRight: isBottomRightGridCorner || (!isBottomEdge && !isRightEdge),
    };
  }

  // For LOCKED cells: check if all neighbors at each corner are also hidden
  // AND apply edge rules (edges are square except grid corners)
  const currentHidden = isHiddenState(currentState);

  // Top-left corner: cells (row-1,col-1), (row-1,col), (row,col-1), (row,col)
  const topLeftAllHidden =
    currentHidden &&
    isHiddenState(getCellState(row - 1, col - 1)) &&
    isHiddenState(getCellState(row - 1, col)) &&
    isHiddenState(getCellState(row, col - 1));

  // Top-right corner: cells (row-1,col), (row-1,col+1), (row,col), (row,col+1)
  const topRightAllHidden =
    currentHidden &&
    isHiddenState(getCellState(row - 1, col)) &&
    isHiddenState(getCellState(row - 1, col + 1)) &&
    isHiddenState(getCellState(row, col + 1));

  // Bottom-left corner: cells (row,col-1), (row,col), (row+1,col-1), (row+1,col)
  const bottomLeftAllHidden =
    currentHidden &&
    isHiddenState(getCellState(row, col - 1)) &&
    isHiddenState(getCellState(row + 1, col - 1)) &&
    isHiddenState(getCellState(row + 1, col));

  // Bottom-right corner: cells (row,col), (row,col+1), (row+1,col), (row+1,col+1)
  const bottomRightAllHidden =
    currentHidden &&
    isHiddenState(getCellState(row, col + 1)) &&
    isHiddenState(getCellState(row + 1, col)) &&
    isHiddenState(getCellState(row + 1, col + 1));

  // For locked cells on edges: edge corners are square (except grid corners)
  // A corner should be square if:
  // 1. All 4 cells meeting there are hidden, OR
  // 2. It's on an edge (unless it's a grid corner)
  const topLeftOnEdge = isTopEdge || isLeftEdge;
  const topRightOnEdge = isTopEdge || isRightEdge;
  const bottomLeftOnEdge = isBottomEdge || isLeftEdge;
  const bottomRightOnEdge = isBottomEdge || isRightEdge;

  return {
    // Rounded only if: not all hidden AND (is grid corner OR not on edge)
    topLeft: !topLeftAllHidden && (isTopLeftGridCorner || !topLeftOnEdge),
    topRight: !topRightAllHidden && (isTopRightGridCorner || !topRightOnEdge),
    bottomLeft: !bottomLeftAllHidden && (isBottomLeftGridCorner || !bottomLeftOnEdge),
    bottomRight: !bottomRightAllHidden && (isBottomRightGridCorner || !bottomRightOnEdge),
  };
};

/**
 * The main achievement grid component
 * Kirby Air Ride style: unlocked cells are transparent "windows" revealing a background image
 */
export const AchievementGrid: React.FC<AchievementGridProps> = ({
  gridState,
  onCellPress,
  accentColor,
  animatingUnlockId,
  onUnlockAnimationComplete,
  backgroundImage,
  selectedAchievementId,
  gridSize = DEFAULT_GRID_SIZE,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const gridOpacity = useSharedValue(0);

  // Calculate cell size based on container width
  const cellSize = useMemo(() => {
    if (containerWidth === 0) return 40;
    const availableWidth = containerWidth - (GAP * (gridSize - 1));
    return Math.floor(availableWidth / gridSize);
  }, [containerWidth, gridSize]);

  // Calculate total grid dimensions (exact size of the cell grid)
  const gridHeight = useMemo(() => {
    return cellSize * gridSize + GAP * (gridSize - 1);
  }, [cellSize, gridSize]);

  const gridWidth = useMemo(() => {
    return cellSize * gridSize + GAP * (gridSize - 1);
  }, [cellSize, gridSize]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && containerWidth === 0) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

  // Fade in once measured
  useEffect(() => {
    if (containerWidth > 0 && !isReady) {
      // Small delay to ensure layout is complete
      const timeout = setTimeout(() => {
        setIsReady(true);
        gridOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [containerWidth, isReady, gridOpacity]);

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const rows = gridState.cells;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View style={[styles.gridContent, gridAnimatedStyle, { width: gridWidth, height: gridHeight }]}>
        {/* Background layer - revealed through unlocked cells */}
        <View style={styles.backgroundContainer}>
          {backgroundImage ? (
            <Image
              source={backgroundImage}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ) : (
            <PlaceholderBackground width={gridWidth} height={gridHeight} />
          )}
        </View>

        {/* Grid cells overlay on top of background */}
        <View style={styles.gridWrapper}>
          {rows.map((rowCells, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={styles.row}
            >
              {rowCells.map((cell, colIndex) => {
                const isLastInRow = colIndex === gridSize - 1;
                const isAnimatingUnlock = animatingUnlockId === cell.achievement?.id;
                const cornerRadius = computeCornerRadius(gridState.cells, rowIndex, colIndex, gridSize);
                const isSelected = selectedAchievementId != null && cell.achievement?.id === selectedAchievementId;

                return (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={{ marginRight: isLastInRow ? 0 : GAP }}
                  >
                    <AchievementGridCell
                      cell={cell}
                      size={cellSize}
                      onPress={onCellPress}
                      accentColor={accentColor}
                      cornerRadius={cornerRadius}
                      isAnimatingUnlock={isAnimatingUnlock}
                      onUnlockAnimationComplete={isAnimatingUnlock ? onUnlockAnimationComplete : undefined}
                      isSelected={isSelected}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },

  gridContent: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },

  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
  },

  placeholderBg: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },

  bgBlock: {
    position: 'absolute',
  },

  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  gridWrapper: {
    gap: GAP,
    position: 'relative',
    zIndex: 1,
  },

  row: {
    flexDirection: 'row',
  },
});

export default AchievementGrid;
