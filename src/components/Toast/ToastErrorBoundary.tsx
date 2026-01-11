import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import logger from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ToastErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to error reporting service
    logger.error('TOAST_ERROR', 'Toast system crashed', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or nothing to prevent app crash
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Silent failure - toasts just won't show
      return null;
    }

    return this.props.children;
  }
}

export default ToastErrorBoundary;