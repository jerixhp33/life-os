import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import {
  useWallpaperStore,
  WALLPAPER_PRESETS,
  WallpaperConfig,
} from '../../stores/wallpaperStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Local bundled wallpaper asset
const STARLIGHT_PATTERN = require('../../../assets/wallpapers/starlight.jpg');

interface AppBackgroundProps {
  screenName?: string;
  configOverride?: WallpaperConfig;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppBackground({
  screenName,
  configOverride,
  children,
  style,
  contentStyle,
}: AppBackgroundProps) {
  const { isDark } = useTheme();
  const storeConfig = useWallpaperStore((s) => s.getConfigForScreen(screenName));
  const config = configOverride ?? storeConfig;

  const presetMeta =
    WALLPAPER_PRESETS[config.preset] ?? WALLPAPER_PRESETS.nova;

  const baseBg = isDark ? presetMeta.darkBg : presetMeta.lightBg;
  const shapeOpacity = config.shapeOpacity ?? 0.95;
  const isFullIntensity = shapeOpacity >= 0.98;
  const blurIntensity = Math.max(10, Math.min(100, config.blurAmount));

  return (
    <View style={[styles.container, { backgroundColor: baseBg }, style]}>
      {/* ============================================================== */}
      {/* 1. WALLPAPER PATTERN / CUSTOM PHOTO LAYER                       */}
      {/* ============================================================== */}
      {config.preset === 'starlight' && (
        <View style={styles.patternContainer} pointerEvents="none">
          <Image
            source={STARLIGHT_PATTERN}
            style={[
              styles.patternImage,
              { opacity: isDark ? (isFullIntensity ? 0.55 : 0.38) : 0.18 },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(6, 11, 19, 0.1)',
              'rgba(6, 11, 19, 0.45)',
              baseBg,
            ]}
            locations={[0, 0.45, 0.85]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {config.preset === 'custom' && config.customImageUri && (
        <View style={styles.patternContainer} pointerEvents="none">
          <Image
            source={{ uri: config.customImageUri }}
            style={[
              styles.patternImage,
              { opacity: isDark ? (isFullIntensity ? 0.75 : 0.55) : 0.35 },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.15)',
              'rgba(0, 0, 0, 0.55)',
              baseBg,
            ]}
            locations={[0, 0.45, 0.9]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. ORGANIC U-SHAPE TOP-TO-MIDDLE SHAPES LAYER                   */}
      {/* ============================================================== */}
      <View
        style={[
          styles.shapesContainer,
          {
            opacity: isDark ? shapeOpacity : (isFullIntensity ? 0.95 : shapeOpacity * 0.75),
            height: isFullIntensity ? SCREEN_HEIGHT * 0.60 : SHAPE_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        {/* Circle 1: Left upper circle */}
        <View
          style={[
            styles.circle,
            styles.circle1,
            { backgroundColor: presetMeta.circles[0] },
            isFullIntensity && { transform: [{ scale: 1.15 }] },
          ]}
        />

        {/* Circle 2: Large center-top luminous sphere */}
        <View
          style={[
            styles.circle,
            styles.circle2,
            { backgroundColor: presetMeta.circles[1] },
            isFullIntensity && { transform: [{ scale: 1.12 }] },
          ]}
        />

        {/* Circle 3: Right upper sphere */}
        <View
          style={[
            styles.circle,
            styles.circle3,
            { backgroundColor: presetMeta.circles[2] },
            isFullIntensity && { transform: [{ scale: 1.15 }] },
          ]}
        />

        {/* Circle 4: Center-right downward dip - creates the iconic U-shape blend! */}
        <View
          style={[
            styles.circle,
            styles.circle4,
            { backgroundColor: presetMeta.circles[3] },
            isFullIntensity && { transform: [{ scale: 1.20 }] },
          ]}
        />

        {/* Supplementary Soft Core Glow */}
        <LinearGradient
          colors={[
            presetMeta.gradientBase[0],
            'transparent',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.coreGlowGradient,
            { opacity: isFullIntensity ? 0.65 : 0.35 },
          ]}
        />
      </View>

      {/* ============================================================== */}
      {/* 3. BLUR DIFFUSION EFFECT (Matches Reference Panel 2)            */}
      {/* ============================================================== */}
      {blurIntensity > 0 && (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurLayer}
          pointerEvents="none"
        />
      )}

      {/* ============================================================== */}
      {/* 4. SOFT U-SHAPE DOWNWARD GRADIENT FALLOFF                       */}
      {/* ============================================================== */}
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(6, 11, 19, 0.25)' : 'rgba(240, 247, 255, 0.25)',
          isDark ? 'rgba(6, 11, 19, 0.75)' : 'rgba(240, 247, 255, 0.75)',
          baseBg,
          baseBg,
        ]}
        locations={[0, 0.32, 0.5, 0.65, 1]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />

      {/* ============================================================== */}
      {/* 5. 4K CINEMATIC VIGNETTE OVERLAY                                */}
      {/* ============================================================== */}
      {config.vignette && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top Edge Vignette */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.45)', 'transparent']}
            style={styles.vignetteTop}
          />

          {/* Bottom Edge Vignette */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
            style={styles.vignetteBottom}
          />

          {/* Left & Right Subtle Edge Vignettes */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.28)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.vignetteSideLeft}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.28)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.vignetteSideRight}
          />
        </View>
      )}

      {/* ============================================================== */}
      {/* 6. OPTIONAL CHILDREN / SCREEN CONTENT                          */}
      {/* ============================================================== */}
      {children && (
        <View style={[styles.childrenWrap, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const SHAPE_HEIGHT = SCREEN_HEIGHT * 0.54;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    overflow: 'hidden',
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  shapesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SHAPE_HEIGHT,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  // Circle 1: Top left
  circle1: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    top: -SCREEN_WIDTH * 0.15,
    left: -SCREEN_WIDTH * 0.2,
  },
  // Circle 2: Large center-top sphere
  circle2: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    top: -SCREEN_WIDTH * 0.25,
    left: SCREEN_WIDTH * 0.22,
  },
  // Circle 3: Top right accent
  circle3: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    top: SCREEN_WIDTH * 0.12,
    right: -SCREEN_WIDTH * 0.2,
  },
  // Circle 4: Center-middle downward dip (forming the iconic organic U-shape blend)
  circle4: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: SCREEN_WIDTH * 0.35,
    left: SCREEN_WIDTH * 0.15,
  },
  coreGlowGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.35,
  },
  blurLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SHAPE_HEIGHT + 80,
  },
  bottomFadeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  vignetteSideLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 28,
  },
  vignetteSideRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 28,
  },
  childrenWrap: {
    flex: 1,
  },
});
