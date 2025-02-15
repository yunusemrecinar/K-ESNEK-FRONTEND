import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import CategoryScreen from '../screens/categories/CategoryScreen';
import ChatScreen from '../screens/main/ChatScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  Category: {
    categoryId: string;
    title: string;
  };
  Chat: {
    userId: string;
  };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator; 