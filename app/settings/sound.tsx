import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { AppBackground } from '../../src/components/layout/AppBackground';
import {
  useSoundStore,
  HapticIntensity,
  SoundProfile,
} from '../../src/stores/soundStore';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../src/theme/tokens';

const HAPTIC_OPTIONS: { id: HapticIntensity; label: string; desc: string }[] = [
  { id: 'light', label: 'Light', desc: 'Subtle, gentle tactile taps' },
  { id: 'medium', label: 'Medium', desc: 'Balanced, standard responsive feedback' },
  { id: 'heavy', label: 'Heavy', desc: 'Firm, distinct tactile feedback' },
];

const SOUND_PROFILES: { id: SoundProfile; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'mechanical', label: 'Luxury Mechanical', desc: 'Crisp mechanical switch clicks', icon: 'keypad-outline' },
  { id: 'zen', label: 'Gentle Zen', desc: 'Soft organic acoustic tone', icon: 'water-outline' },
  { id: 'cyber', label: 'Digital Cyber', desc: 'Futuristic high-frequency chimes', icon: 'flash-outline' },
  { id: 'minimal', label: 'Minimal Soft', desc: 'Quiet, understated acoustic feedback', icon: 'radio-button-on-outline' },
];

export default function SoundSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const {
    hapticsEnabled,
    hapticIntensity,
    soundEnabled,
    soundProfile,
    setHapticsEnabled,
    setHapticIntensity,
    setSoundEnabled,
    setSoundProfile,
  } = useSoundStore();

  const triggerTestHaptic = (intensity: HapticIntensity) => {
    if (intensity === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (intensity === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  return (
    <View style={s.container}>
      <AppBackground screenName="sound" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={[
              s.iconBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 36, 56, 0.75)'
                  : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark
                  ? 'rgba(168, 220, 244, 0.28)'
                  : 'rgba(15, 23, 42, 0.12)',
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>

          <View style={s.headerTitleBox}>
            <Text style={[s.headerTitle, { color: theme.text.primary }]}>
              Sound & Haptics
            </Text>
            <Text style={[s.headerSubtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
              Tactile sensations & feedback
            </Text>
          </View>

          <View style={{ width: 42 }} />
        </Animated.View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section 1: Haptic Feedback */}
          <Text style={[s.sectionHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
            HAPTIC VIBRATION
          </Text>

          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Haptic Feedback
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Vibrate on taps, toggles & task completions
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setHapticsEnabled(val);
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {hapticsEnabled && (
              <View style={s.subOptionsList}>
                <Text style={[s.subOptionsHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  VIBRATION INTENSITY
                </Text>
                {HAPTIC_OPTIONS.map((opt) => {
                  const active = hapticIntensity === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        triggerTestHaptic(opt.id);
                        setHapticIntensity(opt.id);
                      }}
                      style={[
                        s.optionItem,
                        active && {
                          backgroundColor: isDark
                            ? 'rgba(56, 189, 248, 0.16)'
                            : 'rgba(2, 132, 199, 0.1)',
                          borderColor: isDark ? '#38BDF8' : '#0284C7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={active ? '#38BDF8' : isDark ? '#819BB3' : '#64748B'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            s.optionTitle,
                            {
                              color: active
                                ? isDark
                                  ? '#38BDF8'
                                  : '#0284C7'
                                : theme.text.primary,
                              fontWeight: active ? '700' : '500',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={[s.optionDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                          {opt.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section 2: Audio Profiles */}
          <Text style={[s.sectionHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
            AUDIO SOUND PACK
          </Text>

          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Tactile Sound Effects
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Play audio tones for notifications & milestones
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setSoundEnabled(val);
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {soundEnabled && (
              <View style={s.subOptionsList}>
                <Text style={[s.subOptionsHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  SOUND PROFILE
                </Text>
                {SOUND_PROFILES.map((prof) => {
                  const active = soundProfile === prof.id;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSoundProfile(prof.id);
                      }}
                      style={[
                        s.optionItem,
                        active && {
                          backgroundColor: isDark
                            ? 'rgba(56, 189, 248, 0.16)'
                            : 'rgba(2, 132, 199, 0.1)',
                          borderColor: isDark ? '#38BDF8' : '#0284C7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={prof.icon}
                        size={20}
                        color={active ? '#38BDF8' : isDark ? '#819BB3' : '#64748B'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            s.optionTitle,
                            {
                              color: active
                                ? isDark
                                  ? '#38BDF8'
                                  : '#0284C7'
                                : theme.text.primary,
                              fontWeight: active ? '700' : '500',
                            },
                          ]}
                        >
                          {prof.label}
                        </Text>
                        <Text style={[s.optionDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                          {prof.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    ...shadows.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  subOptionsList: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  subOptionsHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionTitle: {
    fontSize: 13,
  },
  optionDesc: {
    fontSize: 11,
    marginTop: 1,
  },
});
