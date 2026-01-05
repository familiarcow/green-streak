import '@testing-library/jest-native/extend-expect';

// Mock React Native modules that don't work in test environment
jest.mock('react-native-reanimated', () => {
  const View = jest.fn();
  const Text = jest.fn();
  const Image = jest.fn();
  const ScrollView = jest.fn();

  return {
    default: {
      View,
      Text,
      Image,
      ScrollView,
      createAnimatedComponent: (component: any) => component,
      interpolate: jest.fn(),
      Extrapolate: { CLAMP: 'clamp' },
      call: jest.fn(),
      block: jest.fn(),
      cond: jest.fn(),
      set: jest.fn(),
      Value: jest.fn(() => ({ setValue: jest.fn() })),
      Clock: jest.fn(),
      and: jest.fn(),
      or: jest.fn(),
      defined: jest.fn(),
      not: jest.fn(),
      clockRunning: jest.fn(),
      stopClock: jest.fn(),
      startClock: jest.fn(),
      timing: jest.fn(),
      spring: jest.fn(),
      proc: jest.fn(),
      useCode: jest.fn(),
      useValue: jest.fn(() => ({ value: 0 })),
      useClock: jest.fn(),
      concat: jest.fn(),
      event: jest.fn(),
      add: jest.fn(),
      sub: jest.fn(),
      multiply: jest.fn(),
      divide: jest.fn(),
      pow: jest.fn(),
      modulo: jest.fn(),
      sqrt: jest.fn(),
      log: jest.fn(),
      sin: jest.fn(),
      cos: jest.fn(),
      tan: jest.fn(),
      acos: jest.fn(),
      asin: jest.fn(),
      atan: jest.fn(),
      exp: jest.fn(),
      round: jest.fn(),
      floor: jest.fn(),
      ceil: jest.fn(),
      lessThan: jest.fn(),
      eq: jest.fn(),
      greaterThan: jest.fn(),
      lessOrEq: jest.fn(),
      greaterOrEq: jest.fn(),
      neq: jest.fn(),
      abs: jest.fn(),
      min: jest.fn(),
      max: jest.fn(),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    useWorkletCallback: jest.fn((fn) => fn),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((delay, value) => value),
    withRepeat: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values[0]),
    cancelAnimation: jest.fn(),
    measure: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      pageX: 0,
      pageY: 0,
    })),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    FadeIn: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    FadeInUp: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    FadeOut: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    FadeOutDown: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    SlideInRight: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    SlideOutLeft: {
      duration: jest.fn().mockReturnThis(),
      delay: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
    },
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
  };
});

// Don't try to access react-native-reanimated actual code
// Just provide a complete mock

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })
  ),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('expo-file-system', () => ({
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  documentDirectory: '/mock/documents/',
  EncodingType: {
    UTF8: 'utf8',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => 
    Promise.resolve({
      canceled: true,
      assets: [],
    })
  ),
}));

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Dimensions and PixelRatio
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn((layoutSize) => layoutSize * 2),
  roundToNearestPixel: jest.fn((layoutSize) => Math.round(layoutSize * 2) / 2),
  startDetecting: jest.fn(),
}));