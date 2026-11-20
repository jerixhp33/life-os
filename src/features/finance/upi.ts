import { Linking, Alert } from 'react-native';

export interface UpiPaymentDetails {
  vpa: string; // e.g. merchant@okaxis, 9876543210@paytm
  name?: string;
  amount: number;
  note?: string;
}

export function isValidVpa(vpa: string): boolean {
  if (!vpa || !vpa.includes('@')) return false;
  const parts = vpa.trim().split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

export function buildUpiUrl(details: UpiPaymentDetails): string {
  const cleanVpa = details.vpa.trim();
  const cleanName = (details.name ?? 'Merchant').trim();
  const cleanNote = (details.note ?? 'LifeOS UPI Payment').trim();
  const amtStr = details.amount.toFixed(2);

  return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(cleanName)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
}

export async function launchUpiPayment(details: UpiPaymentDetails): Promise<boolean> {
  const url = buildUpiUrl(details);
  try {
    const supported = await Linking.canOpenURL(url).catch(() => true);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert(
        'No UPI App Found',
        'Please ensure a supported UPI payment application like Google Pay, PhonePe, Paytm, or BHIM is installed on your device.'
      );
      return false;
    }
  } catch (err) {
    Alert.alert(
      'Payment Intent Error',
      'Unable to launch UPI payment app. Please check the UPI ID and try again.'
    );
    return false;
  }
}
