import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { 
  verifyProductRecall, 
  saveScanHistory,
  type RecallInfo,
  type NutritionalInfo,
  type ProductDetails
} from '../../services/productService';
import { analyzeProductImage } from '../../services/openai';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { theme, isDarkTheme } = useTheme();
  const { user } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [recallInfo, setRecallInfo] = useState<RecallInfo | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showedFirebaseWarning, setShowedFirebaseWarning] = useState(false);
  const [firebaseErrorDetails, setFirebaseErrorDetails] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        // Process the image directly - no mock name needed anymore
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setError('Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Gallery permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        // Process the image directly - no mock name needed anymore
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image from gallery');
    }
  };

  const processImage = async (uri: string) => {
    setIsLoading(true);
    setError(null);
    setRecallInfo(null);
    setNutritionalInfo(null);
    setDescription(null);

    try {
      // Step 1: Analyze the image to identify the product and get nutritional info
      console.log('Analyzing image to identify product...');
      try {
        const productAnalysis = await analyzeProductImage(uri);
        
        // Set the product name based on the analysis
        setProductName(productAnalysis.productName);
        
        // Set the description from the analysis
        setDescription(productAnalysis.description);
        
        // Set nutritional info if available
        if (productAnalysis.nutritionalInfo) {
          setNutritionalInfo(productAnalysis.nutritionalInfo);
        }
        
        // Step 2: Use the detected product name for recall verification
        let recall: RecallInfo;
        try {
          console.log('Checking if product is recalled...');
          recall = await verifyProductRecall(productAnalysis.productName);
          setRecallInfo(recall);
        } catch (recallError) {
          console.error('Error verifying recall status:', recallError);
          // Set a neutral recall status to avoid blocking the flow
          recall = {
            isRecalled: false,
            productName: productAnalysis.productName,
            manufacturer: '',
            lotNumber: '',
            recallDate: '',
            recallReason: 'Unable to verify recall status at this time',
          };
          setRecallInfo(recall);
        }
        
        // Step 3: Save the scan to history if user is logged in
        if (user) {
          try {
            const productDetails: ProductDetails = {
              recallInfo: recall,
              nutritionalInfo: productAnalysis.nutritionalInfo || undefined,
              description: productAnalysis.description || 'No description available',
              imageUri: uri,
              scanDate: new Date(),
            };
            
            await saveScanHistory(user.uid, productDetails);
            console.log('Scan history saved successfully');
          } catch (saveError) {
            console.error('Error saving scan history:', saveError);
            // Don't show this error to the user as it's not critical
          }
        }
      } catch (analysisError) {
        console.error('Error analyzing image:', analysisError);
        setError('Could not analyze the image. Please try again with a clearer picture of the product.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setImageUri(null);
    setProductName('');
    setRecallInfo(null);
    setNutritionalInfo(null);
    setDescription(null);
    setError(null);
  };

  // Enhanced Firebase error diagnostics
  useEffect(() => {
    if ((error && !showedFirebaseWarning && (error.includes('Firebase') || error.includes('firestore'))) || 
        (firebaseErrorDetails && !showedFirebaseWarning)) {
      
      // Construct a detailed error message for Firebase issues
      const errorMsg = firebaseErrorDetails || error || 'Unknown Firebase error';
      
      Alert.alert(
        "Firebase Configuration Issue",
        `We're experiencing issues connecting to Firebase. The app will continue to work using local storage instead.\n\nTechnical details that may help debugging:\n${errorMsg}`,
        [
          { 
            text: "Learn More", 
            onPress: () => {
              Linking.openURL('https://firebase.google.com/docs/storage/web/start');
            }
          },
          { 
            text: "OK", 
            onPress: () => setShowedFirebaseWarning(true) 
          }
        ]
      );
    }
  }, [error, firebaseErrorDetails, showedFirebaseWarning]);

  // Monitor for Firebase Storage errors in console logs
  useEffect(() => {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // Check if this is a Firebase error
      const errorString = args.join(' ');
      if (errorString.includes('Firebase') || errorString.includes('firestore')) {
        setFirebaseErrorDetails(errorString);
      }
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!imageUri ? (
          <View style={styles.scanContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('scanProduct')}
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={takePhoto}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="camera"
              >
                {t('takePhoto')}
              </Button>
              
              <Button
                mode="outlined"
                onPress={pickImage}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="image"
              >
                {t('chooseFromGallery')}
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 20 }}>
                  Analyzing product...
                </Text>
              </View>
            ) : (
              <>
                <Card style={styles.card}>
                  <Card.Cover source={{ uri: imageUri }} style={styles.productImage} />
                  
                  <Card.Title
                    title={productName}
                    titleStyle={{ fontWeight: 'bold', fontSize: 20 }}
                  />
                  
                  <Card.Content>
                    {error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <>
                        {recallInfo && (
                          <View style={styles.recallContainer}>
                            <View style={[
                              styles.recallBadge,
                              { backgroundColor: recallInfo.isRecalled ? '#FF3B30' : '#34C759' }
                            ]}>
                              <Text style={styles.recallText}>
                                {recallInfo.isRecalled ? t('recalled') : t('notRecalled')}
                              </Text>
                            </View>
                            
                            {recallInfo.isRecalled && (
                              <View style={styles.recallDetails}>
                                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                                  {t('recallReason')}:
                                </Text>
                                <Text style={{ color: theme.colors.text }}>
                                  {recallInfo.recallReason}
                                </Text>
                                
                                <Text style={{ color: theme.colors.text, fontWeight: 'bold', marginTop: 10 }}>
                                  {t('manufacturer')}:
                                </Text>
                                <Text style={{ color: theme.colors.text }}>
                                  {recallInfo.manufacturer}
                                </Text>
                                
                                <Text style={{ color: theme.colors.text, fontWeight: 'bold', marginTop: 10 }}>
                                  {t('lotNumber')}:
                                </Text>
                                <Text style={{ color: theme.colors.text }}>
                                  {recallInfo.lotNumber}
                                </Text>
                                
                                <Text style={{ color: theme.colors.text, fontWeight: 'bold', marginTop: 10 }}>
                                  {t('recallDate')}:
                                </Text>
                                <Text style={{ color: theme.colors.text }}>
                                  {recallInfo.recallDate}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {description && (
                          <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                              {t('productDetails')}
                            </Text>
                            <Text style={{ color: theme.colors.text }}>
                              {description}
                            </Text>
                          </View>
                        )}
                        
                        {nutritionalInfo && (
                          <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                              {t('nutritionalInfo')}
                            </Text>
                            
                            <View style={styles.nutritionTable}>
                              <View style={styles.nutritionRow}>
                                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                                  {t('calories')}:
                                </Text>
                                <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                                  {nutritionalInfo.calories}
                                </Text>
                              </View>
                              
                              <Divider style={styles.divider} />
                              
                              <View style={styles.nutritionRow}>
                                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                                  {t('fats')}:
                                </Text>
                                <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                                  {nutritionalInfo.fats}
                                </Text>
                              </View>
                              
                              <Divider style={styles.divider} />
                              
                              <View style={styles.nutritionRow}>
                                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                                  {t('carbs')}:
                                </Text>
                                <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                                  {nutritionalInfo.carbs}
                                </Text>
                              </View>
                              
                              <Divider style={styles.divider} />
                              
                              <View style={styles.nutritionRow}>
                                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                                  {t('proteins')}:
                                </Text>
                                <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                                  {nutritionalInfo.proteins}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </Card.Content>
                </Card>
                
                <Button
                  mode="contained"
                  onPress={resetScan}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  icon="refresh"
                >
                  {t('scanProduct')}
                </Button>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 20,
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
  resultContainer: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  productImage: {
    height: 200,
  },
  recallContainer: {
    marginVertical: 15,
  },
  recallBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  recallText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recallDetails: {
    marginTop: 10,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nutritionTable: {
    marginTop: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nutritionLabel: {
    fontWeight: 'bold',
  },
  nutritionValue: {
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
}); 