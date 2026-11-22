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
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle, Rect } from 'react-native-svg';
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
      {/* 2. NOVA AI SHAPES & ATMOSPHERIC BLUR LAYER (Step 1 & Step 2)   */}
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
        {/* Feathered Radial SVG Orbs: Guarantees soft atmospheric blur on every device */}
        <Svg
          width={SCREEN_WIDTH}
          height={SHAPE_HEIGHT}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            {/* Orb 0: Left upper lavender/periwinkle */}
            <RadialGradient id="grad0" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={presetMeta.circles[0]} stopOpacity="0.95" />
              <Stop offset="30%" stopColor={presetMeta.circles[0]} stopOpacity="0.80" />
              <Stop offset="65%" stopColor={presetMeta.circles[0]} stopOpacity="0.38" />
              <Stop offset="90%" stopColor={presetMeta.circles[0]} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={presetMeta.circles[0]} stopOpacity="0" />
            </RadialGradient>

            {/* Orb 1: Center-Right large luminous ice-blue core sphere */}
            <RadialGradient id="grad1" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={presetMeta.circles[1]} stopOpacity="0.95" />
              <Stop offset="35%" stopColor={presetMeta.circles[1]} stopOpacity="0.82" />
              <Stop offset="70%" stopColor={presetMeta.circles[1]} stopOpacity="0.40" />
              <Stop offset="92%" stopColor={presetMeta.circles[1]} stopOpacity="0.10" />
              <Stop offset="100%" stopColor={presetMeta.circles[1]} stopOpacity="0" />
            </RadialGradient>

            {/* Orb 2: Lower-Center dip vibrant azure blue */}
            <RadialGradient id="grad2" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={presetMeta.circles[2]} stopOpacity="0.92" />
              <Stop offset="32%" stopColor={presetMeta.circles[2]} stopOpacity="0.75" />
              <Stop offset="68%" stopColor={presetMeta.circles[2]} stopOpacity="0.35" />
              <Stop offset="90%" stopColor={presetMeta.circles[2]} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={presetMeta.circles[2]} stopOpacity="0" />
            </RadialGradient>

            {/* Orb 3: Right edge deep cobalt sphere */}
            <RadialGradient id="grad3" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={presetMeta.circles[3]} stopOpacity="0.90" />
              <Stop offset="35%" stopColor={presetMeta.circles[3]} stopOpacity="0.70" />
              <Stop offset="70%" stopColor={presetMeta.circles[3]} stopOpacity="0.30" />
              <Stop offset="92%" stopColor={presetMeta.circles[3]} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={presetMeta.circles[3]} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Orb 0: Top left periwinkle */}
          <SvgCircle
            cx={SCREEN_WIDTH * 0.18}
            cy={SHAPE_HEIGHT * 0.28}
            r={SCREEN_WIDTH * 0.44}
            fill="url(#grad0)"
          />

          {/* Orb 1: Center-top large luminous sphere */}
          <SvgCircle
            cx={SCREEN_WIDTH * 0.68}
            cy={SHAPE_HEIGHT * 0.36}
            r={SCREEN_WIDTH * 0.56}
            fill="url(#grad1)"
          />

          {/* Orb 2: Center downward dip (iconic Nova AI curve) */}
          <SvgCircle
            cx={SCREEN_WIDTH * 0.42}
            cy={SHAPE_HEIGHT * 0.62}
            r={SCREEN_WIDTH * 0.46}
            fill="url(#grad2)"
          />

          {/* Orb 3: Right upper sphere */}
          <SvgCircle
            cx={SCREEN_WIDTH * 0.88}
            cy={SHAPE_HEIGHT * 0.20}
            r={SCREEN_WIDTH * 0.38}
            fill="url(#grad3)"
          />
        </Svg>

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
            { opacity: isFullIntensity ? 0.60 : 0.30 },
          ]}
        />
      </View>

      {/* ============================================================== */}
      {/* 3. HARDWARE BLUR DIFFUSION EFFECT (Matches Reference Panel 2)   */}
      {/* ============================================================== */}
      {blurIntensity > 0 && (
        <BlurView
          intensity={Platform.OS === 'android' ? Math.max(blurIntensity, 70) : blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.blurLayer}
          pointerEvents="none"
        />
      )}

      {/* ============================================================== */}
      {/* 4. SEAMLESS DOWNWARD GRADIENT FALLOFF (Step 3: Final Design)   */}
      {/* ============================================================== */}
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(240, 244, 255, 0.18)',
          isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(240, 244, 255, 0.65)',
          baseBg,
          baseBg,
        ]}
        locations={[0, 0.30, 0.46, 0.62, 1]}
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
