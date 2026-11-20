import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../theme/tokens';

export function OfflineBanner() {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: '#1E293B' }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FBBF24" />
      <Text style={[styles.text, { color: '#F1F5F9' }]}>
        Offline Mode · Mutations will sync automatically when reconnected
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    zIndex: 999
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium
  }
});
