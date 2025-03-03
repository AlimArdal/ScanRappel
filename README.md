# ScanRappel

A mobile application that empowers users to quickly verify whether a product has been recalled by scanning or photographing its packaging. The app leverages advanced AI and real-time data extraction from official recall databases to provide comprehensive product information and recall status.

## Features

- **Product Scanning**: Capture or upload product images for instant recall verification
- **AI-Powered Analysis**: Get detailed product descriptions and nutritional information
- **Bilingual Support**: Seamless language switching between English and French
- **User Authentication**: Secure login and data management
- **Scan History**: Track your past scans and product verifications
- **Offline Support**: Access recent scan data even without internet connection

## Tech Stack

- **Frontend**: React Native with TypeScript, managed by Expo
- **Navigation**: Expo Router for file-based routing
- **State Management**: Context API
- **Backend/Database**: Firebase (Authentication + Firestore)
- **AI Processing**: OpenAI API
- **Image Processing**: Expo's Image Picker and Camera modules

## Prerequisites

- Node.js (LTS version)
- Expo CLI
- Firebase Account
- OpenAI API Key
- Expo Go app for testing

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AlimArdal/ScanRappel.git
cd ScanRappel
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npx expo start
```

## Usage

1. Launch the app using Expo Go on your mobile device
2. Sign up or log in to your account
3. Use the camera or gallery to scan product images
4. View recall status and nutritional information
5. Access your scan history in the settings tab

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Firebase for backend services
- Expo for the development framework
