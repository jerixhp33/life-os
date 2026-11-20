import React from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();
  return (
    <Tabs id="main-tabs" screenOptions={{
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        backgroundColor: isDark ? 'rgba(21,21,29,0.98)' : 'rgba(255,255,255,0.98)',
        height: Platform.OS === 'ios' ? 88 : 66,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8
      },
      tabBarActiveTintColor: theme.brand.primary,
      tabBarInactiveTintColor: theme.text.tertiary,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
    }}>
      <Tabs.Screen name="home" options={{ title:'Home', tabBarIcon:({color,size})=><Ionicons name="home-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="calendar" options={{ title:'Calendar', tabBarIcon:({color,size})=><Ionicons name="calendar-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="create" options={{
        title:'',
        tabBarIcon:()=>(<View style={[cS.btn,{backgroundColor:theme.brand.primary}]}><Ionicons name="add" size={28} color="#fff"/></View>),
        tabBarButton:({ ref, ...props }: any)=><Pressable {...props} style={cS.wrap} accessibilityLabel="Create" accessibilityRole="button"/>
      }}/>
      <Tabs.Screen name="goals" options={{ title:'Goals', tabBarIcon:({color,size})=><Ionicons name="flag-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="more" options={{ title:'More', tabBarIcon:({color,size})=><Ionicons name="grid-outline" size={size} color={color as any}/> }}/>
    </Tabs>
  );
}
const cS = StyleSheet.create({ btn:{ width:52, height:52, borderRadius:radius.full, alignItems:'center', justifyContent:'center', marginBottom:8, shadowColor:'#6957E8', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10, elevation:8 }, wrap:{ flex:1, alignItems:'center', justifyContent:'center', paddingBottom:8 } });
