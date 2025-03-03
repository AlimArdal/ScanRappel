import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function OnboardingLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    />
  );
} 