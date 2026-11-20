import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, type Theme } from './tokens';
type ThemeMode = 'light'|'dark'|'system';
interface ThemeContextValue { theme: Theme; mode: ThemeMode; isDark: boolean; setMode:(m:ThemeMode)=>Promise<void>; }
const ThemeContext = createContext<ThemeContextValue|null>(null);
const KEY = '@lifeos/theme';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => { if (v==='light'||v==='dark'||v==='system') setModeState(v); }).catch(()=>{});
  }, []);
  const setMode = useCallback(async (m: ThemeMode) => {
    setModeState(m);
    await AsyncStorage.setItem(KEY, m).catch(()=>{});
  }, []);
  const isDark = mode==='dark' || (mode==='system' && sys==='dark');
  return <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, mode, isDark, setMode }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
