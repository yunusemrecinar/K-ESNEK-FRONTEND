import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import your hiring-specific screens here
import HiringHomeScreen from '../screens/hiring/HiringHomeScreen';
import PostJobScreen from '../screens/hiring/PostJobScreen';
import ApplicationsScreen from '../screens/hiring/ApplicationsScreen';
import HiringProfileScreen from '../screens/hiring/HiringProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import JobDetailsScreen from '../screens/hiring/JobDetailsScreen';
import JobApplicantsScreen from '../screens/hiring/JobApplicantsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HiringTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PostJob') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Applications') {
            iconName = focused ? 'documents' : 'documents-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HiringHomeScreen} />
      <Tab.Screen name="PostJob" component={PostJobScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Profile" component={HiringProfileScreen} />
    </Tab.Navigator>
  );
};

const HiringNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HiringTabs" component={HiringTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="JobApplicants" component={JobApplicantsScreen} />
    </Stack.Navigator>
  );
};

export default HiringNavigator; 