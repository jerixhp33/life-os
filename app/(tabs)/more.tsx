import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore, isCleanAvatarUrl } from '../../src/stores/authStore';
import { AppBackground } from '../../src/components/layout/AppBackground';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

interface ModuleItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  route: string;
  gradient: [string, string];
  accent: string;
  badge?: string;
}

const MODULES: ModuleItem[] = [
  {
    icon: 'checkbox',
    label: 'Tasks',
    desc: 'To-dos & priorities',
    route: '/tasks',
    gradient: ['#0284C7', '#38BDF8'],
    accent: '#0284C7',
  },
  {
    icon: 'document-text',
    label: 'Notes',
    desc: 'Thoughts & docs',
    route: '/notes',
    gradient: ['#059669', '#10B981'],
    accent: '#10B981',
  },
  {
    icon: 'wallet',
    label: 'Finance',
    desc: 'Income & expenses',
    route: '/finance',
    gradient: ['#D97706', '#F59E0B'],
    accent: '#F59E0B',
  },
  {
    icon: 'repeat',
    label: 'Habits',
    desc: 'Daily consistency',
    route: '/habits',
    gradient: ['#E11D48', '#FB7185'],
    accent: '#FB7185',
  },
  {
    icon: 'folder',
    label: 'Documents',
    desc: 'Encrypted vault',
    route: '/documents',
    gradient: ['#2563EB', '#60A5FA'],
    accent: '#3B82F6',
  },
  {
    icon: 'people',
    label: 'Workspaces',
    desc: 'Teams & projects',
    route: '/workspaces',
    gradient: ['#7C3AED', '#A855F7'],
    accent: '#8B5CF6',
  },
  {
    icon: 'sparkles',
    label: 'AI Assistant',
    desc: 'Autonomous intelligence',
    route: '/ai/chat',
    gradient: ['#4F46E5', '#818CF8'],
    accent: '#6366F1',
    badge: 'AI PRO',
  },
];

