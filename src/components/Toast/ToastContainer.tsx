import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from './Toast';
import { ToastErrorBoundary } from './ToastErrorBoundary';
import { useToast } from '../../contexts/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, config, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  const offset = config.position === 'bottom' 
    ? config.offset + insets.bottom
    : config.offset + insets.top;

  return (
    <ToastErrorBoundary>
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            toast={toast}
            position={config.position}
            offset={offset}
            index={index}
            onDismiss={hideToast}
            animationDuration={config.animationDuration}
            swipeToDismiss={config.swipeToDismiss}
          />
        ))}
      </View>
    </ToastErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: Platform.OS === 'android' ? 9999 : 0,
  },
});

export default ToastContainer;