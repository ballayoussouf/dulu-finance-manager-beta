import Colors from './Colors';
import Layout from './Layout';
import { StyleSheet } from 'react-native';

export const theme = {
  colors: Colors,
  spacing: Layout.spacing,
  borderRadius: Layout.borderRadius,
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: Layout.spacing.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  text: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  button: {
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.m,
    fontSize: 16,
    color: Colors.gray[800],
  },
  inputFocused: {
    borderColor: Colors.primary[500],
  },
});