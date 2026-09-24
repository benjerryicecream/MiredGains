import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import C from '../../constants/colors';

interface ButtonProps extends PressableProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyle = [styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]];

  return (
    <Pressable
      android_ripple={{ color: C.ripple, borderless: false }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        style as any,
        pressed && Platform.OS !== 'android' && styles.pressed,
      ]}
      {...rest}
    >
      {icon && <View style={label ? styles.iconWithLabel : undefined}>{icon}</View>}
      {label && <Text style={textStyle}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.75 },

  // variants
  primary: { backgroundColor: C.emeraldDim },
  secondary: { backgroundColor: C.bgElevated },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: C.dangerBg },

  // sizes
  size_sm: { paddingHorizontal: 12, paddingVertical: 7, gap: 4 },
  size_md: { paddingHorizontal: 16, paddingVertical: 11, gap: 6 },
  size_lg: { paddingHorizontal: 24, paddingVertical: 14, gap: 8 },

  // labels
  label: { fontWeight: '600', letterSpacing: 0.2 },
  label_primary: { color: '#fff' },
  label_secondary: { color: C.textPrimary },
  label_ghost: { color: C.textSecondary },
  label_danger: { color: C.danger },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 16 },

  iconWithLabel: { marginRight: 2 },
});
