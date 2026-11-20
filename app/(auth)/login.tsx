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
import { signInSchema, type SignInFormValues } from '../../src/lib/validation/schemas';
import { useAuthStore } from '../../src/stores/authStore';
export default function LoginScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const signIn=useAuthStore(s=>s.signIn); const isLoading=useAuthStore(s=>s.isLoading);
  const [showPw,setShowPw]=useState(false);
  const { control, handleSubmit, formState:{errors} } = useForm<SignInFormValues>({ resolver:zodResolver(signInSchema), defaultValues:{ email:'', password:'' } });
  const onSubmit=async(v:SignInFormValues)=>{ try { await signIn(v.email,v.password); router.replace('/(tabs)/home'); } catch(e){ Alert.alert('Sign in failed', e instanceof Error?e.message:'Check your credentials and try again.'); } };
  return (
    <ScreenLayout title="Sign in" showBack keyboardAvoid>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}><Text style={[s.headline,{color:theme.text.primary}]}>Good to see you again</Text><Text style={[s.sub,{color:theme.text.secondary}]}>Sign in to continue</Text></View>
        <View style={s.form}>
          <Controller control={control} name="email" render={({field:{onChange,value}})=><Input label="Email" placeholder="alex@example.com" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none"/>}/>
          <Controller control={control} name="password" render={({field:{onChange,value}})=><Input label="Password" value={value} onChangeText={onChange} error={errors.password?.message} secureTextEntry={!showPw} autoCapitalize="none" suffix={<TouchableOpacity onPress={()=>setShowPw(p=>!p)}><Ionicons name={showPw?'eye-off-outline':'eye-outline'} size={20} color={theme.text.tertiary}/></TouchableOpacity>}/>}/>
          <TouchableOpacity onPress={()=>router.push('/(auth)/forgot-password')} style={s.forgot}><Text style={[s.forgotText,{color:theme.brand.primary}]}>Forgot password?</Text></TouchableOpacity>
        </View>
        <Button label="Sign in" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" fullWidth/>
        <View style={s.signupRow}><Text style={{color:theme.text.secondary,fontSize:fontSize.base}}>Don't have an account? </Text><TouchableOpacity onPress={()=>router.push('/(auth)/signup')}><Text style={{color:theme.brand.primary,fontWeight:fontWeight.semibold,fontSize:fontSize.base}}>Sign up</Text></TouchableOpacity></View>
      </ScrollView>
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ container:{padding:spacing[6],gap:spacing[6]}, header:{gap:spacing[1]}, headline:{fontSize:fontSize['2xl'],fontWeight:fontWeight.bold}, sub:{fontSize:fontSize.base}, form:{gap:spacing[4]}, forgot:{alignSelf:'flex-end'}, forgotText:{fontSize:fontSize.sm,fontWeight:fontWeight.medium}, signupRow:{flexDirection:'row',justifyContent:'center',alignItems:'center'} });
