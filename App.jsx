import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { tokenCache } from './src/services/tokenCache';
import api from './src/services/api';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

const publishableKey = 'pk_test_c3VpdGVkLWdlY2tvLTYxLmNsZXJrLmFjY291bnRzLmRldiQ';

// Clear any stale/corrupted tokens on app start
const clearStaleTokens = async () => {
  try {
    // Clear the client JWT if it exists but is invalid
    const existingToken = await SecureStore.getItemAsync('__clerk_client_jwt');
    if (existingToken) {
      console.log('Found existing token, checking validity...');
      // If the token is corrupted or from a different version, clear it
      try {
        const payload = JSON.parse(atob(existingToken.split('.')[1]));
        const exp = payload.exp * 1000;
        if (Date.now() > exp) {
          console.log('Token expired, clearing...');
          await SecureStore.deleteItemAsync('__clerk_client_jwt');
        }
      } catch (e) {
        console.log('Token parse error, clearing...', e);
        await SecureStore.deleteItemAsync('__clerk_client_jwt');
      }
    }
  } catch (error) {
    console.log('Error checking tokens:', error);
  }
};

const ClerkApiBridge = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    api.setTokenProvider(getToken);
    console.log('Auth state - isSignedIn:', isSignedIn);
  }, [getToken, isSignedIn]);

  return children;
};

export default function App() {
  console.log('App component rendering...');

  useEffect(() => {
    clearStaleTokens();
    
    // Log the linking URL for debugging
    Linking.getInitialURL().then((url) => {
      console.log('Initial URL:', url);
    }).catch(err => {
      if (__DEV__) console.error('Error getting initial URL:', err);
    });
    
    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
    });
    
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <SafeAreaProvider>
          <ClerkLoaded>
            <AuthProvider>
              <ClerkApiBridge>
                <StatusBar style="light" />
                <AppNavigator />
              </ClerkApiBridge>
            </AuthProvider>
          </ClerkLoaded>
        </SafeAreaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
