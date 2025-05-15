import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  role: string;
  // Add other properties as needed
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // Get user from AsyncStorage
        const userJson = await AsyncStorage.getItem('user');
        const accountType = await AsyncStorage.getItem('accountType');
        
        console.log('User from AsyncStorage:', userJson);
        console.log('Account type from AsyncStorage:', accountType);
        
        if (userJson) {
          const parsedUser = JSON.parse(userJson);
          
          // Make sure the role is included in the user object
          // Convert accountType to the format expected by the recommendation system
          if (accountType) {
            // Map accountType to the role needed for recommendations
            // The backend expects 'Employee' or 'Employer' (capitalized)
            parsedUser.role = accountType === 'employee' ? 'Employee' : 'Employer';
          }
          
          console.log('User with role for recommendations:', parsedUser);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading, error };
}; 