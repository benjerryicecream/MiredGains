import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import C from '../../constants/colors';

interface StyledInputProps extends TextInputProps {
  label?: string;
}

export default function StyledInput({ label, style, ...rest }: StyledInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        placeholderTextColor={C.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: C.textPrimary,
    fontSize: 15,
  },
});
