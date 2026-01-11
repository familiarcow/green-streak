import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { Toast as ToastType } from '../../services/ToastNotificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastProps {
  toast: ToastType;
  position: 'top' | 'bottom';
  offset: number;
  index: number;
  onDismiss: (id: string) => void;
  animationDuration: number;
  swipeToDismiss: boolean;
}

const getVariantStyles = (variant: ToastType['variant']) => {
  switch (variant) {
    case 'success':
      return {
        backgroundColor: colors.success,
        iconColor: colors.text.inverse,
        textColor: colors.text.inverse,
      };
    case 'celebration':
      return {
        backgroundColor: colors.primary,
        iconColor: colors.text.inverse,
        textColor: colors.text.inverse,
      };
    case 'warning':
      return {
        backgroundColor: colors.warning,
        iconColor: colors.text.inverse,
        textColor: colors.text.inverse,
      };
    case 'error':
      return {
        backgroundColor: colors.error,
        iconColor: colors.text.inverse,
        textColor: colors.text.inverse,
      };
    case 'info':
    default:
      return {
        backgroundColor: colors.info,
        iconColor: colors.text.inverse,
        textColor: colors.text.inverse,
      };
  }
};

const ToastComponent: React.FC<ToastProps> = ({
  toast,
  position,
  offset,
  index,
  onDismiss,
  animationDuration,
  swipeToDismiss,
}) => {
  const translateY = useSharedValue(position === 'bottom' ? 100 : -100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const variantStyles = getVariantStyles(toast.variant);

  // Entry animation
  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
    opacity.value = withTiming(1, { duration: animationDuration });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 150,
    });
  }, []);

  const dismiss = () => {
    'worklet';
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    runOnJS(onDismiss)(toast.id);
  };

  // Gesture handler for swipe to dismiss
  const gesture = Gesture.Pan()
    .enabled(swipeToDismiss ?? false)
    .onBegin(() => {
      'worklet';
      // Store initial position if needed
    })
    .onUpdate((event) => {
      'worklet';
      if (swipeToDismiss) {
        translateX.value = event.translationX;
        
        // Update opacity based on swipe distance
        const swipeProgress = Math.abs(event.translationX) / (SCREEN_WIDTH * 0.3);
        opacity.value = interpolate(
          swipeProgress,
          [0, 1],
          [1, 0],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((event) => {
      'worklet';
      if (swipeToDismiss) {
        const shouldDismiss = Math.abs(event.translationX) > SCREEN_WIDTH * 0.2;
        
        if (shouldDismiss) {
          dismiss();
        } else {
          // Snap back
          translateX.value = withSpring(0);
          opacity.value = withSpring(1);
        }
      }
    });

  // Stacking animation for multiple toasts
  const stackOffset = index * 10;
  const stackScale = 1 - index * 0.05;

  const animatedStyle = useAnimatedStyle(() => {
    const adjustedTranslateY = position === 'bottom'
      ? translateY.value + stackOffset
      : translateY.value - stackOffset;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: adjustedTranslateY },
        { scale: scale.value * stackScale },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: variantStyles.backgroundColor,
            [position]: offset,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.content}>
          {toast.icon && (
            <Text style={[styles.icon, { color: variantStyles.iconColor }]}>
              {toast.icon}
            </Text>
          )}
          
          <View style={styles.textContainer}>
            <Text
              style={[styles.message, { color: variantStyles.textColor }]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          </View>

          {toast.action && (
            <TouchableOpacity
              onPress={toast.action.onPress}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionText, { color: variantStyles.textColor }]}>
                {toast.action.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    borderRadius: 12,
    ...shadows.lg,
    overflow: 'hidden',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },

  icon: {
    fontSize: 20,
    marginRight: spacing[3],
  },

  textContainer: {
    flex: 1,
  },

  message: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  actionButton: {
    marginLeft: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  actionText: {
    ...textStyles.bodySmall,
    fontWeight: '700',
  },
});

// Optimize re-renders with React.memo
// Only re-render if this specific toast or its index changes
export const Toast = React.memo(ToastComponent, (prevProps, nextProps) => {
  return (
    prevProps.toast.id === nextProps.toast.id &&
    prevProps.index === nextProps.index &&
    prevProps.position === nextProps.position &&
    prevProps.offset === nextProps.offset
  );
});

export default Toast;