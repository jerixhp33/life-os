import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const MASTER_PIN_KEY = 'lifeos_master_pin';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export async function checkBiometricSupport(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { hasHardware, isEnrolled, supportedTypes };
  } catch {
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
}

export async function authenticateWithBiometrics(reason = 'Unlock LifeOS'): Promise<boolean> {
  try {
    const status = await checkBiometricSupport();
    if (!status.hasHardware || !status.isEnrolled) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Master PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function getMasterPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(MASTER_PIN_KEY);
  } catch {
    return null;
  }
}

export async function setMasterPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(MASTER_PIN_KEY, pin);
}

export async function clearMasterPin(): Promise<void> {
  await SecureStore.deleteItemAsync(MASTER_PIN_KEY);
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  const saved = await getMasterPin();
  if (!saved) return false;
  return saved === pin;
}
