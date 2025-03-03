import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

/**
 * Enhanced auth persistence handler for React Native
 * Addresses the warning about missing AsyncStorage implementation
 */

// Storage keys
const AUTH_USER_KEY = 'auth_user_data';
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Manually store user data in AsyncStorage
 * Used to supplement Firebase Auth in React Native environments
 */
export const storeUserData = async (user: User | null): Promise<void> => {
  try {
    if (user) {
      // Store minimal user data needed for auth checks
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        metadata: user.metadata,
      };
      
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      
      // Store token if available
      if (user.refreshToken) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, user.refreshToken);
      }
      
      console.log('✅ User data stored in AsyncStorage');
    } else {
      // Clear stored data on logout
      await clearAuthData();
      console.log('✅ User data cleared from AsyncStorage');
    }
  } catch (error) {
    console.error('❌ Error storing user data:', error);
  }
};

/**
 * Get stored user data from AsyncStorage
 */
export const getStoredUserData = async (): Promise<any> => {
  try {
    const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Error retrieving user data:', error);
    return null;
  }
};

/**
 * Clear all auth-related data from AsyncStorage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
    console.log('✅ Auth data cleared from AsyncStorage');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

// Legacy compatibility exports for backward compatibility
export const getUserFromStorage = getStoredUserData;