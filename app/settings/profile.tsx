import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase/client';
import { uploadAvatarImage } from '../../src/features/documents/api';

const THEMES = [
  { k: 'system', l: 'System', icon: 'phone-portrait-outline' as const },
  { k: 'light', l: 'Light', icon: 'sunny-outline' as const },
  { k: 'dark', l: 'Dark', icon: 'moon-outline' as const }
] as const;

const CURRENCIES = [
  { code: 'INR', symbol: 'Rs', label: 'INR (Rs) - India' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US' },
  { code: 'EUR', symbol: 'EUR', label: 'EUR (EUR) - Europe' },
  { code: 'GBP', symbol: 'GBP', label: 'GBP (GBP) - UK' }
];

export default function ProfileSettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.user?.id);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState(profile?.full_name ?? 'Manikandan');
  const [currency, setCurrency] = useState(profile?.currency ?? 'INR');
  const [notifs, setNotifs] = useState(profile?.notification_enabled ?? true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.currency) setCurrency(profile.currency);
  }, [profile]);

  const handlePickAvatar = () => {
    Alert.alert('Display Picture', 'Choose an option to update your photo', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85
            });
            if (!res.canceled && res.assets[0]?.uri) {
              await uploadAndSaveAvatar(res.assets[0].uri);
            }
          } catch {
            Alert.alert('Camera Error', 'Could not open camera.');
          }
        }
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          try {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85
            });
            if (!res.canceled && res.assets[0]?.uri) {
              await uploadAndSaveAvatar(res.assets[0].uri);
            }
          } catch {
            Alert.alert('Gallery Error', 'Could not open photo library.');
          }
        }
      },
      ...(profile?.avatar_url
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: async () => {
                await updateProfile({ avatar_url: null });
              }
            }
          ]
        : [])
    ]);
  };

  const uploadAndSaveAvatar = async (localUri: string) => {
    if (!uid) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatarImage(uid, localUri);
      await updateProfile({ avatar_url: publicUrl });
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not save profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: name.trim() || 'Manikandan',
        currency,
        notification_enabled: notifs,
        timezone: 'Asia/Kolkata'
      });
      Alert.alert('Saved', 'Your profile and settings have been saved.');
    } catch (e) {
      Alert.alert('Notice', e instanceof Error ? e.message : 'Could not save.');
    }
  };

  const handleDelete = () =>
    Alert.alert('Delete account', 'Permanently delete your account and all data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete my account',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you sure?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, delete everything',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAccount();
                  router.replace('/(auth)/welcome');
                } catch (e) {
                  Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete account.');
                }
              }
            }
          ])
      }
    ]);

  return (
    <ScreenLayout title="Profile & account" showBack keyboardAvoid>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Header with Camera Upload */}
        <View style={s.avSec}>
          <View style={s.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avImage} />
            ) : (
              <View style={[s.avCircle, { backgroundColor: theme.brand.primaryBg }]}>
                <Text style={[s.avLetter, { color: theme.brand.primary }]}>
                  {name?.[0]?.toUpperCase() ?? 'M'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              style={[s.cameraBadge, { backgroundColor: theme.brand.primary }]}
              accessibilityLabel="Upload profile photo"
            >
              <Ionicons name="camera" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={[s.avName, { color: theme.text.primary }]}>{name || 'Manikandan'}</Text>
          <Text style={[s.avEmail, { color: theme.text.tertiary }]}>{profile?.email ?? ''}</Text>
          <TouchableOpacity onPress={handlePickAvatar}>
            <Text style={[s.changePhotoTxt, { color: theme.brand.primary }]}>
              {uploadingAvatar
                ? 'Uploading photo...'
                : profile?.avatar_url
                ? 'Change Photo'
                : 'Upload Display Picture'}
            </Text>
          </TouchableOpacity>
        </View>

        <Sec title="Personal info">
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <Text style={[s.fieldLabel, { color: theme.text.secondary, marginTop: spacing[2] }]}>Currency</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => setCurrency(c.code)}
                style={[
                  s.thChip,
                  {
                    backgroundColor: currency === c.code ? theme.brand.primary : theme.surface.inset,
                    borderColor: currency === c.code ? theme.brand.primary : theme.border.subtle
                  }
                ]}
              >
                <Text style={{ color: currency === c.code ? '#ffffff' : theme.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Sec>

        {/* Quick Shortcuts to Privacy and Export */}
        <Sec title="Settings Shortcuts">
          <TouchableOpacity
            onPress={() => router.push('/settings/security')}
            style={[s.settRow, { borderColor: theme.border.subtle }]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.brand.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.settLabel, { color: theme.text.primary }]}>Privacy & Security</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                Biometric fingerprint, face recognition, and Master PIN
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/export')}
            style={[s.settRow, { borderColor: theme.border.subtle }]}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.brand.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.settLabel, { color: theme.text.primary }]}>Export My Data</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                Ultra PDF Report, CSV statement, and JSON backup
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
          </TouchableOpacity>
        </Sec>

        <Sec title="Appearance">
          <Text style={[s.fieldLabel, { color: theme.text.secondary }]}>Theme</Text>
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {THEMES.map((o) => (
              <TouchableOpacity
                key={o.k}
                onPress={() => setMode(o.k)}
                style={[
                  s.thChip,
                  {
                    backgroundColor: mode === o.k ? theme.brand.primary : theme.surface.inset,
                    borderColor: mode === o.k ? theme.brand.primary : theme.border.subtle
                  }
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === o.k }}
              >
                <Ionicons name={o.icon} size={16} color={mode === o.k ? '#fff' : theme.text.secondary} />
                <Text style={{ color: mode === o.k ? '#fff' : theme.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                  {o.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Sec>

        <Sec title="Notifications">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[{ color: theme.text.primary, fontSize: fontSize.base }]}>Enable notifications</Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ true: theme.brand.primary }}
              accessibilityLabel="Toggle notifications"
            />
          </View>
        </Sec>

        <Button label="Save changes" onPress={handleSave} loading={isLoading} size="lg" fullWidth />

        <Sec title="Account">
          {[
            { icon: 'log-out-outline', label: 'Sign out', action: signOut, clr: theme.error },
            { icon: 'trash-outline', label: 'Delete account', action: handleDelete, clr: theme.error }
          ].map((item) => (
            <TouchableOpacity key={item.label} onPress={item.action} style={[s.settRow, { borderColor: theme.border.subtle }]}>
              <Ionicons name={item.icon as 'trash-outline'} size={20} color={item.clr} />
              <Text style={[s.settLabel, { color: item.clr }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Sec>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </ScreenLayout>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text style={[{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 }, { color: theme.text.secondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5] },
  avSec: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  avatarWrapper: { position: 'relative', width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  avCircle: { width: 88, height: 88, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  avImage: { width: 88, height: 88, borderRadius: radius.full },
  avLetter: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...shadows.sm
  },
  avName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing[1] },
  avEmail: { fontSize: fontSize.sm },
  changePhotoTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginTop: 2 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  thChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[3], borderRadius: radius.md, borderWidth: 1.5 },
  settRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.md, borderWidth: 1 },
  settLabel: { flex: 1, fontSize: fontSize.base }
});
