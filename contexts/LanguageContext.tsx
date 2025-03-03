import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the available languages
export type Language = 'en' | 'fr';

// English translations
const en = {
  welcome: 'Welcome to ScanRappel',
  login: 'Login',
  signup: 'Sign Up',
  email: 'Email',
  password: 'Password',
  enterEmail: 'Enter your email',
  enterPassword: 'Enter your password',
  scanProduct: 'Scan Product',
  takePhoto: 'Take Photo',
  chooseFromGallery: 'Choose from Gallery',
  settings: 'Settings',
  logout: 'Logout',
  theme: 'Theme',
  language: 'Language',
  darkMode: 'Dark Mode',
  account: 'Account',
  scanHistory: 'Scan History',
  productDetails: 'Product Details',
  recalled: 'RECALLED',
  notRecalled: 'Not Recalled',
  nutritionalInfo: 'Nutritional Information',
  calories: 'Calories',
  fats: 'Fats',
  carbs: 'Carbohydrates',
  proteins: 'Proteins',
  recallReason: 'Recall Reason',
  recallDate: 'Recall Date',
  manufacturer: 'Manufacturer',
  lotNumber: 'Lot Number',
  search: 'Search',
  noResults: 'No results found',
  error: 'An error occurred',
  retry: 'Retry',
};

// French translations
const fr = {
  welcome: 'Bienvenue à ScanRappel',
  login: 'Connexion',
  signup: 'Inscription',
  email: 'Courriel',
  password: 'Mot de passe',
  enterEmail: 'Entrez votre courriel',
  enterPassword: 'Entrez votre mot de passe',
  scanProduct: 'Scanner le produit',
  takePhoto: 'Prendre une photo',
  chooseFromGallery: 'Choisir dans la galerie',
  settings: 'Paramètres',
  logout: 'Déconnexion',
  theme: 'Thème',
  language: 'Langue',
  darkMode: 'Mode sombre',
  account: 'Compte',
  scanHistory: 'Historique des analyses',
  productDetails: 'Détails du produit',
  recalled: 'RAPPELÉ',
  notRecalled: 'Non rappelé',
  nutritionalInfo: 'Informations nutritionnelles',
  calories: 'Calories',
  fats: 'Matières grasses',
  carbs: 'Glucides',
  proteins: 'Protéines',
  recallReason: 'Motif du rappel',
  recallDate: 'Date du rappel',
  manufacturer: 'Fabricant',
  lotNumber: 'Numéro de lot',
  search: 'Rechercher',
  noResults: 'Aucun résultat trouvé',
  error: 'Une erreur est survenue',
  retry: 'Réessayer',
};

// Create translations object with all languages
const translations = {
  en,
  fr,
};

// Define the shape of the context
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof en) => string;
}

// Create the context with default values
export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

// Props interface for the provider component
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference from AsyncStorage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Function to set language and save to AsyncStorage
  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translate function
  const t = (key: keyof typeof en): string => {
    return translations[language][key] || key;
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 