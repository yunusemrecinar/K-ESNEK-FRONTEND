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
import MessagesScreen from '../screens/main/MessagesScreen';
import JobDetailsScreen from '../screens/hiring/JobDetailsScreen';
import JobApplicantsScreen from '../screens/hiring/JobApplicantsScreen';
// Import the new search employees screen
import SearchEmployeeScreen from '../screens/hiring/SearchEmployeeScreen';
// Import the working screen for now - we'll create a hiring version later
import ApplicationDetailsScreen from '../screens/hiring/ApplicationDetailsScreen';
import ApplicantProfileScreen from '../screens/hiring/ApplicantProfileScreen';

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
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HiringHomeScreen} />
      <Tab.Screen name="Search" component={SearchEmployeeScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
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
      <Stack.Screen name="Applications" component={ApplicationsScreen} />
      <Stack.Screen name="ApplicationDetails" component={ApplicationDetailsScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="ApplicantProfile" component={ApplicantProfileScreen} />
    </Stack.Navigator>
  );
};

export default HiringNavigator; 