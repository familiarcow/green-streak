import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AnimatedButton } from '../../AnimatedButton';
import { renderWithProviders } from '../../../test/utils';

describe('AnimatedButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title', () => {
    const { getByText } = renderWithProviders(
      <AnimatedButton title="Test Button" onPress={mockOnPress} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = renderWithProviders(
      <AnimatedButton title="Test Button" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders different variants correctly', () => {
    const variants = ['primary', 'secondary', 'destructive'] as const;
    
    variants.forEach(variant => {
      const { getByText } = renderWithProviders(
        <AnimatedButton 
          title={`${variant} Button`} 
          onPress={mockOnPress}
          variant={variant}
        />
      );
      
      expect(getByText(`${variant} Button`)).toBeTruthy();
    });
  });

  it('renders different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { getByText } = renderWithProviders(
        <AnimatedButton 
          title={`${size} Button`} 
          onPress={mockOnPress}
          size={size}
        />
      );
      
      expect(getByText(`${size} Button`)).toBeTruthy();
    });
  });

  it('handles disabled state', () => {
    const { getByText } = renderWithProviders(
      <AnimatedButton 
        title="Disabled Button" 
        onPress={mockOnPress}
        disabled={true}
      />
    );

    const button = getByText('Disabled Button');
    fireEvent.press(button);
    
    // Should not call onPress when disabled
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies accessibility props correctly', () => {
    const { getByRole } = renderWithProviders(
      <AnimatedButton 
        title="Accessible Button" 
        onPress={mockOnPress}
        accessibilityLabel="Custom accessibility label"
      />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Custom accessibility label');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    
    const { getByText } = renderWithProviders(
      <AnimatedButton 
        title="Custom Style Button" 
        onPress={mockOnPress}
        style={customStyle}
      />
    );

    expect(getByText('Custom Style Button')).toBeTruthy();
  });

  // Note: Loading state not implemented yet
  // it('renders loading state when provided', () => {
  //   const { queryByText } = renderWithProviders(
  //     <AnimatedButton 
  //       title="Loading Button" 
  //       onPress={mockOnPress}
  //       loading={true}
  //     />
  //   );

  //   // Title should not be visible when loading
  //   expect(queryByText('Loading Button')).toBeNull();
  // });
});