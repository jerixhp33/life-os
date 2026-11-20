import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/authStore';

const MODULES = [
  { icon: 'checkbox-outline' as const, label: 'Tasks', desc: 'Manage your to-dos', route: '/tasks', bg: '#F0EEFF' },
  { icon: 'document-text-outline' as const, label: 'Notes', desc: 'Capture ideas', route: '/notes', bg: '#ECFDF5' },
  { icon: 'wallet-outline' as const, label: 'Finance', desc: 'Indian Rupee tracking', route: '/finance', bg: '#EFF6FF' },
  { icon: 'repeat-outline' as const, label: 'Habits', desc: 'Build daily routines', route: '/habits', bg: '#FFFBEB' },
  { icon: 'folder-outline' as const, label: 'Documents', desc: 'Secure cloud vault', route: '/documents', bg: '#F5F3FF' },
  { icon: 'people-outline' as const, label: 'Workspaces', desc: 'Collaborate & share', route: '/workspaces', bg: '#FDF2F8' },
  { icon: 'sparkles-outline' as const, label: 'AI', desc: 'Autonomous assistant', route: '/ai/chat', bg: '#F0EEFF' }
];

export default function MoreScreen() {
  const { theme, mode, setMode } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of LifeOS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Top Profile Card with DP */}
        <TouchableOpacity
          onPress={() => router.push('/settings/profile')}
          style={[s.profile, { backgroundColor: theme.brand.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Open profile settings"
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avImage} />
          ) : (
            <View style={s.avCircle}>
              <Text style={s.avLetter}>{profile?.full_name?.[0]?.toUpperCase() ?? 'M'}</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={s.pName} numberOfLines={1}>
              {profile?.full_name ?? 'Manikandan'}
            </Text>
            <Text style={s.pEmail} numberOfLines={1}>
              {profile?.email ?? 'manikandanjanani67@gmail.com'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Modules Section */}
        <Text style={[s.sTitle, { color: theme.text.secondary }]}>Modules</Text>
        <View style={s.grid}>
          {MODULES.map((m) => (
            <TouchableOpacity
              key={m.label}
              onPress={() => router.push(m.route as never)}
              style={[s.mCard, { backgroundColor: theme.surface.default, ...shadows.sm }]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${m.label}`}
            >
              <View style={[s.mIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={22} color={theme.brand.primary} />
              </View>
              <Text style={[s.mLabel, { color: theme.text.primary }]}>{m.label}</Text>
              <Text style={[s.mDesc, { color: theme.text.tertiary }]} numberOfLines={1}>
                {m.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dedicated Settings Section */}
        <Text style={[s.sTitle, { color: theme.text.secondary }]}>Settings</Text>
        <View style={[s.settList, { backgroundColor: theme.surface.default, ...shadows.sm }]}>
          {/* 1. Profile & Account */}
          <TouchableOpacity
            onPress={() => router.push('/settings/profile')}
            style={s.settRow}
            accessibilityRole="button"
          >
            <View style={[s.settIcon, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="person-outline" size={18} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.settLabel, { color: theme.text.primary }]}>Profile & Account</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Display picture, name & currency</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
          <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

          {/* 2. Privacy & Security */}
          <TouchableOpacity
            onPress={() => router.push('/settings/security')}
            style={s.settRow}
            accessibilityRole="button"
          >
            <View style={[s.settIcon, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.brand.primary} />
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
            onPress={() => router.push('/settings/export')}
            style={s.settRow}
            accessibilityRole="button"
          >
            <View style={[s.settIcon, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="document-text-outline" size={18} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.settLabel, { color: theme.text.primary }]}>Export My Data</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Ultra PDF Report, CSV & JSON backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
          <View style={[s.div, { backgroundColor: theme.border.subtle }]} />

          {/* 4. Appearance */}
          <TouchableOpacity
            onPress={() => setThemeModalVisible(true)}
            style={s.settRow}
            accessibilityRole="button"
          >
            <View style={[s.settIcon, { backgroundColor: theme.surface.inset }]}>
              <Ionicons name="moon-outline" size={18} color={theme.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.settLabel, { color: theme.text.primary }]}>Appearance</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>Theme: {mode.toUpperCase()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[s.signOut, { backgroundColor: theme.errorBg }]}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={[s.signOutTxt, { color: theme.error }]}>Sign out</Text>
        </TouchableOpacity>

        <Text style={[s.ver, { color: theme.text.disabled }]}>LifeOS Enterprise Edition · v1.0.0</Text>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.surface.default }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
              {[
                { k: 'system', l: 'System Default', icon: 'phone-portrait-outline' as const },
                { k: 'light', l: 'Light Mode', icon: 'sunny-outline' as const },
                { k: 'dark', l: 'Dark Mode', icon: 'moon-outline' as const }
              ].map((t) => (
                <TouchableOpacity
                  key={t.k}
                  onPress={() => {
                    setMode(t.k as 'system' | 'light' | 'dark');
                    setThemeModalVisible(false);
                  }}
                  style={[
                    s.themeOption,
                    {
                      backgroundColor: mode === t.k ? theme.brand.primary : theme.surface.inset,
                      borderColor: mode === t.k ? theme.brand.primary : theme.border.subtle
                    }
                  ]}
                >
                  <Ionicons name={t.icon} size={20} color={mode === t.k ? '#ffffff' : theme.text.secondary} />
                  <Text
                    style={{
                      color: mode === t.k ? '#ffffff' : theme.text.primary,
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.semibold,
                      flex: 1
                    }}
                  >
                    {t.l}
                  </Text>
                  {mode === t.k && <Ionicons name="checkmark" size={20} color="#ffffff" />}
                </TouchableOpacity>
              ))}
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
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.xl },
  avCircle: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avImage: { width: 56, height: 56, borderRadius: radius.full, borderWidth: 2, borderColor: '#ffffff' },
  avLetter: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#fff' },
  pName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#fff' },
  pEmail: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  sTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  mCard: { width: '47%', padding: spacing[4], borderRadius: radius.lg, gap: spacing[2] },
  mIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  mLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  mDesc: { fontSize: fontSize.xs },
  settList: { borderRadius: radius.xl, overflow: 'hidden' },
  settRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  settIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  settLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  div: { height: StyleSheet.hairlineWidth, marginLeft: spacing[4] + 36 + spacing[3] },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[4], borderRadius: radius.lg },
  signOutTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  ver: { textAlign: 'center', fontSize: fontSize.xs, marginTop: spacing[2] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing[6] },
  modalCard: { borderRadius: radius.xl, padding: spacing[6], gap: spacing[3] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1 }
});
