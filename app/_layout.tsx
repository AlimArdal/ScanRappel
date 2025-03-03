import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';

// Layout wrapper with theme
const ThemedLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            // Make sure animations are working
            animation: 'slide_from_right',
          }}
        >
          {children}
        </Stack>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

// Root layout with all providers
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ThemedLayout>
            <Stack.Screen 
              name="index" 
              options={{ 
                headerShown: false,
                // Animation none for the index redirect screen
                animation: 'none',
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="(onboarding)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="test-config" 
              options={{ 
                headerShown: true,
                title: "Config Test" 
              }} 
            />
          </ThemedLayout>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
