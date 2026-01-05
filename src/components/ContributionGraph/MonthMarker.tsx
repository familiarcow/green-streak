import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';
import { fontSizes } from '../../theme/utils';

interface MonthMarkerProps {
  date: string; // ISO date string
  boxSize: number;
  contributionColor: string; // The background color of the contribution box
}

// Get first letter of month name
const getMonthLetter = (dateString: string): string => {
  const date = new Date(dateString);
  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return monthNames[date.getMonth()];
};

// Convert hex color to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert RGB to HSL for better color manipulation
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Convert HSL back to hex
const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Calculate relative luminance for contrast checking
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Generate a lighter, complementary color dynamically
const getLighterColor = (color: string): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return '#f6f8fa'; // Fallback
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Increase lightness by 15-25% depending on current lightness
  const lightnessIncrease = hsl.l < 50 ? 25 : 15;
  const newLightness = Math.min(hsl.l + lightnessIncrease, 95);
  
  // Slightly reduce saturation to make it more subtle
  const newSaturation = Math.max(hsl.s - 10, 0);
  
  return hslToHex(hsl.h, newSaturation, newLightness);
};

// Dynamically determine text color based on contribution background
const getTextColor = (contributionColor: string): string => {
  const rgb = hexToRgb(contributionColor);
  
  if (!rgb) return 'rgba(255, 255, 255, 0.7)';
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // For very light backgrounds (empty gray), use darker text
  if (contributionColor === '#ebedf0') {
    return 'rgba(107, 114, 126, 0.8)'; // Subtle dark gray
  }
  
  // For green contribution colors, use white with varying opacity
  // The higher the contribution (darker green), the more opaque the white text
  if (luminance < 0.3) {
    return 'rgba(255, 255, 255, 0.9)'; // Very opaque white for dark backgrounds
  } else if (luminance < 0.5) {
    return 'rgba(255, 255, 255, 0.8)'; // Medium opaque white
  } else if (luminance < 0.7) {
    return 'rgba(255, 255, 255, 0.7)'; // Less opaque white
  } else {
    return 'rgba(107, 114, 126, 0.7)'; // Dark text for very light backgrounds
  }
};

export const MonthMarker: React.FC<MonthMarkerProps> = ({
  date,
  boxSize,
  contributionColor,
}) => {
  const monthLetter = getMonthLetter(date);
  const textColor = getTextColor(contributionColor);
  
  // Calculate font size based on box size
  const fontSize = Math.max(6, Math.min(boxSize * 0.4, 12));
  
  return (
    <View style={[
      styles.container, 
      { 
        width: boxSize, 
        height: boxSize,
      }
    ]}>
      <Text style={[styles.monthText, { fontSize, color: textColor }]}>
        {monthLetter}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3, // Match box border radius
    pointerEvents: 'none', // Allow touch events to pass through
    zIndex: 1,
  },

  monthText: {
    ...textStyles.caption,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false, // Android-specific
    textAlignVertical: 'center', // Android-specific
  },
});

export default MonthMarker;