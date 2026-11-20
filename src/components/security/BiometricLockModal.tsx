import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurityStore } from '../../stores/securityStore';
import { authenticateWithBiometrics, verifyMasterPin } from '../../lib/security/biometrics';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../theme/tokens';

export function BiometricLockModal() {
  const { theme } = useTheme();
  const isLocked = useSecurityStore((s) => s.isLocked);
  const isLockEnabled = useSecurityStore((s) => s.isLockEnabled);
  const unlock = useSecurityStore((s) => s.unlock);

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (isLocked && isLockEnabled) {
      setEnteredPin('');
      setPinError(false);
      // Attempt biometric unlock automatically on lock screen display
      authenticateWithBiometrics('Verify your identity to unlock LifeOS').then((ok) => {
        if (ok) unlock();
      });
    }
  }, [isLocked, isLockEnabled, unlock]);

  if (!isLocked || !isLockEnabled) return null;

  const handleDigit = async (digit: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      const isValid = await verifyMasterPin(nextPin);
      if (isValid) {
        unlock();
      } else {
        setPinError(true);
        setTimeout(() => {
          setEnteredPin('');
          setPinError(false);
        }, 800);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((p) => p.slice(0, -1));
    setPinError(false);
  };

  const triggerBiometricAuth = async () => {
    const ok = await authenticateWithBiometrics('Verify your identity to unlock LifeOS');
    if (ok) {
      unlock();
    }
  };

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false}>
      <View style={[styles.container, { backgroundColor: theme.surface.default }]}>
        <View style={styles.topSection}>
          <View style={[styles.shieldBox, { backgroundColor: theme.brand.primaryBg }]}>
            <Ionicons name="shield-checkmark" size={48} color={theme.brand.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text.primary }]}>LifeOS Protected</Text>
          <Text style={[styles.subtitle, { color: theme.text.tertiary }]}>
            Scan fingerprint or enter your Master PIN
          </Text>

          {/* PIN Indicators */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => {
              const isFilled = i < enteredPin.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      borderColor: pinError ? theme.error : theme.brand.primary,
                      backgroundColor: isFilled
                        ? pinError
                          ? theme.error
                          : theme.brand.primary
                        : 'transparent'
                    }
                  ]}
                />
              );
            })}
          </View>
          {pinError && (
            <Text style={[styles.errorTxt, { color: theme.error }]}>Incorrect PIN. Try again.</Text>
          )}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['bio', '0', 'del']
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keyRow}>
              {row.map((item) => {
                if (item === 'bio') {
                  return (
                    <TouchableOpacity
                      key="bio"
                      onPress={triggerBiometricAuth}
                      style={[styles.keyBtn, { backgroundColor: theme.surface.inset }]}
                      accessibilityLabel="Biometric Unlock"
                    >
                      <Ionicons name="finger-print" size={28} color={theme.brand.primary} />
                    </TouchableOpacity>
                  );
                }
                if (item === 'del') {
                  return (
                    <TouchableOpacity
                      key="del"
                      onPress={handleBackspace}
                      style={[styles.keyBtn, { backgroundColor: theme.surface.inset }]}
                      accessibilityLabel="Delete digit"
                    >
                      <Ionicons name="backspace-outline" size={24} color={theme.text.secondary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleDigit(item)}
                    style={[styles.keyBtn, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}
                  >
                    <Text style={[styles.keyDigit, { color: theme.text.primary }]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6]
  },
  topSection: {
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[8]
  },
  shieldBox: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2]
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing[4]
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[6],
    height: 24,
    alignItems: 'center'
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 2
  },
  errorTxt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: spacing[2]
  },
  keypad: {
    gap: spacing[3],
    marginBottom: spacing[6]
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing[4]
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  keyDigit: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold
  }
});
