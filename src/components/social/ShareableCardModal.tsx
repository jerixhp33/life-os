import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);
const CARD_HEIGHT = CARD_WIDTH * (16 / 9) * 0.78; // 9:16 aspect ratio scale
const CAT_LOGO = require('../../../assets/logo.png');

export interface ShareableStoryProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  metric?: string;
  subtitle?: string;
  category?: 'streak' | 'budget' | 'productivity';
}

export function ShareableCardModal({
  visible,
  onClose,
  title = 'Habit Streak Champion',
  metric = '7 Days Continuous',
  subtitle = 'Mastering personal growth with LifeOS',
  category = 'streak',
}: ShareableStoryProps) {
  const { theme, isDark } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const displayName = profile?.full_name || 'LifeOS Member';

  const categoryGradients: Record<string, [string, string]> = {
    streak: ['#F59E0B', '#EF4444'],
    budget: ['#10B981', '#059669'],
    productivity: ['#2563EB', '#38BDF8'],
  };

  const currentGradient = categoryGradients[category] || categoryGradients.streak;

  const handleShare = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'Direct native sharing is not supported on this device.');
      return;
    }
    // Note: Sharing on native mobile shares available file paths or deep link
    Alert.alert('Share Milestone', `Ready to share "${title} - ${metric}" with your friends!`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={s.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
            style={[
              s.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            <Ionicons name="close" size={20} color={isDark ? '#E2E8F0' : '#1E293B'} />
          </TouchableOpacity>

          {/* 9:16 Glossy Story Card */}
          <View
            style={[
              s.storyCard,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {/* Background Gradient & Specular Shine */}
            <LinearGradient
              colors={isDark ? ['#0A2438', '#071827', '#030E17'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
              style={StyleSheet.absoluteFill}
            />

            <View style={s.cardSpecular} />

            {/* Top Branding Header */}
            <View style={s.cardHeader}>
              <View style={s.brandBadge}>
                <Image source={CAT_LOGO} style={s.cardLogo} resizeMode="contain" />
                <Text style={[s.cardBrandText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  LifeOS Milestone
                </Text>
              </View>
              <Text style={[s.dateStamp, { color: isDark ? '#819BB3' : '#64748B' }]}>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            {/* Central Metric Badge */}
            <View style={s.metricContainer}>
              <LinearGradient
                colors={currentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.gradientIconCircle}
              >
                <Ionicons
                  name={
                    category === 'streak'
                      ? 'flame'
                      : category === 'budget'
                      ? 'trophy'
                      : 'checkmark-circle'
                  }
                  size={36}
                  color="#FFFFFF"
                />
              </LinearGradient>

              <Text style={[s.metricTitle, { color: theme.text.primary }]}>{title}</Text>
              <Text style={[s.metricValue, { color: currentGradient[0] }]}>{metric}</Text>
              <Text style={[s.metricSub, { color: isDark ? '#819BB3' : '#64748B' }]}>
                {subtitle}
              </Text>
            </View>

            {/* Footer with User info */}
            <View
              style={[
                s.cardFooter,
                {
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
                },
              ]}
            >
              <View style={s.userRow}>
                <View style={s.avatarDot} />
                <Text style={[s.userName, { color: theme.text.primary }]}>{displayName}</Text>
              </View>
              <Text style={[s.verifiedTag, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                ✓ Verified
              </Text>
            </View>
          </View>

          {/* Action Button: Share */}
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85} style={s.shareBtn}>
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.shareGradient}
            >
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              <Text style={s.shareBtnText}>Share Story to Instagram & WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'flex-end',
  },
  storyCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  cardSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLogo: {
    width: 22,
    height: 22,
  },
  cardBrandText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateStamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  gradientIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.md,
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '85%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  shareBtn: {
    marginTop: 20,
    width: CARD_WIDTH,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.md,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
