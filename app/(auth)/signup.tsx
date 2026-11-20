import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { spacing, fontSize, fontWeight } from '../../src/theme/tokens';
import { signUpSchema, type SignUpFormValues } from '../../src/lib/validation/schemas';
import { useAuthStore } from '../../src/stores/authStore';
export default function SignUpScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const signUp=useAuthStore(s=>s.signUp); const isLoading=useAuthStore(s=>s.isLoading);
  const [showPw,setShowPw]=useState(false);
  const { control, handleSubmit, formState:{errors} } = useForm<SignUpFormValues>({ resolver:zodResolver(signUpSchema), defaultValues:{ full_name:'', email:'', password:'', confirm_password:'' } });
  const onSubmit=async(v:SignUpFormValues)=>{ try { await signUp(v.email,v.password,v.full_name); router.replace('/(tabs)/home'); } catch(e){ Alert.alert('Sign up failed', e instanceof Error?e.message:'Please try again.'); } };
  return (
    <ScreenLayout title="Create account" showBack keyboardAvoid>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}><Text style={[s.headline,{color:theme.text.primary}]}>Welcome to LifeOS</Text><Text style={[s.sub,{color:theme.text.secondary}]}>Create your free account to get started</Text></View>
        <View style={s.form}>
          <Controller control={control} name="full_name" render={({field:{onChange,value}})=><Input label="Full name" placeholder="Alex Johnson" value={value} onChangeText={onChange} error={errors.full_name?.message} autoCapitalize="words" required/>}/>
          <Controller control={control} name="email" render={({field:{onChange,value}})=><Input label="Email" placeholder="alex@example.com" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" required/>}/>
          <Controller control={control} name="password" render={({field:{onChange,value}})=><Input label="Password" placeholder="At least 8 characters" value={value} onChangeText={onChange} error={errors.password?.message} secureTextEntry={!showPw} autoCapitalize="none" required suffix={<TouchableOpacity onPress={()=>setShowPw(p=>!p)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={20} color={theme.text.tertiary}/></TouchableOpacity>}/>}/>
          <Controller control={control} name="confirm_password" render={({field:{onChange,value}})=><Input label="Confirm password" value={value} onChangeText={onChange} error={errors.confirm_password?.message} secureTextEntry={!showPw} autoCapitalize="none" required/>}/>
        </View>
        <View style={s.actions}>
          <Button label="Create account" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" fullWidth/>
          <Text style={[s.legal,{color:theme.text.tertiary}]}>By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ container:{padding:spacing[6],gap:spacing[6]}, header:{gap:spacing[1]}, headline:{fontSize:fontSize['2xl'],fontWeight:fontWeight.bold}, sub:{fontSize:fontSize.base}, form:{gap:spacing[4]}, actions:{gap:spacing[4]}, legal:{fontSize:fontSize.xs,textAlign:'center',lineHeight:18} });
