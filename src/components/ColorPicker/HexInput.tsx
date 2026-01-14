/**
 * HexInput Component
 *
 * A text input for entering hex color codes with validation.
 */

import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { isValidHex, normalizeHex } from '../../utils/colorUtils';

interface HexInputProps {
  value: string;
  onValueChange: (hex: string) => void;
  testID?: string;
  showLabel?: boolean;
}

export const HexInput: React.FC<HexInputProps> = ({
  value,
  onValueChange,
  testID,
  showLabel = false,
}) => {
  // Store value with # prefix for display
  const [inputValue, setInputValue] = useState(value.toUpperCase());
  const [isValid, setIsValid] = useState(true);

  // Sync when external value changes
  // Note: inputValue intentionally excluded to prevent sync loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const normalizedValue = value.toUpperCase();
    if (normalizedValue !== inputValue) {
      setInputValue(normalizedValue);
      setIsValid(true);
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    // Ensure it starts with #
    let processed = text.toUpperCase();

    // If user deleted the #, add it back
    if (!processed.startsWith('#')) {
      processed = '#' + processed.replace(/#/g, '');
    }

    // Only allow # followed by hex characters
    const match = processed.match(/^#[0-9A-F]{0,6}/);
    const limited = match ? match[0] : '#';

    setInputValue(limited);

    // Validate and notify parent (only for valid 3 or 6 char hex codes)
    const hexPart = limited.slice(1);
    if (hexPart.length === 6 && isValidHex(hexPart)) {
      setIsValid(true);
      onValueChange(normalizeHex(hexPart));
    } else if (hexPart.length === 3 && isValidHex(hexPart)) {
      setIsValid(true);
      onValueChange(normalizeHex(hexPart));
    } else if (hexPart.length === 0) {
      setIsValid(true);
    }
  };

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>Hex</Text>}
      <View style={[styles.inputContainer, !isValid && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleChangeText}
          placeholder="#22C55E"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          keyboardType="default"
          testID={testID}
          selectTextOnFocus
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  label: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusValues.box,
    paddingHorizontal: spacing[3],
    height: 44,
    minWidth: 120,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 90,
  },
});

export default HexInput;
