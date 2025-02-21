import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { AccountTypeProvider } from './contexts/AccountTypeContext';
import MainNavigator from './navigation/MainNavigator';

const App = () => {
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