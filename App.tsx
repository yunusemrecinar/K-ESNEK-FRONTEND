import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { AccountTypeProvider } from './src/contexts/AccountTypeContext';
import { clearAsyncStorageBeforeFirstAction } from './src/utils/storageUtils';

// Import screens (will be created later)
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
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
    <AuthProvider>
      <AccountTypeProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthNavigator} />
                <Stack.Screen name="Main" component={MainNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </AccountTypeProvider>
    </AuthProvider>
  );
} 