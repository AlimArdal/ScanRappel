import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { testFirebaseConfig, testOpenAIConfig } from '../services/configTest';

export default function TestConfigScreen() {
  const { theme, isDarkTheme } = useTheme();
  const [firebaseStatus, setFirebaseStatus] = useState<boolean | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');

  const testFirebase = async () => {
    try {
      setMessage(prev => prev + '\nTesting Firebase configuration...');
      const result = await testFirebaseConfig();
      setFirebaseStatus(result);
      setMessage(prev => prev + '\nFirebase test completed.');
    } catch (error) {
      console.error('Firebase test error:', error);
      setFirebaseStatus(false);
      setMessage(prev => prev + `\nFirebase test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testOpenAI = async () => {
    try {
      setMessage(prev => prev + '\nTesting OpenAI configuration...');
      const result = testOpenAIConfig();
      setOpenaiStatus(result);
      setMessage(prev => prev + '\nOpenAI test completed.');
    } catch (error) {
      console.error('OpenAI test error:', error);
      setOpenaiStatus(false);
      setMessage(prev => prev + `\nOpenAI test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testAll = async () => {
    setMessage('Starting integration tests...');
    await testFirebase();
    await testOpenAI();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Configuration Test
        </Text>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
            Firebase Status:
          </Text>
          <Text 
            style={[
              styles.statusValue, 
              { 
                color: firebaseStatus === null 
                  ? theme.colors.text 
                  : firebaseStatus 
                    ? '#34C759' // Green
                    : '#FF3B30' // Red
              }
            ]}
          >
            {firebaseStatus === null 
              ? 'Not tested' 
              : firebaseStatus 
                ? 'Connected' 
                : 'Failed'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
            OpenAI Status:
          </Text>
          <Text 
            style={[
              styles.statusValue, 
              { 
                color: openaiStatus === null 
                  ? theme.colors.text 
                  : openaiStatus 
                    ? '#34C759' // Green
                    : '#FF3B30' // Red
              }
            ]}
          >
            {openaiStatus === null 
              ? 'Not tested' 
              : openaiStatus 
                ? 'Connected' 
                : 'Failed'}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={testAll}
            style={styles.button}
            buttonColor={theme.colors.primary}
          >
            Test All Integrations
          </Button>
          
          <Button
            mode="outlined"
            onPress={testFirebase}
            style={styles.button}
            textColor={theme.colors.primary}
          >
            Test Firebase Only
          </Button>
          
          <Button
            mode="outlined"
            onPress={testOpenAI}
            style={styles.button}
            textColor={theme.colors.primary}
          >
            Test OpenAI Only
          </Button>
        </View>
        
        {message ? (
          <View style={styles.logContainer}>
            <Text style={[styles.logTitle, { color: theme.colors.text }]}>
              Test Log:
            </Text>
            <ScrollView 
              style={[styles.logScrollView, { backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5' }]}
              contentContainerStyle={styles.logContent}
            >
              <Text style={{ color: theme.colors.text }}>
                {message}
              </Text>
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
  },
  logContainer: {
    marginTop: 30,
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logScrollView: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
  },
  logContent: {
    padding: 10,
  },
}); 