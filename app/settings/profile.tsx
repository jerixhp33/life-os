import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { uploadAvatarImage } from '../../src/features/documents/api';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

const THEMES = [
  { k: 'system', l: 'System', icon: 'phone-portrait-outline' as const },
  { k: 'light', l: 'Light', icon: 'sunny-outline' as const },
  { k: 'dark', l: 'Dark', icon: 'moon-outline' as const }
] as const;

const CURRENCIES = [
  { code: 'INR', symbol: 'Rs', label: 'INR (Rs) · India' },
  { code: 'USD', symbol: '$', label: 'USD ($) · US' },
  { code: 'EUR', symbol: 'EUR', label: 'EUR (EUR) · Europe' },
  { code: 'GBP', symbol: 'GBP', label: 'GBP (GBP) · UK' }
];

export default function ProfileSettingsScreen() {
  const { theme, mode, setMode, isDark } = useTheme();
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
  const [localAvatar, setLocalAvatar] = useState<string | null>(profile?.avatar_url ?? null);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.currency) setCurrency(profile.currency);
    if (profile?.avatar_url) setLocalAvatar(profile.avatar_url);
  }, [profile]);

  useEffect(() => {
    // Check fallback avatar from AsyncStorage on mount
    AsyncStorage.getItem(AVATAR_CACHE_KEY).then((cached) => {
      if (cached && !localAvatar) {
        setLocalAvatar(cached);
      }
    }).catch(() => {});
  }, []);

  const handlePickAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              await persistAndUploadAvatar(res.assets[0].uri);
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
              await persistAndUploadAvatar(res.assets[0].uri);
            }
          } catch {
            Alert.alert('Gallery Error', 'Could not open photo library.');
          }
        }
      },
      ...(localAvatar || profile?.avatar_url
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setLocalAvatar(null);
                await AsyncStorage.removeItem(AVATAR_CACHE_KEY).catch(() => {});
                await updateProfile({ avatar_url: null });
              }
            }
          ]
        : [])
    ]);
  };

  const persistAndUploadAvatar = async (pickedUri: string) => {
    setUploadingAvatar(true);
    try {
      // 1. Copy to permanent documentDirectory so OS never deletes it upon exit
      let permanentUri = pickedUri;
      try {
        if (FileSystem.documentDirectory) {
          const dest = `${FileSystem.documentDirectory}avatar_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: pickedUri, to: dest });
          permanentUri = dest;
        }
      } catch (e) {
        console.warn('[Avatar local copy fallback]', e);
      }

      // 2. Immediately update local state, store and AsyncStorage
      setLocalAvatar(permanentUri);
      await AsyncStorage.setItem(AVATAR_CACHE_KEY, permanentUri).catch(() => {});
      await updateProfile({ avatar_url: permanentUri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 3. Upload to Supabase cloud storage in background
      if (uid) {
        try {
          const publicUrl = await uploadAvatarImage(uid, permanentUri);
          if (publicUrl) {
            setLocalAvatar(publicUrl);
            await AsyncStorage.setItem(AVATAR_CACHE_KEY, publicUrl).catch(() => {});
            await updateProfile({ avatar_url: publicUrl });
          }
        } catch (cloudErr) {
          console.warn('[Avatar cloud upload fallback]', cloudErr);
        }
      }
      Alert.alert('Success', 'Profile photo saved and persisted.');
    } catch (err) {
      Alert.alert('Upload Notice', err instanceof Error ? err.message : 'Photo saved locally.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateProfile({
        full_name: name.trim() || 'Manikandan',
        currency,
        notification_enabled: notifs,
        timezone: 'Asia/Kolkata',
        avatar_url: localAvatar
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const activeAvatar = localAvatar || profile?.avatar_url;

  return (
    <ScreenLayout title="Profile & Account" showBack keyboardAvoid>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.avSec}>
          <View style={s.avatarWrapper}>
            <View style={[
              s.avatarGlow,
              {
                borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.25)',
                backgroundColor: isDark ? 'rgba(14, 38, 64, 0.8)' : '#FFFFFF'
              }
            ]}>
              {activeAvatar ? (
                <Image source={{ uri: activeAvatar }} style={s.avImage} />
              ) : (
                <View style={[s.avCircle, { backgroundColor: theme.brand.primaryBg }]}>
                  <Text style={[s.avLetter, { color: theme.brand.primary }]}>
                    {name?.[0]?.toUpperCase() ?? 'M'}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              style={[s.cameraBadge, { backgroundColor: theme.brand.primary }]}
              accessibilityLabel="Upload profile photo"
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={[s.avName, { color: theme.text.primary }]}>{name || 'Manikandan'}</Text>
          <Text style={[s.avEmail, { color: theme.text.tertiary }]}>{profile?.email ?? ''}</Text>

          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            <View style={[s.photoPill, { backgroundColor: theme.brand.primaryBg }]}>
              <Ionicons name="image-outline" size={14} color={theme.brand.primary} />
              <Text style={[s.changePhotoTxt, { color: theme.brand.primary }]}>
                {uploadingAvatar ? 'Saving photo...' : activeAvatar ? 'Change Photo' : 'Upload Photo'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Personal info */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.sectionWrap}>
          <Text style={[s.secTitle, { color: theme.text.secondary }]}>Personal Information</Text>
          <Card style={s.cardBody}>
            <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
            <Text style={[s.fieldLabel, { color: theme.text.secondary, marginTop: spacing[3] }]}>Default Currency</Text>
            <View style={s.currencyGrid}>
              {CURRENCIES.map((c) => {
                const selected = currency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCurrency(c.code);
                    }}
                    activeOpacity={0.75}
                    style={[
                      s.thChip,
                      {
                        backgroundColor: selected ? theme.brand.primary : theme.surface.inset,
                        borderColor: selected ? theme.brand.primary : theme.border.subtle
                      }
                    ]}
                  >
                    <Text style={{
                      color: selected ? '#ffffff' : theme.text.secondary,
                      fontSize: fontSize.sm,
                      fontWeight: selected ? fontWeight.bold : fontWeight.medium
                    }}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Shortcuts */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)} style={s.sectionWrap}>
          <Text style={[s.secTitle, { color: theme.text.secondary }]}>Security & Data</Text>
          <Card style={s.cardBody}>
            <TouchableOpacity
              onPress={() => router.push('/settings/security')}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Privacy & Security</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                  Biometric lock, Master PIN, and auto-lock
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>

            <View style={[s.divider, { backgroundColor: theme.border.subtle }]} />

            <TouchableOpacity
              onPress={() => router.push('/settings/export')}
              style={s.settRow}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="document-text" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Export My Data</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                  Ultra PDF Report, CSV statement, and JSON
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={s.sectionWrap}>
          <Text style={[s.secTitle, { color: theme.text.secondary }]}>Appearance</Text>
          <Card style={s.cardBody}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {THEMES.map((o) => {
                const selected = mode === o.k;
                return (
                  <TouchableOpacity
                    key={o.k}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(o.k);
                    }}
                    activeOpacity={0.75}
                    style={[
                      s.themeBtn,
                      {
                        backgroundColor: selected ? theme.brand.primary : theme.surface.inset,
                        borderColor: selected ? theme.brand.primary : theme.border.subtle
                      }
                    ]}
                  >
                    <Ionicons name={o.icon} size={18} color={selected ? '#fff' : theme.text.secondary} />
                    <Text style={{
                      color: selected ? '#fff' : theme.text.secondary,
                      fontSize: fontSize.sm,
                      fontWeight: selected ? fontWeight.bold : fontWeight.medium
                    }}>
                      {o.l}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInUp.duration(400).delay(250)} style={s.sectionWrap}>
          <Text style={[s.secTitle, { color: theme.text.secondary }]}>Preferences</Text>
          <Card style={s.cardBody}>
            <View style={s.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.settLabel, { color: theme.text.primary }]}>Push Notifications</Text>
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                  Reminders for tasks, calendar events, and habits
                </Text>
              </View>
              <Switch
                value={notifs}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setNotifs(val);
                }}
                trackColor={{ true: theme.brand.primary }}
              />
            </View>
          </Card>
        </Animated.View>

        <Button label="Save Changes" onPress={handleSave} loading={isLoading} size="lg" fullWidth />

        {/* Danger zone */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={s.sectionWrap}>
          <Card style={s.cardBody}>
            <TouchableOpacity onPress={signOut} style={s.settRow} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
              <Text style={[s.settLabel, { color: theme.error, fontWeight: fontWeight.semibold }]}>Sign Out</Text>
            </TouchableOpacity>

            <View style={[s.divider, { backgroundColor: theme.border.subtle }]} />

            <TouchableOpacity onPress={handleDelete} style={s.settRow} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color={theme.error} />
              <Text style={[s.settLabel, { color: theme.error, fontWeight: fontWeight.semibold }]}>Delete Account</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5] },
  avSec: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  avatarWrapper: { position: 'relative', width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'hidden',
    ...shadows.md
  },
  avCircle: { width: 94, height: 94, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  avImage: { width: 94, height: 94, borderRadius: radius.full },
  avLetter: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...shadows.sm
  },
  avName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing[1] },
  avEmail: { fontSize: fontSize.sm },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 4
  },
  changePhotoTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  sectionWrap: { gap: spacing[2] },
  secTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardBody: { padding: spacing[4], gap: spacing[3] },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  thChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1
  },
  settRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  iconBox: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  settLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[1] }
});
