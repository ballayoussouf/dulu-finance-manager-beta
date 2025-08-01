import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Layout from '@/constants/Layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export default function Card({
  children,
  style,
  variant = 'elevated',
}: CardProps) {
  const { colors } = useTheme();

  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.white,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'outlined':
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.gray[200],
        };
      case 'filled':
        return {
          backgroundColor: colors.gray[100],
        };
      default:
        return {
          backgroundColor: colors.white,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        };
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[
      styles.card,
      getCardStyle(),
      style
    ]}>
      {children}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
  },
});