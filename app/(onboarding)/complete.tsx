import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Check } from 'lucide-react-native';

export default function OnboardingCompleteScreen() {
  const { user } = useAuth();
  const { needsPayment, plan } = useLocalSearchParams();
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = () => {
    if (needsPayment === 'true') {
      // Rediriger vers la page de solde initial, qui redirigera ensuite vers le paiement
      router.push({
        pathname: '/initial-balance',
        params: { 
          plan,
          needsPayment: 'true'
        }
      });
    } else {
      router.push({
        pathname: '/initial-balance',
        params: { 
          plan,
          needsPayment: 'false'
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.checkCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Check size={60} color={Colors.white} />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: opacityAnim,
              transform: [
                {
                  translateY: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Tout est prêt !</Text>
          <Text style={styles.description}>
            Votre gestionnaire financier DULU est maintenant prêt à vous aider à gérer vos finances en toute simplicité.
            Commencez par ajouter votre première transaction ou explorez le tableau de bord.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button title="Commencer à gérer vos finances" onPress={handleFinish} size="large" />
        
        <View style={styles.stepsIndicator}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.activeStepDot]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Layout.spacing.m,
  },
  footer: {
    marginTop: Layout.spacing.xl,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.l,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Layout.spacing.xs,
  },
  activeStepDot: {
    backgroundColor: Colors.primary[500],
    width: 24,
    borderRadius: 4,
  },
});