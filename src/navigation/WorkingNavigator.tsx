import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import your working-specific screens here
import WorkingHomeScreen from '../screens/working/WorkingHomeScreen';
import JobSearchScreen from '../screens/working/JobSearchScreen';
import ApplicationsScreen from '../screens/working/ApplicationsScreen';
import WorkingProfileScreen from '../screens/working/WorkingProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import CategoryScreen from '../screens/categories/CategoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const WorkingTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Applications') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={WorkingHomeScreen} />
      <Tab.Screen name="Search" component={JobSearchScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Profile" component={WorkingProfileScreen} />
    </Tab.Navigator>
  );
};

const WorkingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WorkingTabs" component={WorkingTabNavigator} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default WorkingNavigator; 