import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing } from '../theme';
import { radiusValues } from '../theme/utils';

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale';
  backdropOpacity?: number;
  closeOnBackdropPress?: boolean;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  backdropOpacity = 0.5,
  closeOnBackdropPress = true,
}) => {
  console.log('🎭 AnimatedModal render - visible prop:', visible);
  const backdropOpacityValue = useSharedValue(0);
  const slideValue = useSharedValue(visible ? 0 : screenHeight);
  const scaleValue = useSharedValue(visible ? 1 : 0.8);
  const fadeValue = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    console.log('🎭 Animation useEffect - visible:', visible);
    if (visible) {
      console.log('🟢 Starting OPEN animation');
      backdropOpacityValue.value = withTiming(backdropOpacity, { duration: 300 });
      
      switch (animationType) {
        case 'slide':
          console.log('🟢 Sliding to position 0');
          slideValue.value = withSpring(0, {
            damping: 20,
            stiffness: 200,
          });
          break;
        case 'scale':
          scaleValue.value = withSpring(1, {
            damping: 15,
            stiffness: 200,
          });
          fadeValue.value = withTiming(1, { duration: 250 });
          break;
        case 'fade':
          fadeValue.value = withTiming(1, { duration: 300 });
          break;
      }
    } else {
      console.log('🔴 Starting CLOSE animation');
      backdropOpacityValue.value = withTiming(0, { duration: 200 });
      
      switch (animationType) {
        case 'slide':
          console.log('🔴 Sliding to position', screenHeight);
          slideValue.value = withSpring(screenHeight, {
            damping: 20,
            stiffness: 200,
          });
          break;
        case 'scale':
          scaleValue.value = withSpring(0.8, {
            damping: 15,
            stiffness: 200,
          });
          fadeValue.value = withTiming(0, { duration: 200 });
          break;
        case 'fade':
          fadeValue.value = withTiming(0, { duration: 200 });
          break;
      }
    }
  }, [visible, animationType, backdropOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }));

  const getContentStyle = () => {
    switch (animationType) {
      case 'slide':
        return useAnimatedStyle(() => {
          console.log('📈 Slide value:', slideValue.value);
          return {
            transform: [{ translateY: slideValue.value }],
          };
        });
      case 'scale':
        return useAnimatedStyle(() => ({
          opacity: fadeValue.value,
          transform: [{ scale: scaleValue.value }],
        }));
      case 'fade':
        return useAnimatedStyle(() => ({
          opacity: fadeValue.value,
        }));
      default:
        return {};
    }
  };

  const contentStyle = getContentStyle();

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  console.log('🏛️ About to render React Native Modal with visible:', visible);
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleBackdropPress} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.content,
            animationType === 'slide' && styles.slideContent,
            animationType === 'scale' && styles.scaleContent,
            animationType === 'fade' && styles.fadeContent,
            contentStyle
          ]}
        >
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
    backgroundColor: colors.overlay,
  },
  
  backdropPressable: {
    flex: 1,
  },
  
  content: {
    backgroundColor: colors.background,
    maxHeight: screenHeight * 0.9,
  },
  
  slideContent: {
    borderTopLeftRadius: radiusValues.xxl,
    borderTopRightRadius: radiusValues.xxl,
  },
  
  scaleContent: {
    borderRadius: radiusValues.xl,
    margin: spacing[5],
    maxHeight: screenHeight * 0.8,
  },
  
  fadeContent: {
    borderRadius: radiusValues.xl,
    margin: spacing[5],
    maxHeight: screenHeight * 0.8,
  },
});

export default AnimatedModal;