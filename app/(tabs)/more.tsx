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
import { useAuthStore } from '../../src/stores/authStore';
import { Card, TouchableCard } from '../../src/components/ui/Card';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

const MODULES = [
  { icon: 'checkbox-outline' as const, emoji: '⚡', label: 'Tasks', desc: 'To-dos & priorities', route: '/tasks', bg: 'rgba(56, 189, 248, 0.16)', iconColor: '#38BDF8' },
  { icon: 'document-text-outline' as const, emoji: '📝', label: 'Notes', desc: 'Thoughts & docs', route: '/notes', bg: 'rgba(16, 185, 129, 0.16)', iconColor: '#10B981' },
  { icon: 'wallet-outline' as const, emoji: '💳', label: 'Finance', desc: 'Indian Rupee & UPI', route: '/finance', bg: 'rgba(245, 158, 11, 0.16)', iconColor: '#F59E0B' },
  { icon: 'repeat-outline' as const, emoji: '🔁', label: 'Habits', desc: 'Daily consistency', route: '/habits', bg: 'rgba(236, 72, 153, 0.16)', iconColor: '#EC4899' },
  { icon: 'folder-outline' as const, emoji: '📁', label: 'Documents', desc: 'Cloud file vault', route: '/documents', bg: 'rgba(59, 130, 246, 0.16)', iconColor: '#3B82F6' },
  { icon: 'people-outline' as const, emoji: '👥', label: 'Workspaces', desc: 'Teams & projects', route: '/workspaces', bg: 'rgba(168, 85, 247, 0.16)', iconColor: '#A855F7' },
  { icon: 'sparkles' as const, emoji: '✨', label: 'AI Assistant', desc: 'Autonomous intelligence', route: '/ai/chat', bg: 'rgba(14, 165, 233, 0.20)', iconColor: '#0EA5E9' },
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
      if (stored) setCachedAvatar(stored);
    }).catch(() => {});
  }, []);

  const activeAvatar = profile?.avatar_url || cachedAvatar;

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
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings/profile');
            }}
            activeOpacity={0.8}
            style={[
              s.profileCard,
              {
                backgroundColor: isDark ? 'rgba(14, 38, 64, 0.88)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.08)',
                ...shadows.sm,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open profile settings"
          >
            <View style={[
              s.avatarGlow,
              {
                borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(2, 132, 199, 0.3)',
                backgroundColor: isDark ? 'rgba(7, 21, 36, 0.8)' : '#F0F7FB',
              },
            ]}>
              {activeAvatar ? (
                <Image source={{ uri: activeAvatar }} style={s.avImage} />
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
                {profile?.email ?? 'manikandanjanani67@gmail.com'}
              </Text>
              <Text style={[s.editLink, { color: theme.brand.primary }]}>
                Edit Profile & Preferences →
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} />
          </TouchableOpacity>
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
                  <Text style={s.mEmoji}>{m.emoji}</Text>
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
                <Ionicons name="person" size={18} color={theme.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Profile & Account</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Display picture, currency & name</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            {/* 2. Privacy & Security */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/security');
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Privacy & Security</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Biometrics, Master PIN & auto-lock</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            {/* 3. Export My Data */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/export');
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="document-text" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Export My Data</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Ultra PDF Statement, CSV & JSON</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

            {/* 4. Appearance */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeModalVisible(true);
              }}
              style={s.settRow}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[s.settIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.12)' }]}>
                <Ionicons name="moon" size={18} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Appearance</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Theme: {mode.toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[s.signOut, {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }]}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
            <Text style={[s.signOutTxt, { color: theme.error }]}>Sign out of LifeOS</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[s.ver, { color: theme.text.disabled }]}>
          LifeOS Premium Edition · One UI Frosted Glass v1.0.0
        </Text>

        <View style={{ height: spacing[16] }} />
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, {
            backgroundColor: isDark ? '#0C2036' : '#FFFFFF',
            borderColor: theme.border.default,
            ...shadows.lg,
          }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
              {[
                { k: 'system', l: 'System Default', icon: 'phone-portrait-outline' as const },
                { k: 'light', l: 'Light Mode', icon: 'sunny-outline' as const },
                { k: 'dark', l: 'Dark Mode (Ocean Glass)', icon: 'moon-outline' as const },
              ].map((t) => {
                const selected = mode === t.k;
                return (
                  <TouchableOpacity
                    key={t.k}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(t.k as 'system' | 'light' | 'dark');
                      setThemeModalVisible(false);
                    }}
                    activeOpacity={0.75}
                    style={[
                      s.themeOption,
                      {
                        backgroundColor: selected ? theme.brand.primary : theme.surface.inset,
                        borderColor: selected ? theme.brand.primary : theme.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons name={t.icon} size={20} color={selected ? '#ffffff' : theme.text.secondary} />
                    <Text
                      style={{
                        color: selected ? '#ffffff' : theme.text.primary,
                        fontSize: fontSize.base,
                        fontWeight: selected ? fontWeight.bold : fontWeight.medium,
                        flex: 1,
                      }}
                    >
                      {t.l}
                    </Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color="#ffffff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[20] },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  avatarGlow: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avCircle: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  avImage: { width: 56, height: 56, borderRadius: radius.full },
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
    borderRadius: radius.xl,
    gap: spacing[1],
  },
  mIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mEmoji: { fontSize: 20 },
  mLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  mDesc: { fontSize: fontSize.xs },
  settingsCard: { padding: spacing[2], borderRadius: radius.xl },
  settRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], gap: spacing[3] },
  settIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  settLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing[3] },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing[2],
  },
  signOutTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  ver: { textAlign: 'center', fontSize: fontSize.xs, marginTop: spacing[1] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing[6] },
  modalCard: { borderRadius: radius.xl, padding: spacing[6], gap: spacing[3], borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1 },
});
