import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Dimensions } from 'react-native';
import { colors, spacing } from '../../theme';
import { useSounds } from '../../hooks/useSounds';

/**
 * Base modal props interface following the proven architecture pattern
 */
export interface BaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  /** Called after close animation completes - use this to safely unmount parent */
  onCloseComplete?: () => void;
  children: React.ReactNode;
  closeOnBackdropPress?: boolean;
  animationType?: 'slide' | 'none';
  contentStyle?: any;
  height?: string;
  minHeight?: number;
}

/**
 * Base modal component that follows the EXACT proven pattern from docs:
 * - Backdrop and content must be siblings (not parent-child)
 * - No stopPropagation anywhere
 * - Proper touch event handling for ScrollView
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isVisible,
  onClose,
  onCloseComplete,
  children,
  closeOnBackdropPress = true,
  animationType = 'slide',
  contentStyle,
  height = '85%',
  minHeight = 400,
}) => {
  // Sound effects
  const { play } = useSounds();

  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  // State to track when modal should be rendered (for exit animation)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isAnimating = useRef(false);
  // Track if modal was ever visible (to detect close transition)
  const wasVisible = useRef(false);

  // Animate in when modal becomes visible
  useEffect(() => {
    if (isVisible && !isModalVisible) {
      // Show the modal first
      setIsModalVisible(true);
      isAnimating.current = true;

      // Play open sound
      play('open');

      // Reset values
      backgroundOpacity.setValue(0);
      contentTranslateY.setValue(Dimensions.get('window').height);

      // Animate in - background fades, content slides up
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    } else if (!isVisible && isModalVisible) {
      // Animate out
      animateOut();
    }
  }, [isVisible, isModalVisible, backgroundOpacity, contentTranslateY, play]);

  // Animate out function
  const animateOut = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    // Play close sound
    play('close');

    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimating.current = false;
      setIsModalVisible(false);
    });
  };

  // Event-driven: Call onCloseComplete when modal finishes closing
  // This fires after React commits the state update (isModalVisible: true -> false)
  useEffect(() => {
    if (isModalVisible) {
      wasVisible.current = true;
    } else if (wasVisible.current) {
      // Modal just closed - was visible, now isn't
      wasVisible.current = false;
      onCloseComplete?.();
    }
  }, [isModalVisible, onCloseComplete]);

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdropPress && !isAnimating.current) {
      onClose();
    }
  };

  if (!isModalVisible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isModalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (!isAnimating.current) {
          onClose();
        }
      }}
    >
      <View style={styles.container}>
        {/* Backdrop as sibling - only handles backdrop clicks, animated fade in */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backgroundOpacity,
            },
          ]}
        >
          <Pressable 
            style={styles.backdropPressable} 
            onPress={handleBackdropPress}
          />
        </Animated.View>
        
        {/* Content as sibling - receives all touch events freely, animated slide in */}
        <Animated.View
          style={[
            styles.contentContainer,
            { height, minHeight },
            contentStyle,
            {
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          {/* Swipe handle */}
          <View style={styles.handle} />
          
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdropPressable: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});