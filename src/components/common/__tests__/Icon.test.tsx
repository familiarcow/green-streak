import React from 'react';
import { Icon, SmallIcon, MediumIcon, LargeIcon, ICON_MAP } from '../Icon';
import { renderWithProviders } from '../../../test/utils';

// Mock Lucide icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const createMockIcon = (name: string) => {
    return ({ size, color, style }: any) => (
      <View 
        testID={`icon-${name}`}
        style={style}
        accessibilityRole="image"
        accessibilityLabel={name}
      >
        <Text>{`${name}-${size}-${color}`}</Text>
      </View>
    );
  };

  return {
    Settings: createMockIcon('Settings'),
    ChevronRight: createMockIcon('ChevronRight'),
    CheckCircle2: createMockIcon('CheckCircle2'),
    Dumbbell: createMockIcon('Dumbbell'),
    BookOpen: createMockIcon('BookOpen'),
    Brain: createMockIcon('Brain'),
    FileText: createMockIcon('FileText'),
    Droplet: createMockIcon('Droplet'),
    GraduationCap: createMockIcon('GraduationCap'),
    Phone: createMockIcon('Phone'),
    Sparkles: createMockIcon('Sparkles'),
    Music: createMockIcon('Music'),
    Activity: createMockIcon('Activity'),
    Calendar: createMockIcon('Calendar'),
    Heart: createMockIcon('Heart'),
    Pill: createMockIcon('Pill'),
    Footprints: createMockIcon('Footprints'),
    Apple: createMockIcon('Apple'),
    Plus: createMockIcon('Plus'),
    MoreHorizontal: createMockIcon('MoreHorizontal'),
    TrendingUp: createMockIcon('TrendingUp'),
    BarChart3: createMockIcon('BarChart3'),
    Clock: createMockIcon('Clock'),
    Target: createMockIcon('Target'),
    Zap: createMockIcon('Zap'),
    Sun: createMockIcon('Sun'),
    Moon: createMockIcon('Moon'),
    Coffee: createMockIcon('Coffee'),
    Home: createMockIcon('Home'),
    User: createMockIcon('User'),
  };
});

describe('Icon', () => {
  it('renders icon with default props', () => {
    const { getByTestId } = renderWithProviders(
      <Icon name="settings" />
    );

    const icon = getByTestId('icon-Settings');
    expect(icon).toBeTruthy();
    expect(icon).toHaveTextContent('Settings-24-#1F2937');
  });

  it('renders icon with custom size and color', () => {
    const { getByTestId } = renderWithProviders(
      <Icon name="checkCircle" size={32} color="#22c55e" />
    );

    const icon = getByTestId('icon-CheckCircle2');
    expect(icon).toBeTruthy();
    expect(icon).toHaveTextContent('CheckCircle2-32-#22c55e');
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 10 };
    
    const { getByTestId } = renderWithProviders(
      <Icon name="heart" style={customStyle} />
    );

    const icon = getByTestId('icon-Heart');
    expect(icon).toBeTruthy();
    expect(icon.props.style).toEqual(customStyle);
  });

  it('handles invalid icon name gracefully', () => {
    // Suppress console.warn for this test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    renderWithProviders(
      // @ts-expect-error Testing invalid icon name
      <Icon name="invalid-icon" />
    );

    expect(consoleSpy).toHaveBeenCalledWith('Icon "invalid-icon" not found in ICON_MAP');
    
    consoleSpy.mockRestore();
  });

  it('has accessibility properties', () => {
    const { getByTestId } = renderWithProviders(
      <Icon name="settings" />
    );

    const icon = getByTestId('icon-Settings');
    expect(icon.props.accessibilityRole).toBe('image');
    expect(icon.props.accessibilityLabel).toBe('Settings');
  });
});

describe('Icon size variants', () => {
  it('SmallIcon renders with size 16', () => {
    const { getByTestId } = renderWithProviders(
      <SmallIcon name="settings" />
    );

    const icon = getByTestId('icon-Settings');
    expect(icon).toHaveTextContent('Settings-16-#1F2937');
  });

  it('MediumIcon renders with size 20', () => {
    const { getByTestId } = renderWithProviders(
      <MediumIcon name="settings" />
    );

    const icon = getByTestId('icon-Settings');
    expect(icon).toHaveTextContent('Settings-20-#1F2937');
  });

  it('LargeIcon renders with size 24', () => {
    const { getByTestId } = renderWithProviders(
      <LargeIcon name="settings" />
    );

    const icon = getByTestId('icon-Settings');
    expect(icon).toHaveTextContent('Settings-24-#1F2937');
  });
});

describe('ICON_MAP', () => {
  it('contains all expected icons', () => {
    const expectedIcons = [
      'settings', 'chevronRight', 'checkCircle', 'dumbbell', 'book',
      'brain', 'fileText', 'droplet', 'graduation', 'phone', 'broom',
      'music', 'activity', 'calendar', 'heart', 'pill', 'footprints',
      'apple', 'plus', 'moreHorizontal', 'trendingUp', 'barChart',
      'clock', 'target', 'zap', 'sun', 'moon', 'coffee', 'home', 'user'
    ];

    expectedIcons.forEach(iconName => {
      expect(ICON_MAP).toHaveProperty(iconName);
    });
  });

  it('maps icon names to components correctly', () => {
    expect(ICON_MAP.settings).toBeDefined();
    expect(ICON_MAP.checkCircle).toBeDefined();
    expect(ICON_MAP.heart).toBeDefined();
  });
});