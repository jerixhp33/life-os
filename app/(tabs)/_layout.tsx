import React from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const tabHeight = 58 + bottomPadding;

  return (
    <Tabs id="main-tabs" screenOptions={{
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(168, 220, 244, 0.12)' : 'rgba(10, 36, 56, 0.08)',
        backgroundColor: isDark ? '#0A2438' : 'rgba(255, 255, 255, 0.98)',
        height: tabHeight,
        paddingBottom: bottomPadding,
        paddingTop: 8,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 10
      },
      tabBarActiveTintColor: isDark ? '#A8DCF4' : '#1A5A7F',
      tabBarInactiveTintColor: isDark ? '#6F9DB5' : '#5A6B79',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
    }}>
      <Tabs.Screen name="home" options={{ title:'Home', tabBarIcon:({color,size})=><Ionicons name="home-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="calendar" options={{ title:'Calendar', tabBarIcon:({color,size})=><Ionicons name="calendar-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="create" options={{
        title:'',
        tabBarIcon:()=>(<View style={[cS.btn,{backgroundColor:isDark ? '#1A5A7F' : '#0A2438'}]}><Ionicons name="add" size={28} color="#A8DCF4"/></View>),
        tabBarButton:({ ref, ...props }: any)=><Pressable {...props} style={cS.wrap} accessibilityLabel="Create" accessibilityRole="button"/>
      }}/>
      <Tabs.Screen name="goals" options={{ title:'Goals', tabBarIcon:({color,size})=><Ionicons name="flag-outline" size={size} color={color as any}/> }}/>
      <Tabs.Screen name="more" options={{ title:'More', tabBarIcon:({color,size})=><Ionicons name="grid-outline" size={size} color={color as any}/> }}/>
    </Tabs>
  );
}
const cS = StyleSheet.create({
  btn:{
    width:52,
    height:52,
    borderRadius:radius.full,
    alignItems:'center',
    justifyContent:'center',
    marginBottom: Platform.OS === 'ios' ? 10 : 6,
    shadowColor:'#A8DCF4',
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.35,
    shadowRadius:10,
    elevation:8,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 220, 244, 0.4)'
  },
  wrap:{ flex:1, alignItems:'center', justifyContent:'center', paddingBottom:6 }
});
