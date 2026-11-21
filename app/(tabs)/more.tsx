import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore, isCleanAvatarUrl } from '../../src/stores/authStore';
import { Card, TouchableCard } from '../../src/components/ui/Card';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

const MODULES: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  route: string;
  bg: string;
  iconColor: string;
}> = [
  { icon: 'checkbox-outline', label: 'Tasks', desc: 'To-dos & priorities', route: '/tasks', bg: 'rgba(56, 189, 248, 0.16)', iconColor: '#38BDF8' },
  { icon: 'document-text-outline', label: 'Notes', desc: 'Thoughts & docs', route: '/notes', bg: 'rgba(16, 185, 129, 0.16)', iconColor: '#10B981' },
  { icon: 'wallet-outline', label: 'Finance', desc: 'Indian Rupee & UPI', route: '/finance', bg: 'rgba(245, 158, 11, 0.16)', iconColor: '#F59E0B' },
  { icon: 'repeat-outline', label: 'Habits', desc: 'Daily consistency', route: '/habits', bg: 'rgba(236, 72, 153, 0.16)', iconColor: '#EC4899' },
  { icon: 'folder-outline', label: 'Documents', desc: 'Cloud file vault', route: '/documents', bg: 'rgba(59, 130, 246, 0.16)', iconColor: '#3B82F6' },
  { icon: 'people-outline', label: 'Workspaces', desc: 'Teams & projects', route: '/workspaces', bg: 'rgba(168, 85, 247, 0.16)', iconColor: '#A855F7' },
  { icon: 'sparkles', label: 'AI Assistant', desc: 'Autonomous intelligence', route: '/ai/chat', bg: 'rgba(14, 165, 233, 0.20)', iconColor: '#0EA5E9' },
];

export default function MoreScreen() {
  const { theme, mode, setMode, isDark } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_CACHE_KEY).then((stored) => {
      if (isCleanAvatarUrl(stored)) setCachedAvatar(stored);
    }).catch(() => {});
  }, []);

  const rawAvatar = profile?.avatar_url || cachedAvatar;
  const activeAvatar = isCleanAvatarUrl(rawAvatar) ? rawAvatar : null;

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out of LifeOS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Top Profile Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <TouchableCard
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings/profile');
            }}
            style={s.profileCard}
          >
            <View style={[
              s.avatarGlow,
              {
                borderColor: isDark ? 'rgba(168, 220, 244, 0.4)' : 'rgba(2, 132, 199, 0.3)',
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : '#F0F7FB',
              },
            ]}>
              {activeAvatar ? (
                <Image
                  source={{ uri: activeAvatar }}
                  style={s.avImage}
                  onError={() => setCachedAvatar(null)}
                />
              ) : (
                <View style={s.avCircle}>
                  <Text style={[s.avLetter, { color: theme.brand.primary }]}>
                    {profile?.full_name?.[0]?.toUpperCase() ?? 'M'}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={[s.pName, { color: theme.text.primary }]} numberOfLines={1}>
                  {profile?.full_name ?? 'Manikandan'}
                </Text>
                <View style={[s.planBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
                  <Text style={[s.planText, { color: theme.brand.primary }]}>PRO</Text>
                </View>
              </View>
              <Text style={[s.pEmail, { color: theme.text.tertiary }]} numberOfLines={1}>
                {profile?.email ?? 'LifeOS Cloud'}
              </Text>
              <Text style={[s.editLink, { color: theme.brand.primary }]}>
                Edit Profile & Preferences →
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} />
          </TouchableCard>
        </Animated.View>

        {/* Modules Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(80)}>
          <View style={s.secHeader}>
            <Text style={[s.sTitle, { color: theme.text.secondary }]}>Apps & Modules</Text>
          </View>
          <View style={s.grid}>
            {MODULES.map((m, index) => (
              <TouchableCard
                key={m.label}
                index={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(m.route as never);
                }}
                style={s.mCard}
              >
                <View style={[s.mIconWrap, { backgroundColor: m.bg }]}>
                  <Ionicons name={m.icon} size={22} color={m.iconColor} />
                </View>
                <Text style={[s.mLabel, { color: theme.text.primary }]}>{m.label}</Text>
                <Text style={[s.mDesc, { color: theme.text.tertiary }]} numberOfLines={1}>
                  {m.desc}
                </Text>
              </TouchableCard>
            ))}
          </View>
        </Animated.View>

        {/* Dedicated Settings Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(140)}>
          <View style={s.secHeader}>
            <Text style={[s.sTitle, { color: theme.text.secondary }]}>System Settings</Text>
          </View>
          <Card style={s.settingsCard}>
            {/* 1. Profile & Account */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/profile');
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="person-outline" size={20} color={theme.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Profile & Account</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Name, avatar, currency, and data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            {/* 2. Theme Selection */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeModalVisible(true);
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.12)' }]}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={isDark ? '#C084FC' : '#7C3AED'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Appearance & Theme</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode (Dark Ocean)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            {/* 3. Privacy & Biometrics */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/security');
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Security & Biometrics</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Fingerprint, Master PIN & Face Unlock</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[
              s.signOut,
              {
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.9)',
              },
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
            <Text style={[s.signOutTxt, { color: theme.error }]}>Sign Out of LifeOS</Text>
          </TouchableOpacity>
          <Text style={[s.ver, { color: theme.text.tertiary }]}>LifeOS v1.0.0 · Dark Ocean Glass Edition</Text>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade" onRequestClose={() => setThemeModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setThemeModalVisible(false)}>
          <View style={[s.modalCard, { backgroundColor: isDark ? 'rgba(10, 36, 56, 0.96)' : '#FFFFFF', borderColor: theme.border.strong }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.text.tertiary} />
              </TouchableOpacity>
            </View>

            {(['system', 'dark', 'light'] as const).map((t) => {
              const active = mode === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMode(t);
                    setThemeModalVisible(false);
                  }}
                  style={[
                    s.themeOption,
                    {
                      borderColor: active ? theme.brand.primary : theme.border.subtle,
                      backgroundColor: active ? (isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)') : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={t === 'dark' ? 'moon' : t === 'light' ? 'sunny' : 'phone-portrait'}
                    size={20}
                    color={active ? theme.brand.primary : theme.text.secondary}
                  />
                  <Text style={{ flex: 1, color: active ? theme.brand.primary : theme.text.primary, fontWeight: active ? '700' : '500' }}>
                    {t === 'system' ? 'System Default (Auto)' : t === 'dark' ? 'Dark Ocean (Frosted)' : 'Arctic Light (Frosted)'}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={theme.brand.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing[5], gap: spacing[4], paddingBottom: 0 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  avatarGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avImage: { width: 56, height: 56, borderRadius: 28 },
  avLetter: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pName: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  planBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full },
  planText: { fontSize: 10, fontWeight: '800' },
  pEmail: { fontSize: fontSize.xs, marginTop: 2 },
  editLink: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginTop: 4 },
  secHeader: { marginBottom: spacing[2], paddingHorizontal: 2 },
  sTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  mCard: {
    width: '48%',
    padding: spacing[3],
    gap: spacing[1],
  },
  mIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  mDesc: { fontSize: fontSize.xs },
  settingsCard: { padding: spacing[2] },
  settRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], gap: spacing[3] },
  settIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing[3] },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.2,
    marginTop: spacing[2],
  },
  signOutTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  ver: { textAlign: 'center', fontSize: fontSize.xs, marginTop: spacing[1] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing[6] },
  modalCard: { borderRadius: radius.xl, padding: spacing[6], gap: spacing[3], borderWidth: 1.2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1.2 },
});
