import React, { useState } from 'react';
import { View, TextInput as RNInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, fontSize, fontWeight } from '../../theme/tokens';
interface Props extends Omit<React.ComponentProps<typeof RNInput>,'style'> { label?:string; error?:string; hint?:string; prefix?:React.ReactNode; suffix?:React.ReactNode; containerStyle?:object; required?:boolean; showClearButton?:boolean; }
export function Input({ label, error, hint, prefix, suffix, containerStyle, required, showClearButton, onChangeText, value, ...rest }: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.error : focused ? theme.border.focus : theme.border.default;
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <View style={styles.labelRow}><Text style={[styles.label,{color:theme.text.secondary}]}>{label}</Text>{required&&<Text style={{color:theme.error}}> *</Text>}</View>}
      <View style={[styles.wrap, { borderColor, backgroundColor: focused ? theme.surface.default : theme.surface.inset }]}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <RNInput value={value} onChangeText={onChangeText} style={[styles.input,{color:theme.text.primary},prefix&&styles.withPrefix]} placeholderTextColor={theme.text.placeholder} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} accessibilityLabel={label} {...rest}/>
        {showClearButton&&value ? <TouchableOpacity onPress={()=>onChangeText?.('')} style={styles.suffix}><Ionicons name="close-circle" size={18} color={theme.text.tertiary}/></TouchableOpacity> : suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? <View style={styles.fbRow}><Ionicons name="alert-circle-outline" size={14} color={theme.error}/><Text style={[styles.fbText,{color:theme.error}]}> {error}</Text></View>
              : hint ? <Text style={[styles.fbText,{color:theme.text.tertiary}]}>{hint}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({ container:{gap:spacing[1]}, labelRow:{flexDirection:'row',alignItems:'center'}, label:{fontSize:fontSize.sm,fontWeight:fontWeight.medium}, wrap:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:radius.md,minHeight:48}, input:{flex:1,fontSize:fontSize.base,paddingHorizontal:spacing[3],paddingVertical:spacing[3],minHeight:48}, withPrefix:{paddingLeft:spacing[1]}, prefix:{paddingLeft:spacing[3]}, suffix:{paddingRight:spacing[3]}, fbRow:{flexDirection:'row',alignItems:'center',marginTop:spacing[1]}, fbText:{fontSize:fontSize.xs} });
