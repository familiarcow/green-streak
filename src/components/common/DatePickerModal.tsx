import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BaseModal } from '../modals/BaseModal';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues, fontSizes } from '../../theme/utils';
import { formatDisplayDate, getTodayString, formatDateString } from '../../utils/dateHelpers';
import { Icon } from './Icon';
import { useSounds } from '../../hooks/useSounds';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  onClose: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
  maximumDate = new Date(), // Default to today as max
  minimumDate,
}) => {
  const [tempDate, setTempDate] = useState<Date>(() => {
    const date = new Date(selectedDate);
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return date;
  });

  const { playButton, playCaution, playRandomTap } = useSounds();

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      // Ensure the selected date doesn't exceed the maximum date
      const maxDate = maximumDate || new Date();
      const minDate = minimumDate || new Date('1900-01-01');
      
      if (selectedDate > maxDate) {
        setTempDate(maxDate);
      } else if (selectedDate < minDate) {
        setTempDate(minDate);
      } else {
        setTempDate(selectedDate);
      }
    }
  }, [maximumDate, minimumDate]);

  const handleConfirm = useCallback(() => {
    playButton();
    const dateString = formatDateString(tempDate);
    onDateSelect(dateString);
    onClose();
  }, [tempDate, onDateSelect, onClose, playButton]);

  const handleCancel = useCallback(() => {
    playCaution();
    // Reset temp date to current selection
    const date = new Date(selectedDate);
    date.setHours(12, 0, 0, 0);
    setTempDate(date);
    onClose();
  }, [selectedDate, onClose, playCaution]);

  const handleToday = useCallback(() => {
    playRandomTap();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setTempDate(today);
    const dateString = getTodayString();
    onDateSelect(dateString);
    onClose();
  }, [onDateSelect, onClose, playRandomTap]);

  if (Platform.OS === 'android') {
    // Android uses a different modal pattern
    if (!visible) return null;
    
    return (
      <>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              const dateString = formatDateString(selectedDate);
              onDateSelect(dateString);
            }
            onClose();
          }}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      </>
    );
  }

  // iOS and web implementation with BaseModal
  return (
    <BaseModal
      isVisible={visible}
      onClose={handleCancel}
      closeOnBackdropPress={true}
      height="auto"
      minHeight={300}
      contentStyle={styles.modalContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <View style={styles.headerRightButtons}>
          {formatDateString(tempDate) !== getTodayString() && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleToday}
              activeOpacity={0.7}
            >
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleConfirm}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      <View style={styles.pickerContainer}>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          style={styles.picker}
          textColor={colors.text.primary}
          themeVariant="light"
        />
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    paddingBottom: spacing[4],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  headerButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    minWidth: 60,
  },

  cancelText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontSize: 16,
  },

  doneText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  todayText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 16,
  },


  pickerContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },

  picker: {
    width: '100%',
    height: 200,
  },
});

export default DatePickerModal;