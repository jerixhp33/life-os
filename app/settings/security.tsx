import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useSecurityStore } from '../../src/stores/securityStore';
import { checkBiometricSupport, getMasterPin, setMasterPin, clearMasterPin, type BiometricStatus } from '../../src/lib/security/biometrics';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const TIMEOUT_OPTIONS = [
  { label: 'Immediate', minutes: 0 },
  { label: '1 Minute', minutes: 1 },
  { label: '5 Minutes', minutes: 5 },
  { label: '15 Minutes', minutes: 15 }
];

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const isLockEnabled = useSecurityStore((s) => s.isLockEnabled);
  const lockTimeoutMinutes = useSecurityStore((s) => s.lockTimeoutMinutes);
  const setLockEnabled = useSecurityStore((s) => s.setLockEnabled);
  const setLockTimeout = useSecurityStore((s) => s.setLockTimeout);
  const lockNow = useSecurityStore((s) => s.lockNow);

  const [bioStatus, setBioStatus] = useState<BiometricStatus | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    checkBiometricSupport().then(setBioStatus);
    getMasterPin().then((p) => setHasPin(Boolean(p)));
  }, []);

  const handleToggleLock = async (value: boolean) => {
    if (value && !hasPin) {
      setPinModalVisible(true);
      return;
    }
    await setLockEnabled(value);
  };

  const handleSavePin = async () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric PIN.');
      return;
    }
    await setMasterPin(pinInput);
    setHasPin(true);
    await setLockEnabled(true);
    setPinModalVisible(false);
    setPinInput('');
    Alert.alert('PIN Configured', 'Master PIN set and App Lock is now active.');
  };

  const handleRemovePin = () => {
    Alert.alert('Remove PIN', 'Are you sure you want to disable App Lock and remove the Master PIN?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await clearMasterPin();
          await setLockEnabled(false);
          setHasPin(false);
        }
      }
    ]);
  };

  return (
    <ScreenLayout title="Privacy & Security" showBack>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hardware Status Banner */}
        <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
          <View style={s.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={22} color={theme.brand.primary} />
            <Text style={[s.cardTitle, { color: theme.text.primary }]}>Device Hardware Security</Text>
          </View>
          <View style={s.statusRow}>
            <Text style={[s.statusKey, { color: theme.text.secondary }]}>Biometric Sensors</Text>
            <View style={s.badge}>
              <Ionicons
                name={bioStatus?.hasHardware ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={bioStatus?.hasHardware ? theme.success : theme.error}
              />
              <Text style={[s.badgeTxt, { color: bioStatus?.hasHardware ? theme.success : theme.error }]}>
                {bioStatus?.hasHardware ? 'Detected' : 'Not Available'}
              </Text>
            </View>
          </View>
          <View style={[s.div, { backgroundColor: theme.border.subtle }]} />
          <View style={s.statusRow}>
            <Text style={[s.statusKey, { color: theme.text.secondary }]}>Enrolled Fingerprint / Face</Text>
            <View style={s.badge}>
              <Ionicons
                name={bioStatus?.isEnrolled ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={bioStatus?.isEnrolled ? theme.success : theme.warning}
              />
              <Text style={[s.badgeTxt, { color: bioStatus?.isEnrolled ? theme.success : theme.warning }]}>
                {bioStatus?.isEnrolled ? 'Enrolled' : 'Not Set in OS'}
              </Text>
            </View>
          </View>
        </View>

        {/* Master Lock Toggle */}
        <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, ...shadows.sm }]}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.toggleTitle, { color: theme.text.primary }]}>Require App Lock</Text>
              <Text style={[s.toggleSub, { color: theme.text.tertiary }]}>
                Ask for Biometrics or Master PIN whenever opening LifeOS
              </Text>
            </View>
            <Switch
              value={isLockEnabled}
              onValueChange={handleToggleLock}
              trackColor={{ true: theme.brand.primary }}
              accessibilityLabel="Toggle app lock"
            />
          </View>

          {isLockEnabled && (
            <>
              <View style={[s.div, { backgroundColor: theme.border.subtle }]} />
              <View style={{ gap: spacing[2] }}>
                <Text style={[s.secLabel, { color: theme.text.secondary }]}>Auto-Lock Timeout</Text>
                <View style={s.timeoutGrid}>
                  {TIMEOUT_OPTIONS.map((opt) => {
                    const active = lockTimeoutMinutes === opt.minutes;
                    return (
                      <TouchableOpacity
                        key={opt.minutes}
                        onPress={() => setLockTimeout(opt.minutes)}
                        style={[
                          s.timeoutChip,
                          {
                            backgroundColor: active ? theme.brand.primary : theme.surface.inset,
                            borderColor: active ? theme.brand.primary : theme.border.subtle
                          }
                        ]}
                      >
                        <Text
                          style={[
                            s.timeoutChipTxt,
                            { color: active ? '#ffffff' : theme.text.secondary }
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[s.div, { backgroundColor: theme.border.subtle }]} />
              <View style={s.pinSection}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.pinTitle, { color: theme.text.primary }]}>Master PIN</Text>
                  <Text style={[s.pinSub, { color: theme.text.tertiary }]}>
                    {hasPin ? '4-digit PIN is configured' : 'No PIN configured'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  <TouchableOpacity
                    onPress={() => setPinModalVisible(true)}
                    style={[s.btnSmall, { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }]}
                  >
                    <Text style={[s.btnSmallTxt, { color: theme.brand.primary }]}>
                      {hasPin ? 'Change' : 'Set PIN'}
                    </Text>
                  </TouchableOpacity>
                  {hasPin && (
                    <TouchableOpacity
                      onPress={handleRemovePin}
                      style={[s.btnSmall, { backgroundColor: theme.errorBg }]}
                    >
                      <Text style={[s.btnSmallTxt, { color: theme.error }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Immediate Lock Test */}
        {isLockEnabled && (
          <Button
            label="Lock App Now (Test Security)"
            onPress={lockNow}
            variant="secondary"
            size="lg"
            fullWidth
          />
        )}

        {/* Privacy Note */}
        <View style={[s.infoBox, { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }]}>
          <Ionicons name="shield-outline" size={20} color={theme.text.tertiary} />
          <Text style={[s.infoTxt, { color: theme.text.tertiary }]}>
            LifeOS uses client-side biometric hardware verification. Your fingerprint and face biometric data never leave your device.
          </Text>
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      {/* Set PIN Modal */}
      <Modal visible={pinModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.surface.default }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>
                {hasPin ? 'Change Master PIN' : 'Set 4-Digit Master PIN'}
              </Text>
              <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.text.tertiary, fontSize: fontSize.sm }}>
              Enter 4 digits to unlock LifeOS when biometrics are unavailable.
            </Text>
            <Input
              label="4-Digit PIN"
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="e.g. 1234"
              autoFocus
            />
            <Button
              label="Save Master PIN"
              onPress={handleSavePin}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: spacing[3] }}
            />
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  card: { padding: spacing[4], borderRadius: radius.xl, borderWidth: 1, gap: spacing[3] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusKey: { fontSize: fontSize.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  div: { height: StyleSheet.hairlineWidth },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  toggleSub: { fontSize: fontSize.xs },
  secLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeoutGrid: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  timeoutChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  timeoutChipTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  pinSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  pinSub: { fontSize: fontSize.xs },
  btnSmall: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 },
  btnSmallTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  infoBox: { flexDirection: 'row', gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1, alignItems: 'flex-start' },
  infoTxt: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing[6], gap: spacing[4] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold }
});
