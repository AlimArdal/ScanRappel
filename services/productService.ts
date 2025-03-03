import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
export interface RecallInfo {
  isRecalled: boolean;
  productName: string;
  manufacturer: string;
  lotNumber: string;
  recallDate: string;
  recallReason: string;
}

export interface NutritionalInfo {
  calories: string;
  fats: string;
  carbs: string;
  proteins: string;
}

export interface ProductDetails {
  recallInfo: RecallInfo;
  nutritionalInfo?: NutritionalInfo;
  description?: string;
  imageUri?: string;
  scanDate: Date;
}

// Mock function to verify if a product is recalled
// In a real app, this would call an API to check against official recall databases
export const verifyProductRecall = async (productIdentifier: string): Promise<RecallInfo> => {
  try {
    // This is a mock implementation
    // In reality, you would make an API call to an official recall database
    // or use web scraping to check if the product is recalled
    
    // For demo purposes, let's pretend some products are recalled
    const mockRecalledProducts = [
      'TestProduct123',
      '5901234123457',
      'Apple Juice Organic',
    ];
    
    const isRecalled = mockRecalledProducts.some(
      product => productIdentifier.toLowerCase().includes(product.toLowerCase())
    );
    
    if (isRecalled) {
      return {
        isRecalled: true,
        productName: productIdentifier,
        manufacturer: 'Sample Manufacturer',
        lotNumber: 'LOT-2023-1234',
        recallDate: new Date().toISOString().split('T')[0], // Today's date
        recallReason: 'Potential contamination with foreign materials',
      };
    }
    
    return {
      isRecalled: false,
      productName: productIdentifier,
      manufacturer: '',
      lotNumber: '',
      recallDate: '',
      recallReason: '',
    };
  } catch (error) {
    console.error('Error verifying product recall:', error);
    throw new Error('Failed to verify if the product is recalled');
  }
};

// Function to save scan history to Firestore
export const saveScanHistory = async (
  userId: string,
  productDetails: ProductDetails
): Promise<void> => {
  try {
    // Check if user ID exists
    if (!userId) {
      console.log('No user ID provided, skipping scan history save');
      return;
    }
    
    // Create a Firestore-friendly object (no circular references)
    const firestoreData = {
      userId,
      recallInfo: productDetails.recallInfo,
      nutritionalInfo: productDetails.nutritionalInfo || null,
      description: productDetails.description || '',
      imageUri: productDetails.imageUri || '',
      scanDate: Timestamp.fromDate(productDetails.scanDate),
      createdAt: Timestamp.now(), // Add timestamp for when this was created
    };
    
    // Try to save to Firestore
    try {
      await addDoc(collection(db, 'scanHistory'), firestoreData);
      console.log('✅ Scan history saved successfully to Firestore');
    } catch (firestoreError: unknown) {
      // If there's a permissions error, log it but don't throw
      console.error('Firebase error saving scan history:', firestoreError);
      
      // Save to AsyncStorage as a fallback
      console.log('⚠️ Could not save to Firestore, saving to local storage instead');
      
      try {
        // Get existing history from AsyncStorage
        const localHistoryStr = await AsyncStorage.getItem(`scanHistory_${userId}`);
        const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
        
        // Add new scan to history
        const localScanData = {
          ...firestoreData,
          id: `local_${Date.now()}`,
          scanDate: productDetails.scanDate.toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        localHistory.push(localScanData);
        
        // Save updated history back to AsyncStorage
        await AsyncStorage.setItem(`scanHistory_${userId}`, JSON.stringify(localHistory));
        console.log('✅ Scan history saved successfully to local storage');
      } catch (asyncStorageError) {
        console.error('Error saving to AsyncStorage:', asyncStorageError);
      }
      
      // Try to determine if it's a permissions error
      const errorMessage = String(firestoreError).toLowerCase();
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        console.log('❌ This appears to be a permissions error. Check your Firestore security rules.');
      }
      
      // Don't throw the error to prevent blocking the app flow
      return;
    }
  } catch (error) {
    console.error('Error in saveScanHistory function:', error);
    // Don't throw to avoid breaking the app flow
    return;
  }
};

// Function to get scan history from Firestore or local storage
export const getScanHistory = async (userId: string): Promise<ProductDetails[]> => {
  try {
    try {
      // Try to get from Firestore first
      const scanHistoryRef = collection(db, 'scanHistory');
      const q = query(scanHistoryRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const scanHistory: ProductDetails[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scanHistory.push({
          recallInfo: data.recallInfo,
          nutritionalInfo: data.nutritionalInfo || undefined,
          description: data.description || undefined,
          imageUri: data.imageUri || undefined,
          scanDate: (data.scanDate as Timestamp).toDate(),
        } as ProductDetails);
      });
      
      console.log('✅ Successfully retrieved scan history from Firestore');
      
      // Sort by scan date (newest first)
      return scanHistory.sort((a: ProductDetails, b: ProductDetails) => b.scanDate.getTime() - a.scanDate.getTime());
    } catch (firestoreError) {
      console.error('Error getting scan history from Firestore:', firestoreError);
      console.log('Falling back to local storage for scan history');
      
      // Fallback to AsyncStorage
      const localHistoryStr = await AsyncStorage.getItem(`scanHistory_${userId}`);
      if (!localHistoryStr) return [];
      
      const localHistory = JSON.parse(localHistoryStr);
      
      // Convert to ProductDetails format
      const scanHistory = localHistory.map((item: any) => ({
        recallInfo: item.recallInfo,
        nutritionalInfo: item.nutritionalInfo || undefined,
        description: item.description || undefined,
        imageUri: item.imageUri || undefined,
        scanDate: new Date(item.scanDate),
      } as ProductDetails));
      
      console.log('✅ Successfully retrieved scan history from local storage');
      
      // Sort by scan date (newest first)
      return scanHistory.sort((a: ProductDetails, b: ProductDetails) => b.scanDate.getTime() - a.scanDate.getTime());
    }
  } catch (error) {
    console.error('Error getting scan history:', error);
    return []; // Return empty array instead of throwing
  }
}; 