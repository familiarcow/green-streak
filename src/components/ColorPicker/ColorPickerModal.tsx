/**
 * ColorPickerModal Component
 *
 * Full-screen modal for selecting colors with preset palette
 * and custom HSV picker.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Icon } from '../common/Icon';
import { BaseModal } from '../modals/BaseModal';
import { AnimatedButton } from '../AnimatedButton';
import { HueBar } from './HueBar';
import { SaturationValuePicker } from './SaturationValuePicker';
import { HexInput } from './HexInput';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { COLOR_PALETTE } from '../../database/schema';
import { hexToHsv, hsvToHex, isValidHex, generateContributionPalette } from '../../utils/colorUtils';
import { CalendarColorPreview } from '../CalendarColorPreview';
import { useSounds } from '../../hooks/useSounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PICKER_SIZE = Math.min(SCREEN_WIDTH - spacing[8] * 2, 280);
const HUE_BAR_WIDTH = Math.min(SCREEN_WIDTH - spacing[8] * 2, 280);

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  /** Custom preset colors to display (defaults to COLOR_PALETTE) */
  presets?: string[];
  /** Show a live gradient preview for contribution graph use */
  showGradientPreview?: boolean;
  /** Hide the saturation/value square picker (keep hue bar only) */
  hideShadeSelector?: boolean;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  selectedColor,
  onSelectColor,
  presets = COLOR_PALETTE,
  showGradientPreview = false,
  hideShadeSelector = false,
}) => {
  // Parse initial color to HSV
  const initialHsv = hexToHsv(selectedColor) || { h: 120, s: 1, v: 0.76 };

  const [hue, setHue] = useState(initialHsv.h);
  const [saturation, setSaturation] = useState(initialHsv.s);
  const [value, setValue] = useState(initialHsv.v);
  const [currentColor, setCurrentColor] = useState(selectedColor);

  const { playRandomTap } = useSounds();

  // Reset state when modal opens with new color
  useEffect(() => {
    if (visible) {
      const hsv = hexToHsv(selectedColor) || { h: 120, s: 1, v: 0.76 };
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setCurrentColor(selectedColor);
    }
  }, [visible, selectedColor]);

  // Update current color when HSV changes
  useEffect(() => {
    const newColor = hsvToHex(hue, saturation, value);
    setCurrentColor(newColor);
  }, [hue, saturation, value]);

  const handleHueChange = useCallback((newHue: number) => {
    setHue(newHue);
  }, []);

  const handleSaturationValueChange = useCallback((s: number, v: number) => {
    setSaturation(s);
    setValue(v);
  }, []);

  const handleHexChange = useCallback((hex: string) => {
    if (isValidHex(hex)) {
      const hsv = hexToHsv(hex);
      if (hsv) {
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
        setCurrentColor(hex);
      }
    }
  }, []);

  const handlePresetSelect = useCallback((color: string) => {
    playRandomTap();
    const hsv = hexToHsv(color);
    if (hsv) {
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setCurrentColor(color);
    }
  }, [playRandomTap]);

  const handleSelect = useCallback(() => {
    onSelectColor(currentColor);
    onClose();
  }, [currentColor, onSelectColor, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BaseModal
      isVisible={visible}
      onClose={handleClose}
      height={hideShadeSelector ? "65%" : "85%"}
      closeOnBackdropPress={true}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close color picker"
          >
            <Icon name="x" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Color Preview */}
          <View style={styles.previewContainer}>
            <View style={[styles.previewSwatch, { backgroundColor: currentColor }]} />
            <Text style={styles.headerTitle}>Choose Color</Text>
          </View>

          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Preset Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presets</Text>
            <View style={styles.presetGrid}>
              {presets.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetColor,
                    { backgroundColor: color },
                    currentColor.toUpperCase() === color.toUpperCase() && styles.presetColorSelected,
                  ]}
                  onPress={() => handlePresetSelect(color)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${color}`}
                />
              ))}
            </View>
          </View>

          {/* Live Gradient Preview for Calendar Colors */}
          {showGradientPreview && (
            <View style={styles.gradientPreviewSection}>
              <Text style={styles.gradientPreviewLabel}>Calendar Preview</Text>
              <View style={styles.gradientPreviewContainer}>
                <CalendarColorPreview
                  palette={generateContributionPalette(currentColor)}
                  size={36}
                />
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Custom</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Custom Color Picker */}
          <GestureHandlerRootView style={styles.pickerSection}>
            {/* Hue Bar */}
            <View style={styles.hueBarContainer}>
              <HueBar
                hue={hue}
                onHueChange={handleHueChange}
                width={HUE_BAR_WIDTH}
                height={32}
              />
            </View>

            {/* Saturation/Value Picker (hidden when hideShadeSelector) */}
            {!hideShadeSelector && (
              <View style={styles.svPickerRow}>
                <SaturationValuePicker
                  hue={hue}
                  saturation={saturation}
                  value={value}
                  onSaturationValueChange={handleSaturationValueChange}
                  size={PICKER_SIZE}
                />
              </View>
            )}

            {/* Preview Swatch with Editable Hex */}
            <View style={styles.previewRow}>
              <View style={[styles.largeSwatch, { backgroundColor: currentColor }]} />
              <HexInput
                value={currentColor}
                onValueChange={handleHexChange}
              />
            </View>
          </GestureHandlerRootView>
        </ScrollView>

        {/* Select Button */}
        <View style={styles.footer}>
          <AnimatedButton
            title="Select Color"
            onPress={handleSelect}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  previewSwatch: {
    width: 28,
    height: 28,
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  sectionTitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  presetColor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...shadows.sm,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  presetColorSelected: {
    borderColor: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    marginHorizontal: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  hueBarContainer: {
    marginBottom: spacing[5],
  },
  svPickerRow: {
    marginBottom: spacing[4],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  largeSwatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    ...shadows.md,
  },
  gradientPreviewSection: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.background,
    borderRadius: 12,
    marginTop: spacing[2],
  },
  gradientPreviewLabel: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradientPreviewContainer: {
    marginBottom: spacing[2],
  },
  gradientPreviewHint: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});

export default ColorPickerModal;
