import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Layout from '@/constants/Layout';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  rightIcon,
  leftIcon,
  containerStyle,
  inputStyle,
  editable = true,
  onFocus,
  onBlur,
}: TextInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && typeof label === 'string' && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <RNTextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {typeof error === 'string' && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.m,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: Layout.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: Layout.borderRadius.medium,
    backgroundColor: colors.white,
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
  },
  inputContainerError: {
    borderColor: colors.error[500],
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: Layout.spacing.m,
    fontSize: 16,
    color: colors.gray[800],
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIconContainer: {
    paddingLeft: Layout.spacing.m,
  },
  rightIconContainer: {
    paddingRight: Layout.spacing.m,
  },
  errorText: {
    color: colors.error[500],
    fontSize: 12,
    marginTop: Layout.spacing.xs,
  },
  toggleText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
});