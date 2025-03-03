import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, Platform } from 'react-native';
import { List, Switch, Divider, Button } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Language } from '../../contexts/LanguageContext';
import { ThemeType } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { themeType, setThemeType, isDarkTheme, theme } = useTheme();
  const { user, logout } = useAuth();

  // Function to force navigation to login screen
  const navigateToLogin = () => {
    try {
      console.log('🚀 Navigating to login screen after logout');
      
      // Add a slight delay to ensure logout is complete
      setTimeout(() => {
        try {
          if (Platform.OS === 'web') {
            window.location.href = '/(onboarding)/login';
          } else {
            router.replace('/(onboarding)/login');
          }
        } catch (error) {
          console.error('💥 Navigation error:', error);
          
          // Try alternative navigation methods if the first one fails
          try {
            router.navigate('/(onboarding)/login');
          } catch (e) {
            console.error('💥 Final navigation attempt failed:', e);
            Alert.alert(
              'Navigation Error',
              'Unable to navigate to login screen. Please restart the app.',
              [{ text: 'OK' }]
            );
          }
        }
      }, 300);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out user');
      await logout();
      console.log('✅ Logout successful, navigating to login screen');
      
      // Navigate to login screen after successful logout
      navigateToLogin();
    } catch (error) {
      console.error('❌ Logout failed:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setThemeType(newTheme);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <ScrollView>
        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>{t('language')}</List.Subheader>
          <List.Item
            title="English"
            titleStyle={{ color: theme.colors.text }}
            right={() => (
              <Switch
                value={language === 'en'}
                onValueChange={() => handleLanguageChange('en')}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Français"
            titleStyle={{ color: theme.colors.text }}
            right={() => (
              <Switch
                value={language === 'fr'}
                onValueChange={() => handleLanguageChange('fr')}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>{t('theme')}</List.Subheader>
          <List.Item
            title="Light"
            titleStyle={{ color: theme.colors.text }}
            right={() => (
              <Switch
                value={themeType === 'light'}
                onValueChange={() => handleThemeChange('light')}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Dark"
            titleStyle={{ color: theme.colors.text }}
            right={() => (
              <Switch
                value={themeType === 'dark'}
                onValueChange={() => handleThemeChange('dark')}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="System"
            titleStyle={{ color: theme.colors.text }}
            right={() => (
              <Switch
                value={themeType === 'system'}
                onValueChange={() => handleThemeChange('system')}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader style={{ color: theme.colors.text }}>{t('account')}</List.Subheader>
          {user ? (
            <>
              <List.Item
                title={user.email || 'User'}
                titleStyle={{ color: theme.colors.text }}
                description="Logged in"
                descriptionStyle={{ color: theme.colors.text }}
                left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
              />
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleLogout}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  {t('logout')}
                </Button>
              </View>
            </>
          ) : (
            <View style={styles.notLoggedInContainer}>
              <Text style={{ color: theme.colors.text, marginBottom: 20 }}>
                You are not logged in
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  console.log('🚀 Navigating to login from settings');
                  router.push('/(onboarding)/login');
                }}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {t('login')}
              </Button>
            </View>
          )}
        </List.Section>

        <View style={styles.appInfoContainer}>
          <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
            ScanRappel v1.0.0
          </Text>
          <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 5 }}>
            © 2023 ScanRappel Team
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
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
  notLoggedInContainer: {
    padding: 16,
    alignItems: 'center',
  },
  appInfoContainer: {
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
  },
}); 