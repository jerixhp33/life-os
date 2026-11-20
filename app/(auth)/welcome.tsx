import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { Button } from '../../src/components/ui/Button';

const FEATURES = [
  { icon: 'checkbox-outline' as const, t: 'Tasks & planning' },
  { icon: 'calendar-outline' as const, t: 'Calendar & events' },
  { icon: 'wallet-outline' as const, t: 'Finance tracking' },
  { icon: 'flag-outline' as const, t: 'Goals & habits' }
];

export default function WelcomeScreen() {
  const { theme } = useTheme(); const router = useRouter();
  return (
    <SafeAreaView style={[s.safe,{backgroundColor:theme.bg.primary}]} edges={['top','left','right','bottom']}>
      <View style={s.container}>
        <View style={s.hero}>
          <LinearGradient colors={['#6957E8','#B8A8FF']} style={s.logoMark}>
            <Ionicons name="flash" size={32} color="#ffffff" />
          </LinearGradient>
          <Text style={[s.appName,{color:theme.text.primary}]}>LifeOS</Text>
          <Text style={[s.tagline,{color:theme.text.secondary}]}>One app. Your whole life.</Text>
        </View>
        <View style={s.features}>
          {FEATURES.map(f => (
            <View key={f.t} style={[s.feature,{backgroundColor:theme.surface.default,borderColor:theme.border.subtle}]}>
              <Ionicons name={f.icon} size={22} color={theme.brand.primary} />
              <Text style={[s.featureText,{color:theme.text.primary}]}>{f.t}</Text>
            </View>
          ))}
        </View>
        <View style={s.cta}>
          <Button label="Get started — it's free" onPress={()=>router.push('/(auth)/signup')} variant="primary" size="lg" fullWidth/>
          <TouchableOpacity onPress={()=>router.push('/(auth)/login')} style={s.signInBtn}>
            <Text style={[s.signInText,{color:theme.text.secondary}]}>Already have an account? <Text style={{color:theme.brand.primary,fontWeight:fontWeight.semibold}}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({ safe:{flex:1}, container:{flex:1,justifyContent:'space-between',padding:spacing[6]}, hero:{alignItems:'center',paddingTop:spacing[12],gap:spacing[3]}, logoMark:{width:72,height:72,borderRadius:radius.xl,alignItems:'center',justifyContent:'center'}, appName:{fontSize:fontSize['4xl'],fontWeight:fontWeight.bold}, tagline:{fontSize:fontSize.lg}, features:{flexDirection:'row',flexWrap:'wrap',gap:spacing[3]}, feature:{width:'47%',padding:spacing[4],borderRadius:radius.lg,borderWidth:1,flexDirection:'row',alignItems:'center',gap:spacing[3]}, featureText:{fontSize:fontSize.sm,fontWeight:fontWeight.medium,flex:1}, cta:{gap:spacing[3],paddingBottom:spacing[4]}, signInBtn:{alignItems:'center',paddingVertical:spacing[2]}, signInText:{fontSize:fontSize.base} });
