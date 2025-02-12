import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import MainTabNavigator from './navigation/MainTabNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <PaperProvider>
        <MainTabNavigator />
      </PaperProvider>
    </NavigationContainer>
  );
};

export default App; 