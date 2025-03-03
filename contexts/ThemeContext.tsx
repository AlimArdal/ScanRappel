import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme, configureFonts } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

// Adapt the navigation theme to react-native-paper
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Define custom colors
const customColors = {
  primary: '#007AFF',
  secondary: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  accent: '#5856D6',
  text: '#000000',
};

// Configure fonts with proper variants for MD3
const fontConfig = {
  fontFamily: 'System',
  fonts: {
    displayLarge: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    displayMedium: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    displaySmall: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    headlineLarge: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    headlineMedium: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    headlineSmall: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    titleLarge: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    titleMedium: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    titleSmall: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: 'regular',
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: 'regular',
    },
    bodySmall: {
      fontFamily: 'System',
      fontWeight: 'regular',
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    labelMedium: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    labelSmall: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
  },
};

// Create custom light theme
const CustomLightTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: customColors.primary,
    secondary: customColors.secondary,
    error: customColors.error,
    background: customColors.background,
    surface: customColors.surface,
    accent: customColors.accent,
  },
  fonts: configureFonts({config: fontConfig}),
};

// Create custom dark theme
const CustomDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: '#0A84FF',
    secondary: '#FF9F0A',
    error: '#FF453A',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    accent: '#5E5CE6',
    text: '#FFFFFF',
  },
  fonts: configureFonts({config: fontConfig}),
};

// Theme type
export type ThemeType = 'light' | 'dark' | 'system';

// Theme context type
interface ThemeContextType {
  themeType: ThemeType;
  setThemeType: (theme: ThemeType) => void;
  theme: typeof CustomLightTheme | typeof CustomDarkTheme;
  isDarkTheme: boolean;
}

// Create the context with default values
export const ThemeContext = createContext<ThemeContextType>({
  themeType: 'system',
  setThemeType: () => {},
  theme: CustomLightTheme,
  isDarkTheme: false,
});

// Props for the provider component
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeType, setThemeTypeState] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeTypeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Function to set theme and save to AsyncStorage
  const setThemeType = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeTypeState(newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine current theme based on theme type and system preference
  const isDarkTheme = 
    themeType === 'system' 
      ? colorScheme === 'dark'
      : themeType === 'dark';

  const theme = isDarkTheme ? CustomDarkTheme : CustomLightTheme;

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ themeType, setThemeType, theme, isDarkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 