import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { Button } from '../../src/components/ui/Button';
import { AppBackground } from '../../src/components/layout/AppBackground';

const FEATURES = [
  { icon: 'checkbox-outline' as const, t: 'Tasks & planning' },
  { icon: 'calendar-outline' as const, t: 'Calendar & events' },
  { icon: 'wallet-outline' as const, t: 'Finance tracking' },
  { icon: 'flag-outline' as const, t: 'Goals & habits' },
];

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: isDark ? '#000000' : theme.bg.primary }]} edges={['top', 'left', 'right', 'bottom']}>
      <AppBackground screenName="welcome" />
      <View style={s.container}>
        <View style={s.hero}>
          <LinearGradient
            colors={isDark ? ['#38BDF8', '#1D4ED8'] : ['#0284C7', '#0369A1']}
            style={s.logoMark}
          >
            <Ionicons name="flash" size={34} color="#ffffff" />
          </LinearGradient>
          <Text style={[s.appName, { color: theme.text.primary }]}>LifeOS</Text>
          <Text style={[s.tagline, { color: isDark ? '#94A3B8' : theme.text.secondary }]}>One app. Your whole life.</Text>
        </View>

        <View style={s.features}>
          {FEATURES.map((f) => (
            <View
              key={f.t}
              style={[
                s.feature,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : theme.surface.default,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.border.subtle,
                },
              ]}
            >
              <Ionicons name={f.icon} size={22} color={theme.brand.primary} />
              <Text style={[s.featureText, { color: theme.text.primary }]}>{f.t}</Text>
            </View>
          ))}
        </View>

        <View style={s.cta}>
          <Button
            label="Get started — it's free"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            label="Explore as Guest"
            onPress={() => router.replace('/(tabs)/home')}
            variant="ghost"
            size="md"
            fullWidth
          />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.signInBtn}>
            <Text style={[s.signInText, { color: isDark ? '#94A3B8' : theme.text.secondary }]}>
              Already have an account?{' '}
              <Text style={{ color: theme.brand.primary, fontWeight: fontWeight.semibold }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between', padding: spacing[6] },
  hero: { alignItems: 'center', paddingTop: spacing[10], gap: spacing[3] },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold },
  tagline: { fontSize: fontSize.lg },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  feature: {
    width: '47%',
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1.0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },
  cta: { gap: spacing[2], paddingBottom: spacing[4] },
  signInBtn: { alignItems: 'center', paddingVertical: spacing[2] },
  signInText: { fontSize: fontSize.base },
});