export default function MoreScreen() {
  const { theme, mode, setMode, isDark } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_CACHE_KEY)
      .then((stored) => {
        if (isCleanAvatarUrl(stored)) setCachedAvatar(stored);
      })
      .catch(() => {});
  }, []);

  const rawAvatar = profile?.avatar_url || cachedAvatar;
  const activeAvatar = isCleanAvatarUrl(rawAvatar) ? rawAvatar : null;
  const displayName = profile?.full_name || 'Manikandan';
  const displayEmail = profile?.email || 'lifeos@cloud.local';

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
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="more" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLOSSY THEME BUTTON                         */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(420)} style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTagRow}>
            <View
              style={[
                s.headerBadge,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.10)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(2, 132, 199, 0.20)',
                },
              ]}
            >
              <Ionicons name="grid" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Hub & Preferences
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>Hub & Settings</Text>
          <Text style={[s.subtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
            Apps, intelligence & system controls
          </Text>
        </View>

        {/* Right Glass Theme Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setThemeModalVisible(true);
          }}
          style={[
            s.topGlassBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Switch Theme"
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={18}
            color={isDark ? '#C084FC' : '#F59E0B'}
          />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ============================================================== */}
        {/* 2. TOP HERO PROFILE CARD (Matching Home Glow Avatar)          */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(60)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings/profile');
            }}
            style={[
              s.profileCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            {/* Avatar with Radiant Purple/Indigo Aura Halo */}
            <View style={s.avatarHaloContainer}>
              <LinearGradient
                colors={['#818CF8', '#C084FC', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.avatarGradientBorder}
              >
                <View
                  style={[
                    s.avatarInnerCircle,
                    { backgroundColor: isDark ? 'rgba(10, 36, 56, 0.95)' : '#FFFFFF' },
                  ]}
                >
                  {activeAvatar ? (
                    <Image
                      source={{ uri: activeAvatar }}
                      style={s.avatarImg}
                      onError={() => setCachedAvatar(null)}
                    />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                      <Text style={[s.avatarLetter, { color: theme.brand.primary }]}>
                        {displayName[0]?.toUpperCase() ?? 'M'}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              {/* Online / Active Cloud Status Pill */}
              <View style={s.onlineBadge}>
                <View style={s.onlineDot} />
              </View>
            </View>

            {/* Profile Info */}
            <View style={{ flex: 1 }}>
              <View style={s.profileNameRow}>
                <Text style={[s.profileName, { color: theme.text.primary }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <LinearGradient
                  colors={['#4338CA', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.proPill}
                >
                  <Text style={s.proPillText}>PRO</Text>
                </LinearGradient>
              </View>

              <Text style={[s.profileEmail, { color: isDark ? '#819BB3' : '#64748B' }]} numberOfLines={1}>
                {displayEmail}
              </Text>

              {/* Quick Profile Links */}
              <View style={s.profileActionsRow}>
                <View
                  style={[
                    s.profileChip,
                    {
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.08)',
                    },
                  ]}
                >
                  <Ionicons name="cloud-done-outline" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
                  <Text style={[s.profileChipText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                    Cloud Synced
                  </Text>
                </View>

                <View style={s.editPromptRow}>
                  <Text style={[s.editPromptText, { color: theme.brand.primary }]}>
                    Edit Profile
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color={theme.brand.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ============================================================== */}
        {/* 3. APPS & MODULES GRID ("ECOSYSTEM APPS")                      */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(120)}>
          <View style={s.secHeaderRow}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>Ecosystem Apps</Text>
            <View
              style={[
                s.countBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
                },
              ]}
            >
              <Text style={[s.countBadgeText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                {MODULES.length} MODULES
              </Text>
            </View>
          </View>

          <View style={s.grid}>
            {MODULES.map((m, index) => (
              <TouchableOpacity
                key={m.label}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(m.route as never);
                }}
                style={[
                  s.moduleCard,
                  {
                    backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                    borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                    ...shadows.sm,
                  },
                ]}
              >
                {/* Top Row with Gradient Squircle & Arrow */}
                <View style={s.moduleTopRow}>
                  <LinearGradient
                    colors={m.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.moduleSquircle}
                  >
                    <Ionicons name={m.icon} size={20} color="#FFFFFF" />
                  </LinearGradient>

                  {m.badge ? (
                    <View style={s.aiBadge}>
                      <Text style={s.aiBadgeText}>{m.badge}</Text>
                    </View>
                  ) : (
                    <View style={s.arrowMiniCircle}>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={isDark ? '#819BB3' : '#94A3B8'}
                      />
                    </View>
                  )}
                </View>

                {/* Label and Subtitle */}
                <Text style={[s.moduleLabel, { color: theme.text.primary }]}>{m.label}</Text>
                <Text style={[s.moduleDesc, { color: isDark ? '#819BB3' : '#64748B' }]} numberOfLines={1}>
                  {m.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 4. SYSTEM CONTROLS & PREFERENCES CARD                          */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(180)}>
          <View style={s.secHeaderRow}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>System Controls</Text>
          </View>

          <View
            style={[
              s.settingsGroupCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            {/* 1. Account & Profile */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/profile');
              }}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.settSquircle}
              >
                <Ionicons name="person" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Account & Profile</Text>
                <Text style={[s.settSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Name, avatar, currency & email
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[s.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* 2. Appearance & Themes */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeModalVisible(true);
              }}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.settSquircle}
              >
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Appearance & Theme</Text>
                <Text style={[s.settSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  {mode.toUpperCase()} · Frosted Glass
                </Text>
              </View>
              <View
                style={[
                  s.themePill,
                  {
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(124, 58, 237, 0.10)',
                  },
                ]}
              >
                <Text style={[s.themePillText, { color: isDark ? '#C084FC' : '#7C3AED' }]}>
                  {mode === 'system' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[s.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* 3. Wallpaper & Visuals */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/wallpaper');
              }}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#2563EB', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.settSquircle}
              >
                <Ionicons name="color-palette" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Wallpaper & Visuals</Text>
                <Text style={[s.settSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Organic U-shape blend, blur & per-page setup
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[s.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* 4. Security & Biometrics */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/security');
              }}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.settSquircle}
              >
                <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Security & Biometrics</Text>
                <Text style={[s.settSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Fingerprint, PIN & Face Unlock
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[s.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* 4. Cloud Vault & Data Export */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/export');
              }}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#0284C7', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.settSquircle}
              >
                <Ionicons name="cloud-upload" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Cloud Vault & Export</Text>
                <Text style={[s.settSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  PDF reports, CSV & JSON backup
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 5. SIGN OUT BUTTON & SYSTEM INFO                               */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(240)} style={s.footerSection}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[
              s.signOutBtn,
              {
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.10)' : 'rgba(254, 242, 242, 0.95)',
                ...shadows.sm,
              },
            ]}
            activeOpacity={0.82}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={s.signOutText}>Sign Out of LifeOS</Text>
          </TouchableOpacity>

          <Text style={[s.versionText, { color: isDark ? '#819BB3' : '#94A3B8' }]}>
            LifeOS v1.0.0 · Dark Ocean Frosted Edition
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ============================================================== */}
      {/* 6. THEME PICKER MODAL                                          */}
      {/* ============================================================== */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            style={[
              s.modalCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.96)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.30)' : '#E2E8F0',
                ...shadows.md,
              },
            ]}
          >
            <View style={s.modalHeader}>
              <View style={s.modalTitleCol}>
                <Text style={[s.modalTitle, { color: theme.text.primary }]}>Appearance & Theme</Text>
                <Text style={[s.modalSubtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Choose your visual glass style
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={isDark ? '#819BB3' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {(
              [
                { k: 'system', l: 'System Default (Auto)', icon: 'phone-portrait-outline', desc: 'Syncs with device mode' },
                { k: 'dark', l: 'Dark Ocean (Frosted)', icon: 'moon-outline', desc: 'Deep navy glass with radiant glow' },
                { k: 'light', l: 'Arctic Light (Frosted)', icon: 'sunny-outline', desc: 'Airy translucent cards & bright aura' },
              ] as const
            ).map((t) => {
              const active = mode === t.k;
              return (
                <TouchableOpacity
                  key={t.k}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMode(t.k);
                    setThemeModalVisible(false);
                  }}
                  activeOpacity={0.8}
                  style={[
                    s.themeOption,
                    {
                      borderColor: active
                        ? theme.brand.primary
                        : isDark
                        ? 'rgba(168, 220, 244, 0.20)'
                        : '#E2E8F0',
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(56, 189, 248, 0.14)'
                          : 'rgba(2, 132, 199, 0.08)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(248, 250, 252, 0.8)',
                    },
                  ]}
                >
                  <View
                    style={[
                      s.themeIconBox,
                      {
                        backgroundColor: active
                          ? theme.brand.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={18}
                      color={active ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.themeOptionTitle,
                        {
                          color: active ? theme.brand.primary : theme.text.primary,
                          fontWeight: active ? fontWeight.bold : fontWeight.semibold,
                        },
                      ]}
                    >
                      {t.l}
                    </Text>
                    <Text style={[s.themeOptionDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                      {t.desc}
                    </Text>
                  </View>

                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.brand.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  ambientGlow: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  headerTagRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: fontWeight.medium,
  },
  topGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    paddingBottom: 130, // Safe clearance for floating navigation dock
    gap: spacing[4],
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing[4],
    borderRadius: 24,
    borderWidth: 1.2,
  },
  avatarHaloContainer: {
    position: 'relative',
  },
  avatarGradientBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  proPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  proPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  profileChipText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  editPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editPromptText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },

  // Ecosystem Apps Section
  secHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingHorizontal: 2,
  },
  secTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    borderRadius: 22,
    padding: spacing[3] + 2,
    borderWidth: 1.2,
    gap: 6,
  },
  moduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moduleSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  aiBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  aiBadgeText: {
    color: '#6366F1',
    fontSize: 9,
    fontWeight: '800',
  },
  arrowMiniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
  },
  moduleDesc: {
    fontSize: 11,
    lineHeight: 15,
  },

  // System Controls
  settingsGroupCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  settRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: 12,
  },
  settSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  settLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  settSub: {
    fontSize: 11,
    marginTop: 2,
  },
  themePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: 4,
  },
  themePillText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: spacing[4],
  },

  // Footer & Sign Out
  footerSection: {
    gap: 10,
    marginTop: spacing[2],
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: spacing[5],
  },
  modalCard: {
    borderRadius: 24,
    padding: spacing[5],
    gap: spacing[3],
    borderWidth: 1.2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing[3] + 2,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  themeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionTitle: {
    fontSize: fontSize.sm,
  },
  themeOptionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
