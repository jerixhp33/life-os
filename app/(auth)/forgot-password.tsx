import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { spacing, fontSize, fontWeight } from '../../src/theme/tokens';
import { resetPasswordSchema } from '../../src/lib/validation/schemas';
import { useAuthStore } from '../../src/stores/authStore';
export default function ForgotPasswordScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const resetPassword=useAuthStore(s=>s.resetPassword); const isLoading=useAuthStore(s=>s.isLoading);
  const { control, handleSubmit, formState:{errors} } = useForm({ resolver:zodResolver(resetPasswordSchema), defaultValues:{ email:'' } });
  const onSubmit=async({ email }: { email:string })=>{ try { await resetPassword(email); Alert.alert('Email sent','Check your inbox for a password reset link.',[ { text:'OK', onPress:()=>router.back() } ]); } catch(e){ Alert.alert('Error',e instanceof Error?e.message:'Could not send reset email.'); } };
  return (
    <ScreenLayout title="Reset password" showBack keyboardAvoid>
      <View style={s.container}>
        <Text style={[s.desc,{color:theme.text.secondary}]}>Enter your email address and we'll send you a link to reset your password.</Text>
        <Controller control={control} name="email" render={({field:{onChange,value}})=><Input label="Email" placeholder="alex@example.com" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none"/>}/>
        <Button label="Send reset link" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" fullWidth/>
      </View>
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ container:{padding:spacing[6],gap:spacing[5]}, desc:{fontSize:fontSize.base,lineHeight:22} });
