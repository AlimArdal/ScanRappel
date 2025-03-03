import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const { t } = useLanguage();
  const { theme, isDarkTheme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
        />
        <Text style={[styles.appName, { color: theme.colors.primary }]}>ScanRappel</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
          {t('welcome')}
        </Text>
        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
          Quickly check if products have been recalled by scanning their packaging. Get detailed information, recall status, and nutritional data in seconds.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          onPress={() => router.push({
            pathname: "/(onboarding)/login"
          })}
        >
          {t('login')}
        </Button>
        <Button 
          mode="outlined" 
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          textColor={theme.colors.primary}
          onPress={() => router.push({
            pathname: "/(onboarding)/signup"
          })}
        >
          {t('signup')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: '15%',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: '10%',
  },
  button: {
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 