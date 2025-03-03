# ScanRappel – Comprehensive Build Guide

---

## Overview

**ScanRappel** is a mobile application that empowers users to quickly verify whether a product has been recalled by scanning or photographing its packaging. Leveraging advanced AI and real-time data extraction from official recall databases, the app not only confirms the recall status but also provides a rich description of the product. For food items, ScanRappel goes further by delivering detailed nutritional information—including calories, fats, carbohydrates, and proteins. The user interface supports seamless language switching between English and French, ensuring clarity and accessibility for a diverse audience.

---

## Requirements (Prerequisites)

Before getting started, ensure you have the following:

- **Code Editor:** Visual Studio Code or your preferred IDE.
- **Firebase Account:** For authentication, user data management, and Firestore database support.
- **OpenAI Account:** To utilize the OpenAI API for generating product descriptions and nutritional breakdowns.
- **Expo Go:** Mobile app for testing your React Native project.
- **Node.js:** LTS version installed on your machine.
- **Expo CLI:** Installed globally (via `npm install -g expo-cli`) or accessible with `npx expo-cli`.

---

## Tech Stack

- **Frontend:** [React Native](https://reactnative.dev/) with TypeScript, managed by [Expo](https://expo.dev/).
- **Navigation:** [Expo Router](https://expo.github.io/router/docs/) for file-based routing.
- **State Management:** Context API for handling authentication, theme, and language preferences.
- **Backend/Database:** [Firebase](https://firebase.google.com/) (Authentication + Firestore) for secure user data storage.
- **AI Processing:** [OpenAI API](https://platform.openai.com/docs/api-reference) to analyze product images and generate descriptive and nutritional information.
- **Image Processing:** Expo’s Image Picker and Camera modules for capturing and selecting product images.

---

## Core Functionality

1. **Onboarding Flow**
   - **Welcome Screen:** Introduces ScanRappel on app launch with options to sign up or log in.
   - **Signup & Login Screens:** Allow users to create an account or sign in using email/password. On successful authentication, users are directed to the main interface.

2. **Main Tabs**
   - **Home Screen (Default Tab):**
     - **Product Scanning:** Users can scan a QR code or capture a picture of a product.
     - **AI Verification:** The captured image is sent to a dedicated bot that fetches real-time data from the official recall website (e.g., [rappel.conso.gouv.fr](https://rappel.conso.gouv.fr/)) and validates the product’s recall status.
     - **Detailed Information Display:** If a product is recalled, the app shows comprehensive details (product name, manufacturer, lot number, recall date, and reason). For edible products, nutritional information (calories, fats, carbs, proteins) is also provided.
     - **Manual Search Option:** In cases where scanning is unsuccessful, users can manually search for a product by name or barcode.
   
   - **Settings Screen (Secondary Tab):**
     - **Language Switcher:** Toggle between English and French to update the entire user interface and notifications.
     - **Theme Selection:** Option to switch between light and dark modes.
     - **Account Management:** Options to log out, update profile information, or delete the account.

3. **Image Analysis & AI Integration**
   - **Capture & Selection:** Utilize the device’s camera or gallery to obtain a product image.
   - **Data Extraction:** A backend bot scrapes the official recall database in real time, ensuring that only truly recalled products are flagged.
   - **OpenAI API:** If the product is identified as food, the app sends a request to the OpenAI API. The API returns a detailed product description along with nutritional breakdown (calories, fats, carbs, proteins) based on the product image and metadata.
   - **Contextual Assistance:** The app’s AI assistant can answer follow-up questions regarding recall procedures, nutritional guidance, or product safety in plain language.

4. **Authentication, Data Storage & User Preferences**
   - **Firebase Authentication:** Secure user registration and login.
   - **Firestore:** Store user scan history, preferences, and settings securely.
   - **Context API:** Manage global states such as user authentication, theme, and language selection, ensuring a personalized and cohesive experience.

5. **Additional Features**
   - **Push Notifications:** Real-time push notifications inform users of new recall updates or changes to previously scanned products.
   - **Scan History Dashboard:** A detailed log of past scans with filtering options to review recall status and nutritional information.
   - **Offline Mode:** Local caching of recent scan data to provide essential recall information even when offline.
   - **User Feedback Loop:** Allow users to report inaccuracies or provide feedback, which can be used to continuously improve the AI’s precision.

---



### Step 1: Project Setup

1. **Initialize the Project with Expo:**

```bash
   npx create-expo-app@latest ScanRappel
   cd ScanRappel
```
2. **Install Dependencies:**
```bash
    npm install expo-router firebase expo-image-picker expo-camera @react-native-async-storage/async-storage react-native-paper @expo/vector-icons openai dotenv
```
    These dependencies cover navigation, image handling, Firebase integration, UI components, and AI API interaction.





### Step 2: Environment and Service Setup

1. **Create a .env File:**

    **In the project root, create a file named .env and add your keys:**
```ini
    EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_PROJECT.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_PROJECT.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
    EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    EXPO_PUBLIC_OPENAI_API_KEY=sk-YOUR_OPENAI_SECRET_KEY
```
    Important: Add .env to your .gitignore to protect your keys.

2. **Setup Firebase**

    **Create a file services/firebaseConfig.ts:**
```typescript
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";
    import Constants from "expo-constants";

    const firebaseConfig = {
    apiKey: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: Constants.manifest?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    export { auth, db };
```

3. **Configure OpenAI API:**

    **Create a file services/openai.ts:**
```typescript
    import { Configuration, OpenAIApi } from "openai";
    import Constants from "expo-constants";

    const configuration = new Configuration({
    apiKey: Constants.manifest?.extra?.EXPO_PUBLIC_OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    export const generateProductDescription = async (prompt: string) => {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 150,
    });
    return response.data.choices[0].text?.trim();
    };

    export default openai;
```





### Step 3: File Structure & Context Setup

1. **Organize Your Project Files:**

    **A suggested structure:**
```bash
    ScanRappel/
    ├── app/
    │   ├── _layout.tsx               # Root layout (Navigation container, Providers)
    │   ├── _index.tsx                # Entry point, checking authentication state
    │   ├── +not-found.tsx            # 404 handling
    │   ├── (onboarding)/             # Public routes (welcome, login, signup)
    │   │   ├── _layout.tsx           
    │   │   ├── welcome.tsx           
    │   │   ├── login.tsx             
    │   │   └── signup.tsx            
    │   └── (tabs)/                   # Protected routes (Home, Settings)
    │       ├── _layout.tsx           
    │       ├── index.tsx             # Home screen (scanning and display)
    │       └── settings.tsx          # Settings screen (language toggle, theme)
    ├── contexts/                      # Context API providers for Auth, Theme, Language
    │   ├── AuthContext.tsx
    │   ├── ThemeContext.tsx
    │   └── LanguageContext.tsx
    ├── hooks/                         # Custom hooks for consuming contexts and managing state
    │   ├── useAuth.ts
    │   ├── useTheme.ts
    │   └── useLanguage.ts
    ├── services/                      # External services and configurations
    │   ├── firebaseConfig.ts         
    │   └── openai.ts                 
    ├── .env                        
    └── app.json                     # Configure Expo with environment variables
```
2. **Implement Context Providers:**

    Create context files (e.g., contexts/LanguageContext.tsx) to allow dynamic switching between English and French.




### Step 4: Implementing Core Functionality

**A. Onboarding & Authentication**
1. **Welcome, Login & Signup Screens:**
    - Build screens under app/(onboarding)/ for user registration and login using Firebase Authentication.
    - Use Firebase’s email/password method and update the AuthContext upon successful login.

2. **Protecting Routes:**
    In _index.tsx, check the authentication state. Redirect to onboarding screens if the user is not logged in; otherwise, navigate to the main tabs.

**B. Image Capture & Scanning**
1. **Implement QR Code and Image Capture:**
    - Use Expo Camera or Image Picker in your Home screen (app/(tabs)/index.tsx) to allow users to scan or take a picture.
    - Example snippet using Image Picker:

```typescript
    import * as ImagePicker from 'expo-image-picker';

    const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
    });
    if (!result.cancelled) {
        // Pass the image URI to the next step (e.g., recall verification)
        processImage(result.uri);
    }
    };
```

**C. Data Verification Bot**
1. **Integrate a Backend Bot for Data Retrieval:**

    - Create a backend service (e.g., a Firebase Cloud Function) that:
        - Accepts product details (barcode/QR code data or extracted metadata).
        - Scrapes or queries the official recall website (rappel.conso.gouv.fr) to verify the recall status.
        - Returns verified recall details if the product is indeed recalled.
    - On the client-side, call this endpoint and update the UI with the validated results.
2. **Ensuring Accuracy:**

    - Ensure the bot compares scanned product details with official database data so that only genuinely recalled products are flagged.
    - Implement error handling for cases where the product is not found.


**D. OpenAI Integration for Detailed Descriptions**
1. **Generate Product Descriptions:**
    - If the product is identified as a food item, construct a detailed prompt including visible product data (e.g., product name, packaging details).
    - Call the generateProductDescription function from services/openai.ts to receive nutritional info (calories, fats, carbs, proteins) and other product details.
    - Example prompt:

```typescript
    const prompt = `Provide a detailed description for the following food product including nutritional information (calories, fat, carbs, protein): ${productName}.`;
    const description = await generateProductDescription(prompt);
```

2. **Display the AI-Generated Content:**

    - On the Home screen, create a component that displays the recall information along with the AI-generated description and nutritional data if applicable.


**E. Language Switching & UI Enhancements**
1. **Implement Language Toggle:**
    - Use the LanguageContext to enable switching between English and French.
    - Ensure that all text elements, notifications, and AI prompts update dynamically based on the selected language.

2. **UI/UX Enhancements:**
    - Use React Native Paper and custom styles to create a clean, responsive interface.
    - Implement smooth transitions and visual feedback (e.g., loading indicators during image analysis or data fetching).






### Step 5: Notifications, Offline Support, and Additional Features
1. **Push Notifications:**
    - Integrate Firebase Cloud Messaging to send push notifications when new recall updates are detected or when a previously scanned product gets updated.
2. **Offline Mode:**
    - Implement local caching (using AsyncStorage) for recent scan results so that users can access recall information even when offline.
3. **Scan History & Feedback:**
    - Create a dashboard within the Home screen that logs all previous scans with detailed information.
    - Add a feature to let users report discrepancies, feeding back into your system for continuous improvement.






### Step 6: Testing & Deployment
1. **Testing:**
    - Test on Expo Go across different devices.
    - Verify that authentication, scanning, recall verification, language switching, and AI integrations work seamlessly.
    - Use tools like Jest for unit testing your functions and contexts.
2. **Deployment:**
    - Once fully tested, deploy your Firebase Cloud Functions (or your chosen backend) to a production environment.
    - Publish your Expo app following Expo’s publishing guide.
3. **Maintenance & Future Enhancements:**
    - Monitor user feedback and app performance.
    - Plan future features such as advanced analytics, more detailed product databases, or additional language support as needed.






### Conclusion

ScanRappel is an innovative solution designed to enhance consumer safety by providing instant verification of product recall status through image scanning. By integrating real-time data extraction from official recall sources and leveraging the OpenAI API for comprehensive product descriptions—including detailed nutritional data for food items—ScanRappel stands out as a powerful tool for informed purchasing decisions. With robust authentication, a user-friendly design, bilingual support (English/French), push notifications, offline functionality, and a feedback loop for continuous improvement, this app delivers a secure and comprehensive user experience.

Happy coding!