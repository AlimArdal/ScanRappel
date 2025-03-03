import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Needed for client-side browser usage
});

// Using the latest model with vision capabilities
const DEFAULT_MODEL = "gpt-4o";  // Latest model with vision support

// Simple in-memory cache for responses to avoid duplicate processing
interface CacheEntry {
  timestamp: number;
  response: any;
}
const responseCache: Record<string, CacheEntry> = {};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds for longer caching

/**
 * Helper function to implement exponential backoff for API retries
 * @param retries Number of retries attempted so far
 * @returns Time to wait in milliseconds before next retry
 */
const getBackoffTime = (retries: number): number => {
  // Exponential backoff with jitter: 2^retries * (0.5-1.5 random factor) * 1000ms base
  const jitter = 0.5 + Math.random();
  return Math.min(Math.pow(2, retries) * jitter * 1000, 30000); // Cap at 30 seconds
};

/**
 * Generate a cache key from a function name and parameters
 */
const generateCacheKey = (functionName: string, params: any): string => {
  return `${functionName}:${JSON.stringify(params)}`;
};

/**
 * Get a cached response if available and not expired
 */
const getCachedResponse = (cacheKey: string): any | null => {
  const cached = responseCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    console.log('Using cached response for:', cacheKey);
    return cached.response;
  }
  return null;
};

/**
 * Cache a response for future use
 */
const setCachedResponse = (cacheKey: string, response: any): void => {
  responseCache[cacheKey] = {
    timestamp: Date.now(),
    response,
  };
};

/**
 * Execute a function with caching and retry logic
 * @param fn The async function to execute with retries
 * @param cacheKey A unique key to identify this operation for caching
 * @param maxRetries Maximum number of retries before giving up
 * @returns Result of the function
 */
