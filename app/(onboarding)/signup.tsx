import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { FirebaseError } from 'firebase/app';

export default function SignupScreen() {
  const { t } = useLanguage();
  const { theme, isDarkTheme } = useTheme();
  const { signup, error: authError, setError: setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Helper function to get a user-friendly error message
  const getErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please try a different email or log in.';
      case 'auth/invalid-email':
        return 'The email address is not valid. Please check and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return `Signup error: ${error.message}`;
    }
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Function to force navigation to tabs
  const forceNavigateToTabs = () => {
    try {
      console.log('🚀 Forcing navigation to tabs from signup screen');
      
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

  const navigateToLogin = () => {
    try {
      router.push('/(onboarding)/login');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleSignup = async () => {
    // Validation logic
    if (!email || !password || !confirmPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      console.log(`Creating new account for: ${email.trim()}`);
      const result = await signup(email.trim(), password);
      console.log('Signup successful, navigating to tabs...');
      
      // Use a timeout to ensure auth state has updated
      setTimeout(() => {
        if (result && result.user) {
          forceNavigateToTabs();
        }
      }, 500);
    } catch (error) {
      console.error('Signup failed:', error);
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
          <Text style={[styles.signupText, { color: theme.colors.text }]}>{t('signup')}</Text>
          
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
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
            }}
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
            error={!!passwordError}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
            error={!!passwordError}
          />

          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSignup}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            loading={isLoading}
            disabled={isLoading || !email || !password || !confirmPassword}
          >
            {t('signup')}
          </Button>

          <View style={styles.loginContainer}>
            <Text style={{ color: theme.colors.text }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {t('login')}
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
  signupText: {
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
  loginContainer: {
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