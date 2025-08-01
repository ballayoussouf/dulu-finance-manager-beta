import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Layout from '@/constants/Layout';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return disabled
          ? { backgroundColor: colors.gray[300] }
          : { backgroundColor: colors.primary[500] };
      case 'secondary':
        return disabled
          ? { backgroundColor: colors.gray[200] }
          : { backgroundColor: colors.accent[500] };
      case 'outline':
        return disabled
          ? { 
              backgroundColor: colors.transparent,
              borderWidth: 1,
              borderColor: colors.gray[300]
            }
          : { 
              backgroundColor: colors.transparent,
              borderWidth: 1,
              borderColor: colors.primary[500]
            };
      case 'text':
        return { backgroundColor: colors.transparent };
      default:
        return { backgroundColor: colors.primary[500] };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: colors.white };
      case 'secondary':
        return { color: colors.white };
      case 'outline':
        return disabled
          ? { color: colors.gray[400] }
          : { color: colors.primary[500] };
      case 'text':
        return disabled
          ? { color: colors.gray[400] }
          : { color: colors.primary[500] };
      default:
        return { color: colors.white };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Layout.spacing.xs,
          paddingHorizontal: Layout.spacing.m,
        };
      case 'medium':
        return {
          paddingVertical: Layout.spacing.s,
          paddingHorizontal: Layout.spacing.l,
        };
      case 'large':
        return {
          paddingVertical: Layout.spacing.m,
          paddingHorizontal: Layout.spacing.xl,
        };
      default:
        return {
          paddingVertical: Layout.spacing.s,
          paddingHorizontal: Layout.spacing.l,
        };
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'medium':
        return { fontSize: 16 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary[500] : colors.white}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[
            styles.text,
            getTextStyle(),
            getTextSizeStyle(),
            textStyle
          ]}>
            {typeof title === 'string' ? title : ''}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  button: {
    borderRadius: Layout.borderRadius.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});