const withRetry = async <T>(
  fn: () => Promise<T>, 
  cacheKey: string | null = null,
  maxRetries = 5
): Promise<T> => {
  // Check cache first if cacheKey is provided
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached as T;
  }

  let retries = 0;
  
  while (true) {
    try {
      // Execute the function directly - no rate limiting
      const result = await fn();
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        setCachedResponse(cacheKey, result);
      }
      
      return result;
    } catch (error: any) {
      console.error('API call error:', error.message || error);
      
      // If we've used all retries, throw
      if (retries >= maxRetries) {
        console.error('Maximum retries reached, giving up.');
        throw error;
      }
      
      // Increment retries and wait with exponential backoff
      retries++;
      const backoffTime = getBackoffTime(retries);
      console.log(`API call failed. Retrying in ${backoffTime/1000} seconds... (Retry ${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
};

/**
 * Upload an image to Firebase Storage and get its URL
 * @param uri Local image URI
 * @returns Public URL of the uploaded image
 */
const uploadImageToFirebase = async (uri: string): Promise<string> => {
  try {
    // Generate a unique filename using timestamp and random string
    const filename = `food_images/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    console.log(`Attempting to upload image to Firebase Storage: ${filename}`);
    console.log(`Storage bucket: ${storage.app.options.storageBucket || 'undefined'}`);
    
    try {
      // Upload the blob to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('Image uploaded to Firebase Storage');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Image URL:', downloadURL);
      
      return downloadURL;
    } catch (uploadError: any) {
      // Log detailed information about the upload error
      console.error('Firebase Storage upload error details:');
      console.error('- Error code:', uploadError.code);
      console.error('- Error message:', uploadError.message);
      console.error('- Server response:', uploadError.serverResponse || 'None');
      console.error('- Storage reference:', uploadError.ref?.toString() || 'Unknown');
      
      if (uploadError.code === 'storage/unauthorized') {
        console.error('This appears to be a permissions error. Check your Firebase Storage rules.');
      } else if (uploadError.code === 'storage/canceled') {
        console.error('Upload was canceled or timed out.');
      } else if (uploadError.code === 'storage/unknown') {
        console.error('Network error or Firebase Storage service issue.');
      }
      
      throw uploadError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    console.log('Falling back to base64 encoding...');
    // Fall back to base64 encoding if Firebase upload fails
    return `data:image/jpeg;base64,${await imageToBase64(uri)}`;
  }
};

/**
 * Convert an image URI to a base64 string
 * @param uri Local image URI
 * @returns Base64 encoded image string
 */
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Analyze a product image and extract nutritional information
 * @param imageUri URI of the product image to analyze
 * @returns Product information including name and nutritional details
 */
export const analyzeProductImage = async (imageUri: string): Promise<{
  productName: string;
  description: string;
  nutritionalInfo: {
    calories: string;
    fats: string;
    carbs: string;
    proteins: string;
  } | null;
}> => {
  try {
    // Verify API key is set
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is missing. Please check your configuration.');
    }

    // Create a cache key based on the image URI
    const cacheKey = generateCacheKey('analyzeProductImage', imageUri);

    // Upload image to Firebase Storage and get its public URL
    console.log('Uploading image to Firebase Storage...');
    const imageUrl = await uploadImageToFirebase(imageUri);
    
    // Prepare messages for the vision API with enhanced prompt
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert product identification assistant specializing in food products. 
Your task is to analyze images of food products and provide detailed, accurate nutritional information.

For each image:
1. Identify the exact product name and brand (be specific)
2. Provide a brief description of the product
3. Focus on extracting detailed nutritional information, particularly:
   - Calories (per serving)
   - Fat content (total, saturated, and trans fats if visible)
   - Carbohydrates (total, sugar, and fiber if visible)
   - Protein content
   - Serving size information

Format your response with clear section headings:
- Product Name: [Full product name with brand]
- Description: [Brief description]
- Nutritional Information:
  - Calories: [value]
  - Fats: [value]
  - Carbohydrates: [value]
  - Proteins: [value]

If exact nutritional information isn't visible, make your best estimate based on similar products, and indicate when you're making an estimate.
BE PRECISE WITH NUMBERS - users will rely on this information for health tracking.`
      },
      {
        role: "user",
        content: [
          {
            type: "text", 
            text: "What product is shown in this image? Please identify it and provide complete nutritional information focusing on calories, protein, carbs and fats."
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    // Call OpenAI API with caching and retry logic
    console.log('Sending image to OpenAI for analysis...');
    const response = await withRetry(
      async () => {
        // Use the latest gpt-4o model
        return await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages,
          max_tokens: 800,
          temperature: 0.1, // Lower temperature for more factual responses
        });
      },
      cacheKey
    );
    
    // Extract the response text
    const responseText = response.choices[0]?.message?.content?.trim() || '';
    console.log('OpenAI response received');
    
    // Parse the response to extract product information
    let productName = extractFromResponse(responseText, 'product name', 'product', 'name', 'brand');
    if (!productName) {
      // Fallback extraction methods with more patterns
      const namePatterns = [
        /Product(?:\s?Name)?:\s*([^\n]+)/i,
        /This is (?:a|an)\s+([^\n.,]+)/i,
        /I can see (?:a|an)\s+([^\n.,]+)/i,
        /The image shows (?:a|an)\s+([^\n.,]+)/i,
        /This (?:is|appears to be) (?:a|an)\s+([^\n.,]+)/i,
        /([A-Z][A-Za-z0-9 ]+ (?:cereal|chips|snacks|drink|beverage|food|product))/
      ];
      
      for (const pattern of namePatterns) {
        const match = responseText.match(pattern);
        if (match && match[1]?.trim()) {
          productName = match[1].trim();
          break;
        }
      }
      
      if (!productName) {
        // Last resort: take the first sentence of the response
        const firstSentence = responseText.split(/[.!?]/)[0];
        if (firstSentence && firstSentence.length > 10) {
          productName = firstSentence.trim();
        } else {
          productName = 'Unknown Product';
        }
      }
    }
    
    // Extract nutritional information with enhanced patterns
    const calories = extractFromResponse(responseText, 'calories', 'caloric content', 'energy');
    const fats = extractFromResponse(responseText, 'fats', 'fat', 'fat content', 'total fat');
    const carbs = extractFromResponse(responseText, 'carbohydrates', 'carbs', 'carb', 'total carbohydrates');
    const proteins = extractFromResponse(responseText, 'proteins', 'protein', 'protein content');
    
    // Extract or generate description
    let description = extractFromResponse(
      responseText, 
      'description', 
      'product description', 
      'about this product',
      'overview'
    );
    
    if (!description) {
      // Look for paragraphs that might contain descriptions
      const paragraphPatterns = [
        /Description:[\s\n]+([\s\S]+?)(?=\n\n|\n[A-Z]|Nutritional Information:|$)/i,
        /This product is ([\s\S]+?)(?=\n\n|\n[A-Z]|Nutritional Information:|$)/i,
        /([\s\S]+?)(?=\nNutritional Information:|Nutrition Facts:|Calories:|$)/i
      ];
      
      for (const pattern of paragraphPatterns) {
        const match = responseText.match(pattern);
        if (match && match[1]?.trim() && match[1].length > 20) {
          description = match[1].trim();
          break;
        }
      }
      
      // If still no description, use structured extraction
      if (!description) {
        // Split by double newlines to find paragraphs
        const paragraphs = responseText.split(/\n\s*\n/);
        for (const paragraph of paragraphs) {
          // Skip paragraphs that are clearly nutritional information
          if (!paragraph.toLowerCase().includes('calorie') && 
              !paragraph.toLowerCase().includes('nutrition') && 
              !paragraph.toLowerCase().includes('protein') &&
              !paragraph.toLowerCase().includes('fat') &&
              !paragraph.toLowerCase().includes('carb') &&
              paragraph.length > 40) {
            description = paragraph.trim();
            break;
          }
        }
      }
      
      // If still no description, use the whole response
      if (!description) {
        description = responseText;
      }
    }
    
    // Create a properly formatted object with all the information
    return {
      productName,
      description,
      nutritionalInfo: {
        calories: calories || 'Not available',
        fats: fats || 'Not available',
        carbs: carbs || 'Not available',
        proteins: proteins || 'Not available'
      }
    };
  } catch (error) {
    console.error('Error analyzing product image:', error);
    // Return a user-friendly error with partial information if possible
    return {
      productName: 'Unknown Product',
      description: 'Unable to analyze the product image at this time. Please try again later.',
      nutritionalInfo: null
    };
  }
};

/**
 * Helper function to extract specific information from the API response
 * @param text The response text to parse
 * @param primaryKey The primary key to look for
 * @param alternateKeys Optional alternate keys to try
 * @returns The extracted value or null if not found
 */
const extractFromResponse = (text: string, primaryKey: string, ...alternateKeys: string[]): string | null => {
  const keys = [primaryKey, ...alternateKeys];
  const lowerText = text.toLowerCase();
  
  for (const key of keys) {
    // Try different formats: Key: Value, Key - Value, etc.
    const patterns = [
      new RegExp(`${key}\\s*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}\\s*-\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}\\s*=\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}\\s*content\\s*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}\\s*information\\s*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`\\*\\*${key}\\*\\*\\s*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`<${key}>([^<]+)</${key}>`, 'i'), // XML-like format
      new RegExp(`^\\s*${key}\\s*:\\s*([^\\n]+)`, 'im'), // Line starting with key
      new RegExp(`\\|\\s*${key}\\s*\\|\\s*([^\\|\\n]+)\\s*\\|`, 'i'), // Table format
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
    
    // Look for the key in a bullet point or numbered list
    const bulletPatterns = [
      new RegExp(`[•\\-\\*\\d+\\.]+\\s*${key}\\s*:?\\s*([^\\n]+)`, 'i'),
      new RegExp(`[•\\-\\*]\\s*${key}\\s*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`\\d+\\.\\s*${key}\\s*:\\s*([^\\n]+)`, 'i')
    ];
    
    for (const pattern of bulletPatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
    
    // Look for sentences that contain the key
    if (lowerText.includes(key.toLowerCase())) {
      const sentences = text.split(/\.(?:\s+|\n)/);
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(key.toLowerCase())) {
          // Extract numbers and units from the sentence
          const numberWithUnitMatches = [
            sentence.match(/(\d+(?:\.\d+)?\s*(?:g|mg|kcal|calories|cal)(?:\/serving)?)/i),
            sentence.match(/(\d+(?:\.\d+)?\s*(?:grams|gram|milligrams|milligram))/i),
            sentence.match(/(\d+(?:\.\d+)?\s*(?:%|percent))/i)
          ];
          
          for (const match of numberWithUnitMatches) {
            if (match && match[0]) {
              return match[0].trim();
            }
          }
          
          // If no unit was found but the sentence is short and specific, return it
          if (sentence.length < 100) {
            return sentence.trim();
          }
        }
      }
    }
  }
  
  return null;
};

// Export OpenAI instance as default and the utility functions
export default openai; 