import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WorkingHomeScreen from '../screens/working/WorkingHomeScreen';
import WorkingProfileScreen from '../screens/working/WorkingProfileScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import JobSearchScreen from '../screens/working/JobSearchScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={WorkingHomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="home"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : undefined}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={JobSearchScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : undefined}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="message-outline"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : undefined}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WorkingProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="account-outline"
                size={24}
                color={color}
                style={focused ? styles.activeIcon : undefined}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
  },
  activeIcon: {
    backgroundColor: '#F0EFFF',
    padding: 8,
    borderRadius: 8,
  },
});

export default MainTabNavigator; 