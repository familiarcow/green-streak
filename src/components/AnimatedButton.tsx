import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TextStyle, ViewStyle, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { colors, textStyles, spacing } from '../theme';
import { Icon, IconName } from './common/Icon';
import { useAccentColor } from '../hooks';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessible?: boolean;
  accessibilityRole?: 'button' | 'link' | 'text' | 'image';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  accessible = true,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  icon,
  iconPosition = 'left',
}) => {
  const accentColor = useAccentColor();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Animate loader icon if it's the loader icon
  React.useEffect(() => {
    if (icon === 'loader') {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [icon, rotation]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    opacity.value = withTiming(0.7, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    if (disabled) return;
    
    // Haptic-like animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
      },
      medium: {
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      },
      large: {
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[6],
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colors.interactive.disabled : accentColor,
      },
      secondary: {
        backgroundColor: disabled ? colors.interactive.disabled : colors.interactive.default,
        borderWidth: 1,
        borderColor: disabled ? colors.interactive.disabled : colors.border,
      },
      destructive: {
        backgroundColor: disabled ? colors.interactive.disabled : colors.error,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = size === 'small' ? textStyles.buttonSmall : textStyles.button;

    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: disabled ? colors.text.tertiary : colors.text.inverse,
      },
      secondary: {
        color: disabled ? colors.text.tertiary : colors.text.primary,
      },
      destructive: {
        color: disabled ? colors.text.tertiary : colors.text.inverse,
      },
    };

    return {
      ...baseTextStyle,
      ...variantTextStyles[variant],
      ...textStyle,
    };
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getIconColor = () => {
    const variantIconColors: Record<string, string> = {
      primary: disabled ? colors.text.tertiary : colors.text.inverse,
      secondary: disabled ? colors.text.tertiary : colors.text.primary,
      destructive: disabled ? colors.text.tertiary : colors.text.inverse,
    };
    return variantIconColors[variant];
  };

  const renderContent = () => {
    if (!icon) {
      return <Text style={getTextStyle()}>{title}</Text>;
    }

    const iconElement = (
      <Animated.View style={icon === 'loader' ? iconAnimatedStyle : {}}>
        <Icon 
          name={icon} 
          size={getIconSize()} 
          color={getIconColor()}
        />
      </Animated.View>
    );

    const textElement = <Text style={getTextStyle()}>{title}</Text>;

    if (iconPosition === 'right') {
      return (
        <View style={styles.contentContainer}>
          {textElement}
          <View style={styles.iconSpacing} />
          {iconElement}
        </View>
      );
    } else {
      return (
        <View style={styles.contentContainer}>
          {iconElement}
          <View style={styles.iconSpacing} />
          {textElement}
        </View>
      );
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={[animatedStyle, getButtonStyle()]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      activeOpacity={1}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacing: {
    width: spacing[2],
  },
});

export default AnimatedButton;