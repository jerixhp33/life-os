import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../src/theme/tokens';
import {
  ScreenTarget,
  SCREEN_TARGET_LABELS,
  useWallpaperStore,
  WALLPAPER_PRESETS,
  WallpaperConfig,
  WallpaperPresetId,
} from '../../src/stores/wallpaperStore';
import { AppBackground } from '../../src/components/layout/AppBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TARGET_PAGES: ScreenTarget[] = [
  'global',
  'home',
  'calendar',
  'goals',
  'tasks',
  'notes',
  'finance',
  'habits',
  'more',
];

const BLUR_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: 'Subtle', value: 25 },
  { label: 'Standard', value: 50 },
  { label: 'Intense', value: 75 },
  { label: 'Max', value: 95 },
];

const GLOW_OPTIONS = [
  { label: 'Soft', value: 0.50 },
  { label: 'Balanced', value: 0.75 },
  { label: 'Vivid', value: 0.90 },
  { label: 'Full (100%)', value: 1.0 },
];

export default function WallpaperSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [selectedTarget, setSelectedTarget] = useState<ScreenTarget>('global');

  const globalConfig = useWallpaperStore((s) => s.globalConfig);
  const pageOverrides = useWallpaperStore((s) => s.pageOverrides);
  const setGlobalConfig = useWallpaperStore((s) => s.setGlobalConfig);
  const setPageOverride = useWallpaperStore((s) => s.setPageOverride);
  const resetPageOverride = useWallpaperStore((s) => s.resetPageOverride);
  const resetAll = useWallpaperStore((s) => s.resetAll);

  // Active configuration for current target
  const isTargetOverridden =
    selectedTarget !== 'global' && Boolean(pageOverrides[selectedTarget]);

  const activeConfig: WallpaperConfig =
    selectedTarget === 'global'
      ? globalConfig
      : pageOverrides[selectedTarget] || globalConfig;

  const updateConfig = (updates: Partial<WallpaperConfig>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTarget === 'global') {
      setGlobalConfig(updates);
    } else {
      setPageOverride(selectedTarget, updates);
    }
  };

  const handlePickCustomImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please grant access to your photo library to select a custom wallpaper.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.88,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      updateConfig({
        preset: 'custom',
        customImageUri: uri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleApplyToAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Apply to All Screens',
      `Apply current "${WALLPAPER_PRESETS[activeConfig.preset]?.name}" setup across all pages in LifeOS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Everywhere',
          onPress: async () => {
            await setGlobalConfig(activeConfig);
            // clear overrides so global applies to all
            for (const key of Object.keys(pageOverrides)) {
              await resetPageOverride(key);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleResetTarget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedTarget !== 'global') {
      resetPageOverride(selectedTarget);
    } else {
      resetAll();
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? '#060B13' : '#F8FAFC' }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            borderBottomColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(15, 23, 42, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(15, 23, 42, 0.06)',
            },
          ]}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={theme.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Wallpaper & Visuals
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: isDark ? '#819BB3' : '#64748B' },
            ]}
          >
            Organic U-Shape blend, blur & custom art
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleApplyToAll}
          style={[
            styles.applyAllBtn,
            {
              backgroundColor: isDark
                ? 'rgba(56, 189, 248, 0.16)'
                : 'rgba(2, 132, 199, 0.1)',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={isDark ? '#38BDF8' : '#0284C7'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================== */}
        {/* 1. TARGET SCREEN SEGMENT SELECTOR                               */}
        {/* ============================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Target Screen
          </Text>
          {isTargetOverridden && (
            <TouchableOpacity
              onPress={handleResetTarget}
              style={styles.resetPill}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh-outline"
                size={12}
                color={theme.brand.primary}
              />
              <Text
                style={[styles.resetPillText, { color: theme.brand.primary }]}
              >
                Reset to Global
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.targetScroll}
        >
          {TARGET_PAGES.map((target) => {
            const isSelected = selectedTarget === target;
            const hasOverride = target !== 'global' && Boolean(pageOverrides[target]);

            return (
              <TouchableOpacity
                key={target}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTarget(target);
                }}
                style={[
                  styles.targetChip,
                  {
                    backgroundColor: isSelected
                      ? theme.brand.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(15, 23, 42, 0.05)',
                    borderColor: isSelected
                      ? theme.brand.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(15, 23, 42, 0.08)',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.targetChipText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.text.primary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {target === 'global' ? 'All (Global)' : SCREEN_TARGET_LABELS[target].split(' ')[0]}
                </Text>

                {hasOverride && (
                  <View
                    style={[
                      styles.overrideDot,
                      { backgroundColor: isSelected ? '#FFFFFF' : '#38BDF8' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ============================================================== */}
        {/* 2. REAL-TIME INTERACTIVE PREVIEW CARD                           */}
        {/* ============================================================== */}
        <View style={styles.previewSection}>
          <View style={styles.phoneMockup}>
            {/* Live Backdrop */}
            <AppBackground
              configOverride={activeConfig}
              screenName={selectedTarget}
            />

            {/* Mock Screen Content */}
            <View style={styles.phoneInner}>
              {/* Fake Status Bar */}
              <View style={styles.mockStatusBar}>
                <Text style={styles.mockTime}>09:41</Text>
                <View style={styles.mockStatusIcons}>
                  <Ionicons name="cellular" size={11} color="#FFFFFF" />
                  <Ionicons name="wifi" size={11} color="#FFFFFF" />
                  <Ionicons name="battery-full" size={12} color="#FFFFFF" />
                </View>
              </View>

              {/* Mock App Header */}
              <View style={styles.mockHeader}>
                <View>
                  <Text style={styles.mockAppName}>LifeOS</Text>
                  <Text style={styles.mockPageName}>
                    {SCREEN_TARGET_LABELS[selectedTarget]}
                  </Text>
                </View>
                <View style={styles.mockAvatar}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Sample Glassy White Transparent Card */}
              <View
                style={[
                  styles.mockGlassCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.28)'
                      : 'rgba(255, 255, 255, 0.95)',
                  },
                ]}
              >
                {/* Specular hairline top shine */}
                <View
                  style={[
                    styles.mockCardSpecular,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.45)'
                        : 'rgba(255, 255, 255, 0.98)',
                    },
                  ]}
                />
                <View style={styles.mockCardHeader}>
                  <View style={styles.mockIconBox}>
                    <Ionicons name="sparkles" size={14} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.mockCardTitle,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      Glassy White Card
                    </Text>
                    <Text
                      style={[
                        styles.mockCardSub,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Translucent frosted glass with 4K clarity
                    </Text>
                  </View>
                </View>
                <View style={styles.mockCardPillsRow}>
                  <View style={styles.mockMiniPill}>
                    <Text style={styles.mockMiniPillText}>
                      Blur: {activeConfig.blurAmount}%
                    </Text>
                  </View>
                  <View style={styles.mockMiniPill}>
                    <Text style={styles.mockMiniPillText}>
                      Vignette: {activeConfig.vignette ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.previewHint,
              { color: isDark ? '#819BB3' : '#64748B' },
            ]}
          >
            Live preview of {SCREEN_TARGET_LABELS[selectedTarget]}
          </Text>
        </View>

        {/* ============================================================== */}
        {/* 3. WALLPAPER PRESETS GALLERY                                    */}
        {/* ============================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Background Presets
          </Text>
        </View>

        <View style={styles.presetsGrid}>
          {(Object.keys(WALLPAPER_PRESETS) as WallpaperPresetId[]).map((pid) => {
            const preset = WALLPAPER_PRESETS[pid];
            const isSelected = activeConfig.preset === pid;

            return (
              <TouchableOpacity
                key={pid}
                onPress={() => {
                  if (pid === 'custom') {
                    if (!activeConfig.customImageUri) {
                      handlePickCustomImage();
                      return;
                    }
                  }
                  updateConfig({ preset: pid });
                }}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isSelected
                      ? theme.brand.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(15, 23, 42, 0.08)',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {/* Mini Swatch / Palette Header */}
                <View style={styles.swatchContainer}>
                  {pid === 'starlight' ? (
                    <Image
                      source={require('../../assets/wallpapers/starlight.jpg')}
                      style={styles.swatchImage}
                    />
                  ) : pid === 'custom' && activeConfig.customImageUri ? (
                    <Image
                      source={{ uri: activeConfig.customImageUri }}
                      style={styles.swatchImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={[
                        preset.circles[0],
                        preset.circles[1],
                        preset.darkBg,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}

                  {preset.badge && (
                    <View style={styles.presetBadge}>
                      <Text style={styles.presetBadgeText}>{preset.badge}</Text>
                    </View>
                  )}

                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Preset Info */}
                <View style={styles.presetCardBody}>
                  <Text
                    style={[
                      styles.presetName,
                      { color: theme.text.primary },
                    ]}
                  >
                    {preset.name}
                  </Text>
                  <Text
                    style={[
                      styles.presetDesc,
                      { color: isDark ? '#819BB3' : '#64748B' },
                    ]}
                    numberOfLines={2}
                  >
                    {preset.subtitle}
                  </Text>

                  {pid === 'custom' && (
                    <TouchableOpacity
                      onPress={handlePickCustomImage}
                      style={[
                        styles.customPickBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(56, 189, 248, 0.14)'
                            : 'rgba(2, 132, 199, 0.1)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={12}
                        color={isDark ? '#38BDF8' : '#0284C7'}
                      />
                      <Text
                        style={[
                          styles.customPickBtnText,
                          { color: isDark ? '#38BDF8' : '#0284C7' },
                        ]}
                      >
                        {activeConfig.customImageUri
                          ? 'Change Photo'
                          : 'Choose Photo'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================================== */}
        {/* 4. BLUR & SHAPE ADJUSTMENTS                                     */}
        {/* ============================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Visual Adjustments
          </Text>
        </View>

        {/* Blur Intensity */}
        <View
          style={[
            styles.controlCard,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
        >
          <View style={styles.controlHeaderRow}>
            <View style={styles.controlIconWrap}>
              <Ionicons
                name="water-outline"
                size={18}
                color={theme.brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlLabel, { color: theme.text.primary }]}>
                U-Shape Blur Intensity
              </Text>
              <Text
                style={[
                  styles.controlDesc,
                  { color: isDark ? '#819BB3' : '#64748B' },
                ]}
              >
                Softens organic shapes into a seamless aura ({activeConfig.blurAmount}%)
              </Text>
            </View>
          </View>

          <View style={styles.optionsRow}>
            {BLUR_OPTIONS.map((opt) => {
              const isOptActive = activeConfig.blurAmount === opt.value;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => updateConfig({ blurAmount: opt.value })}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isOptActive
                        ? theme.brand.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(15, 23, 42, 0.05)',
                      borderColor: isOptActive
                        ? theme.brand.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(15, 23, 42, 0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: isOptActive ? '#FFFFFF' : theme.text.primary,
                        fontWeight: isOptActive ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4K Cinematic Vignette Toggle */}
        <View
          style={[
            styles.controlCard,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
        >
          <View style={styles.controlHeaderRow}>
            <View style={styles.controlIconWrap}>
              <Ionicons
                name="scan-outline"
                size={18}
                color={theme.brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlLabel, { color: theme.text.primary }]}>
                4K Cinematic Vignette
              </Text>
              <Text
                style={[
                  styles.controlDesc,
                  { color: isDark ? '#819BB3' : '#64748B' },
                ]}
              >
                Subtle edge shading for enhanced camera depth & focus
              </Text>
            </View>
            <Switch
              value={activeConfig.vignette}
              onValueChange={(val) => updateConfig({ vignette: val })}
              trackColor={{
                false: isDark ? '#334155' : '#CBD5E1',
                true: theme.brand.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Shape Glow Intensity */}
        <View
          style={[
            styles.controlCard,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
        >
          <View style={styles.controlHeaderRow}>
            <View style={styles.controlIconWrap}>
              <Ionicons
                name="sunny-outline"
                size={18}
                color={theme.brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlLabel, { color: theme.text.primary }]}>
                Shape Blend Radiance
              </Text>
              <Text
                style={[
                  styles.controlDesc,
                  { color: isDark ? '#819BB3' : '#64748B' },
                ]}
              >
                Luminance of the top-to-middle U-shape cloud
              </Text>
            </View>
          </View>

          <View style={styles.optionsRow}>
            {GLOW_OPTIONS.map((opt) => {
              const isOptActive =
                Math.abs((activeConfig.shapeOpacity ?? 0.95) - opt.value) < 0.15;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => updateConfig({ shapeOpacity: opt.value })}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isOptActive
                        ? theme.brand.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(15, 23, 42, 0.05)',
                      borderColor: isOptActive
                        ? theme.brand.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(15, 23, 42, 0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: isOptActive ? '#FFFFFF' : theme.text.primary,
                        fontWeight: isOptActive ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  applyAllBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  resetPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  targetChipText: {
    fontSize: 13,
  },
  overrideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  phoneMockup: {
    width: SCREEN_WIDTH - 56,
    height: 250,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  phoneInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  mockStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mockStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockAppName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  mockPageName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  mockAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockGlassCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mockCardSpecular: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
  mockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mockIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mockCardSub: {
    fontSize: 11,
  },
  mockCardPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  mockMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  mockMiniPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewHint: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  swatchContainer: {
    height: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  swatchImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  presetBadge: {
    position: 'absolute',
    top: 6,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  presetBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activeCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetCardBody: {
    padding: 10,
    gap: 4,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  customPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  customPickBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  controlCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  controlDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipText: {
    fontSize: 11,
  },
});
