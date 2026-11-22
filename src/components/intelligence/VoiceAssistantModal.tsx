import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { parseOmniInput, OmniIntent } from '../../lib/intelligence/omniParser';
import { playTactileCue } from '../../lib/sound/soundService';
import { useAuthStore } from '../../stores/authStore';
import { createTask } from '../../features/tasks/api';
import { createTransaction } from '../../features/finance/api';
import { createNote } from '../../features/notes/api';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../theme/tokens';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_COMMANDS = [
  'Paid ₹350 for Lunch via UPI',
  'Task: Prepare board report by tomorrow !high',
  'Expense: 850 rupees for lunch at cafe',
  'Note: Ideas for mobile app animations',
];

export function VoiceAssistantModal({ visible, onClose }: VoiceAssistantModalProps) {
  const { theme, isDark } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  const [spokenText, setSpokenText] = useState('');
  const [parsedIntent, setParsedIntent] = useState<OmniIntent | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Dynamic soundwave bar animations
  const bar1 = useSharedValue(12);
  const bar2 = useSharedValue(24);
  const bar3 = useSharedValue(36);
  const bar4 = useSharedValue(18);
  const bar5 = useSharedValue(30);

  // Hardware Microphone & Metering Setup
  useEffect(() => {
    let recObj: Audio.Recording | null = null;
    let isCancelled = false;

    if (visible) {
      // Default ambient loop while waiting for mic permission
      const animateBar = (val: typeof bar1, high: number, low: number, duration: number) => {
        val.value = withRepeat(
          withSequence(
            withTiming(high, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(low, { duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      };

      animateBar(bar1, 35, 10, 400);
      animateBar(bar2, 48, 14, 480);
      animateBar(bar3, 60, 20, 360);
      animateBar(bar4, 42, 12, 440);
      animateBar(bar5, 46, 16, 420);

      const setupMicrophone = async () => {
        try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted' || isCancelled) {
            setIsMicActive(false);
            return;
          }

          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const recording = new Audio.Recording();
          await recording.prepareToRecordAsync({
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
            isMeteringEnabled: true,
          });

          recording.setOnRecordingStatusUpdate((st) => {
            if (st.canRecord && st.isRecording && typeof st.metering === 'number') {
              // Status metering dB: -160 dB (silence) to 0 dB (peak)
              // Map speech range (-50 dB to -5 dB) to 0..1 scale
              const norm = Math.max(0, Math.min(1, (st.metering + 50) / 45));
              bar1.value = withTiming(10 + norm * 35, { duration: 90 });
              bar2.value = withTiming(14 + norm * 50, { duration: 90 });
              bar3.value = withTiming(18 + norm * 65, { duration: 90 });
              bar4.value = withTiming(12 + norm * 45, { duration: 90 });
              bar5.value = withTiming(16 + norm * 40, { duration: 90 });
            }
          });

          await recording.startAsync();
          if (!isCancelled) {
            recObj = recording;
            recordingRef.current = recording;
            setIsMicActive(true);
            playTactileCue('click');
          } else {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          console.warn('[Voice Assistant] Mic setup warning:', e);
          setIsMicActive(false);
        }
      };

      setupMicrophone();
    }

    return () => {
      isCancelled = true;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      setIsMicActive(false);
    };
  }, [visible]);

  useEffect(() => {
    if (spokenText.trim().length > 2) {
      const parsed = parseOmniInput(spokenText);
      setParsedIntent(parsed);
    } else {
      setParsedIntent(null);
    }
  }, [spokenText]);

  const handleExecute = async () => {
    if (!parsedIntent || !uid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsExecuting(true);

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
      setIsMicActive(false);
    }

    try {
      if (parsedIntent.type === 'task') {
        await createTask(uid, {
          title: parsedIntent.title,
          priority: parsedIntent.priority ?? 'medium',
          due_date: parsedIntent.dueDate ?? null,
          category: parsedIntent.category ?? null,
          tags: parsedIntent.tags,
        });
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['tasks:today'] });
      } else if (parsedIntent.type === 'finance') {
        await createTransaction(uid, {
          type: (parsedIntent.transactionType as 'expense' | 'income') ?? 'expense',
          amount: parsedIntent.amount ?? 0,
          currency: parsedIntent.currency ?? 'INR',
          category: parsedIntent.category ?? 'Other',
          description: parsedIntent.description || parsedIntent.title || 'Voice Expense',
          date: new Date().toISOString().slice(0, 10),
          is_recurring: false,
        });
        qc.invalidateQueries({ queryKey: ['transactions'] });
        qc.invalidateQueries({ queryKey: ['spending_summary'] });
      } else {
        await createNote(uid, {
          title: parsedIntent.title,
          content: parsedIntent.content ?? '',
          content_type: 'markdown',
          tags: parsedIntent.tags,
          is_favorite: false,
          pinned: false,
        });
        qc.invalidateQueries({ queryKey: ['notes'] });
      }

      playTactileCue('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSpokenText('');
      setParsedIntent(null);
      setIsExecuting(false);
      onClose();
    } catch (e: any) {
      setIsExecuting(false);
      Alert.alert('Execution Error', e.message || 'Failed to process voice command.');
    }
  };

  const bar1Style = useAnimatedStyle(() => ({ height: bar1.value }));
  const bar2Style = useAnimatedStyle(() => ({ height: bar2.value }));
  const bar3Style = useAnimatedStyle(() => ({ height: bar3.value }));
  const bar4Style = useAnimatedStyle(() => ({ height: bar4.value }));
  const bar5Style = useAnimatedStyle(() => ({ height: bar5.value }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark
                ? 'rgba(10, 36, 56, 0.95)'
                : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.22)'
                : 'rgba(15, 23, 42, 0.1)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.assistantBadge}>
              <View style={[styles.pulsingDot, { backgroundColor: isMicActive ? '#10B981' : '#F59E0B' }]} />
              <Text
                style={[
                  styles.assistantBadgeText,
                  { color: isDark ? '#38BDF8' : '#0284C7' },
                ]}
              >
                {isMicActive ? 'Microphone Active • Listening' : 'LifeOS Voice Copilot'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          {/* Soundwave Visualizer */}
          <View style={styles.visualizerContainer}>
            <Animated.View style={[styles.soundwaveBar, bar1Style]} />
            <Animated.View style={[styles.soundwaveBar, bar2Style]} />
            <Animated.View style={[styles.soundwaveBar, bar3Style, { backgroundColor: '#38BDF8' }]} />
            <Animated.View style={[styles.soundwaveBar, bar4Style]} />
            <Animated.View style={[styles.soundwaveBar, bar5Style]} />
          </View>

          <Text style={[styles.listeningText, { color: theme.text.primary }]}>
            {isMicActive ? 'Speak naturally or tap a quick action below' : 'Listening... speak or tap a suggestion'}
          </Text>

          {/* Speech Text Input */}
          <TextInput
            value={spokenText}
            onChangeText={setSpokenText}
            placeholder="e.g. Add urgent task Review proposal tomorrow..."
            placeholderTextColor={isDark ? '#819BB3' : '#94A3B8'}
            multiline
            style={[
              styles.inputBox,
              {
                color: theme.text.primary,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(15, 23, 42, 0.05)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.14)'
                  : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          />

          {/* Sample Prompts */}
          <View style={styles.samplesRow}>
            {SAMPLE_COMMANDS.map((cmd) => (
              <TouchableOpacity
                key={cmd}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSpokenText(cmd);
                }}
                style={[
                  styles.sampleChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(2, 132, 199, 0.08)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sampleText,
                    { color: isDark ? '#38BDF8' : '#0284C7' },
                  ]}
                  numberOfLines={1}
                >
                  {cmd}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Parsed Intent Preview */}
          {parsedIntent && (
            <View
              style={[
                styles.intentCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(56, 189, 248, 0.14)'
                    : 'rgba(2, 132, 199, 0.1)',
                  borderColor: isDark
                    ? 'rgba(56, 189, 248, 0.3)'
                    : 'rgba(2, 132, 199, 0.2)',
                },
              ]}
            >
              <Ionicons
                name={
                  parsedIntent.type === 'task'
                    ? 'checkbox'
                    : parsedIntent.type === 'finance'
                    ? 'wallet'
                    : 'document-text'
                }
                size={16}
                color={isDark ? '#38BDF8' : '#0284C7'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.intentTitle,
                    { color: isDark ? '#E2E8F0' : '#0F172A' },
                  ]}
                >
                  Identified as: {parsedIntent.type.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.intentDetail,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  {parsedIntent.type === 'finance'
                    ? `${parsedIntent.currency ?? '₹'} ${parsedIntent.amount} · ${parsedIntent.category}`
                    : parsedIntent.title}
                </Text>
              </View>
            </View>
          )}

          {/* Execute Command Button */}
          <TouchableOpacity
            disabled={!parsedIntent || isExecuting}
            onPress={handleExecute}
            style={[
              styles.executeBtn,
              {
                opacity: !parsedIntent || isExecuting ? 0.5 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.executeGradient}
            >
              <Ionicons name="sparkles" size={17} color="#FFFFFF" />
              <Text style={styles.executeText}>
                {isExecuting ? 'Processing...' : 'Execute LifeOS Action'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 20,
    gap: 16,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assistantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  assistantBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 70,
  },
  soundwaveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  listeningText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  samplesRow: {
    gap: 6,
  },
  sampleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sampleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  intentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  intentTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  intentDetail: {
    fontSize: 11,
  },
  executeBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  executeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  executeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
