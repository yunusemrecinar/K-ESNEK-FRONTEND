import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const AccountTypeScreen = ({ navigation }: Props) => {
  const handleSelection = (type: 'client' | 'freelancer') => {
    // Here you would typically update the user's profile with their selected type
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Choose your account type
        </Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleSelection('client')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={40}
              color="#6C63FF"
            />
          </View>
          <Text variant="titleLarge" style={styles.optionTitle}>
            I want to hire
          </Text>
          <Text variant="bodyMedium" style={styles.optionDescription}>
            Post jobs and hire talented professionals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleSelection('freelancer')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="account-tie-outline"
              size={40}
              color="#6C63FF"
            />
          </View>
          <Text variant="titleLarge" style={styles.optionTitle}>
            I want to work
          </Text>
          <Text variant="bodyMedium" style={styles.optionDescription}>
            Find work and grow your career
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  option: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  optionDescription: {
    textAlign: 'center',
    color: '#666',
  },
});

export default AccountTypeScreen; 