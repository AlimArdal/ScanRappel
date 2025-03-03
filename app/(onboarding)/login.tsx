import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { FirebaseError } from 'firebase/app';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { theme, isDarkTheme } = useTheme();
  const { login, error: authError, setError: setAuthError, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper function to get a user-friendly error message
  const getErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Invalid password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return `Login error: ${error.message}`;
    }
  };

  // Function to force navigation to tabs
  const forceNavigateToTabs = () => {
    try {
      console.log('🚀 Forcing navigation to tabs from login screen');
      
      if (Platform.OS === 'web') {
        window.location.href = '/(tabs)';
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('💥 Navigation error:', error);
      
      // Extreme fallback - try one more method
      setTimeout(() => {
        try {
          router.navigate('/(tabs)');
        } catch (e) {
          console.error('💥 Final navigation attempt failed:', e);
          Alert.alert(
            'Navigation Error',
            'Unable to navigate to home screen. Please restart the app.',
            [{ text: 'OK' }]
          );
        }
      }, 500);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setAuthError(null); // Clear previous errors
    
    try {
      console.log(`Attempting login with email: ${email.trim()}`);
      const result = await login(email.trim(), password);
      console.log('Login successful, navigating to tabs...');
      
      // Use a timeout to ensure auth state has updated
      setTimeout(() => {
        if (result && result.user) {
          forceNavigateToTabs();
        }
      }, 500);
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof FirebaseError) {
        const message = getErrorMessage(error);
        setAuthError(message);
        console.log('Firebase auth error code:', error.code);
      } else {
        setAuthError('An unknown error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    try {
      router.push('/(onboarding)/signup');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>ScanRappel</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.loginText, { color: theme.colors.text }]}>{t('login')}</Text>
          
          {authError && (
            <Text style={styles.errorText}>
              {authError}
            </Text>
          )}

          <TextInput
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            loading={isLoading}
            disabled={isLoading || !email || !password}
          >
            {t('login')}
          </Button>

          <View style={styles.signupContainer}>
            <Text style={{ color: theme.colors.text }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {t('signup')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 