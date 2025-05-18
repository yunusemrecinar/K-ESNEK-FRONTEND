import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { AccountTypeProvider } from './contexts/AccountTypeContext';
import MainNavigator from './navigation/MainNavigator';
import { clearAsyncStorageBeforeFirstAction } from './utils/storageUtils';

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      // Clear AsyncStorage before any other actions using configurable function
      // In development mode, pass true as the first parameter to force clearing
      // or specify keys to preserve as the second parameter
      await clearAsyncStorageBeforeFirstAction();
      console.log('App initialized');
    };

    initializeApp();
  }, []);
  
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccountTypeProvider>
          <NavigationContainer>
            <PaperProvider>
              <MainNavigator />
            </PaperProvider>
          </NavigationContainer>
        </AccountTypeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App; 