import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform, Text, Button } from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

// This component acts as a router based on auth state
export default function Index() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [navAttempted, setNavAttempted] = useState(false);
  
  // More explicit navigation using useEffect with a direct router call
  useEffect(() => {
    if (!isLoading) {
      console.log('🧭 Navigation effect triggered', { 
        hasUser: !!user, 
        isLoading, 
        userEmail: user?.email,
        navAttempted
      });
      
      // Using a timeout to ensure this happens after render
      if (!navAttempted) {
        setNavAttempted(true);
        const destination = user ? '/(tabs)' : '/(onboarding)/welcome';
        
        setTimeout(() => {
          try {
            console.log(`🚀 Attempting navigation to: ${destination}`);
            router.replace(destination);
          } catch (error) {
            console.error('⚠️ Router navigation failed:', error);
            
            // Fallback for web
            if (Platform.OS === 'web') {
              try {
                console.log('💥 Forcing navigation via window.location');
                window.location.href = destination;
              } catch (e) {
                console.error('⚠️ Window location navigation failed:', e);
              }
            }
          }
        }, 300);
      }
    }
  }, [user, isLoading, navAttempted]);

  // Manual navigation option if automatic fails
  const navigateManually = () => {
    try {
      const destination = user ? '/(tabs)' : '/(onboarding)/welcome';
      console.log(`🔄 Manual navigation to: ${destination}`);
      router.replace(destination);
    } catch (error) {
      console.error('Manual navigation failed:', error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 20,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      
      {!isLoading && navAttempted && (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text, marginBottom: 10, textAlign: 'center' }}>
            {user 
              ? "You're logged in! If you're not automatically redirected, please tap below:"
              : "Welcome! If you're not automatically redirected, please tap below:"}
          </Text>
          
          <Button
            title={user ? "Go to Home" : "Go to Login"}
            onPress={navigateManually}
            color={theme.colors.primary}
          />
          
          {user && (
            <Link href="/(tabs)" style={{ marginTop: 15, color: theme.colors.primary }}>
              Direct Link to Home
            </Link>
          )}
          
          {!user && (
            <Link href="/(onboarding)/welcome" style={{ marginTop: 15, color: theme.colors.primary }}>
              Direct Link to Welcome
            </Link>
          )}
        </View>
      )}
    </View>
  );
}
