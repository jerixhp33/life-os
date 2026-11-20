module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }]
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'expo-secure-store': '<rootDir>/tests/__mocks__/expo-secure-store.ts',
    'expo-notifications': '<rootDir>/tests/__mocks__/expo-notifications.ts',
    'expo-sqlite': '<rootDir>/tests/__mocks__/expo-sqlite.ts',
    'expo-haptics': '<rootDir>/tests/__mocks__/expo-haptics.ts',
    'expo-constants': '<rootDir>/tests/__mocks__/expo-constants.ts',
    '@supabase/supabase-js': '<rootDir>/tests/__mocks__/supabase.ts',
    'react-native-url-polyfill/auto': '<rootDir>/tests/__mocks__/noop.ts',
    '^react-native$': '<rootDir>/tests/__mocks__/react-native.ts',
    '@react-native-async-storage/async-storage': '<rootDir>/tests/__mocks__/async-storage.ts',
  },
};
