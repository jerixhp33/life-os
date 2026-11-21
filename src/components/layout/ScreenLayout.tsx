import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, touchTarget } from '../../theme/tokens';
import { AppBackground } from './AppBackground';

interface Props {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoid?: boolean;
  style?: object;
  contentStyle?: object;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  screenName?: string;
  withBackground?: boolean;
}

export function ScreenLayout({
  children,
  title,
  showBack = false,
  rightAction,
  scrollable = false,
  keyboardAvoid = false,
  style,
  contentStyle,
  edges = ['top', 'bottom', 'left', 'right'],
  screenName,
  withBackground = true,
}: Props) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const inner = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  const body = keyboardAvoid ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: withBackground ? (isDark ? '#060B13' : '#F8FAFC') : theme.bg.primary },
        style,
      ]}
      edges={edges}
    >
      {withBackground && <AppBackground screenName={screenName} />}

      {(title || showBack || rightAction) && (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(15, 23, 42, 0.06)',
            },
          ]}
        >
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(15, 23, 42, 0.06)',
                },
              ]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          {title && (
            <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
          )}
          <View style={styles.rightAction}>{rightAction ?? <View style={styles.placeholder} />}</View>
        </View>
      )}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, position: 'relative' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
    marginHorizontal: spacing[2],
  },
  placeholder: { width: 36 },
  rightAction: { minWidth: 36, alignItems: 'flex-end', justifyContent: 'center' },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing[8] },
});
