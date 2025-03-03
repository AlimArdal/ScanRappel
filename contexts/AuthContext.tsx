import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { Platform } from 'react-native';
import { clearAuthData, storeUserData, getStoredUserData } from '../services/authPersistence';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  signup: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  error: null,
  setError: () => {},
});

// Props interface for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes and handle persistence
  useEffect(() => {
    let isMounted = true;

    // First try to load user from AsyncStorage on startup
    const loadStoredUser = async () => {
      try {
        const storedUser = await getStoredUserData();
        if (storedUser && !user && isMounted) {
          console.log('🔄 Using stored user data until Firebase auth initializes');
          setUser(storedUser as unknown as User);
        }
      } catch (error) {
        console.error('❌ Error loading stored user:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // On mobile, try to restore from AsyncStorage first
    if (Platform.OS !== 'web') {
      loadStoredUser();
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      console.log('🔔 Auth state changed:', currentUser ? 'Logged in' : 'Logged out');
      
      // Update our state
      setUser(currentUser);
      
      // On mobile, store the user in AsyncStorage for persistence
      if (Platform.OS !== 'web') {
        await storeUserData(currentUser);
      }
      
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      console.log('🔐 Logging in with Firebase Auth using:', email);
      
      // Verify auth is initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      // Attempt login with Firebase
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful for user:', result.user.uid);
      
      // On mobile, explicitly store user data after login
      if (Platform.OS !== 'web' && result.user) {
        await storeUserData(result.user);
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || 'Login failed';
      const errorCode = (authError as any).code || 'unknown'; // Firebase errors have a code property
      
      console.error('❌ Login error:', errorCode, errorMessage);
      setError(errorMessage);
      throw error;
    }
  };

  // Signup function
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      console.log('📝 Creating new account with Firebase Auth');
      
      // Verify auth is initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Signup successful for user:', result.user.uid);
      
      // On mobile, explicitly store user data after signup
      if (Platform.OS !== 'web' && result.user) {
        await storeUserData(result.user);
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || 'Signup failed';
      const errorCode = (authError as any).code || 'unknown';
      
      console.error('❌ Signup error:', errorCode, errorMessage);
      setError(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setError(null);
      console.log('🚪 Logging out user');
      
      // Verify auth is initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      await signOut(auth);
      
      // Clear stored data from AsyncStorage
      await clearAuthData();
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || 'Logout failed';
      console.error('❌ Logout error:', authError);
      setError(errorMessage);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}; 