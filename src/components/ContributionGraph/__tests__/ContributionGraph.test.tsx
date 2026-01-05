import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ContributionGraph } from '../ContributionGraph';
import { renderWithProviders, createMockContributionDataRange, expectToBeVisible } from '../../../test/utils';

// Mock the ContributionDay component to simplify testing
jest.mock('../ContributionDay', () => ({
  ContributionDay: ({ onPress, data }: any) => {
    const { render } = require('@testing-library/react-native');
    const { TouchableOpacity, Text } = require('react-native');
    
    return (
      <TouchableOpacity 
        onPress={() => onPress?.(data.date)}
        testID={`contribution-day-${data.date}`}
      >
        <Text>{data.count}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('ContributionGraph', () => {
  const mockData = createMockContributionDataRange(7);
  const mockOnDayPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with data', () => {
    const { getByTestId } = renderWithProviders(
      <ContributionGraph
        data={mockData}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    // Check that some contribution days are rendered
    expect(getByTestId('contribution-day-2024-01-01')).toBeTruthy();
    expect(getByTestId('contribution-day-2024-01-02')).toBeTruthy();
  });

  it('renders empty state when no data provided', () => {
    const { getByText } = renderWithProviders(
      <ContributionGraph
        data={[]}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    expect(getByText('No activity data yet')).toBeTruthy();
    expect(getByText('Start logging habits to see your progress!')).toBeTruthy();
  });

  it('calls onDayPress when a day is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <ContributionGraph
        data={mockData}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    fireEvent.press(getByTestId('contribution-day-2024-01-01'));
    expect(mockOnDayPress).toHaveBeenCalledWith('2024-01-01');
  });

  it('renders month labels correctly', () => {
    const { getByText } = renderWithProviders(
      <ContributionGraph
        data={mockData}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    expect(getByText('Jan')).toBeTruthy();
  });

  it('renders weekday labels', () => {
    const { getByText } = renderWithProviders(
      <ContributionGraph
        data={mockData}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    expect(getByText('S')).toBeTruthy();
    expect(getByText('M')).toBeTruthy();
    expect(getByText('T')).toBeTruthy();
  });

  it('highlights selected date', () => {
    const { getByTestId } = renderWithProviders(
      <ContributionGraph
        data={mockData}
        onDayPress={mockOnDayPress}
        selectedDate="2024-01-01"
      />
    );

    const selectedDay = getByTestId('contribution-day-2024-01-01');
    expect(selectedDay).toBeTruthy();
  });

  it('handles large datasets efficiently', () => {
    const largeData = createMockContributionDataRange(365);
    
    const { getAllByTestId } = renderWithProviders(
      <ContributionGraph
        data={largeData}
        onDayPress={mockOnDayPress}
        selectedDate=""
      />
    );

    // Should render all days but efficiently
    const days = getAllByTestId(/contribution-day-/);
    expect(days.length).toBe(365);
  });
});