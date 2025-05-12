import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Using a try-catch to handle potential module resolution issues
let API_BASE_URL: string | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
} catch (error) {
  console.warn('Could not load environment variables:', error);
}

// Determine the API base URL
const getApiBaseUrl = () => {
  // Override with ngrok URL for development when needed
  if (__DEV__) {
    // Use ngrok URL for direct testing
    const useNgrok = true; // Toggle this when needed
    if (useNgrok) {
      return 'https://22eb-31-142-79-237.ngrok-free.app/api';
    }
    
    // For iOS simulators, use localhost
    if (Platform.OS === 'ios') {
      return 'http://localhost:5260/api';
    }
    
    // For Android emulators, use 10.0.2.2 (Android's special IP for host loopback)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5260/api';
    }
  }
  
  // For production or physical devices, use the environment variable
  return API_BASE_URL || 'http://20.3.195.226/api';
};

// Create the axios instance
const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include the auth token in requests
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log for request URLs in development
    if (__DEV__) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log(`🌐 API Request to: ${config.method?.toUpperCase()} ${fullUrl}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - could trigger logout or token refresh
        // You could emit an event or call a function to handle this
      }
    }
    
    return Promise.reject(error);
  }
);

// API client with auth token management
export const apiClient = {
  setAuthToken: (token: string) => {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  clearAuthToken: () => {
    delete axiosInstance.defaults.headers.common['Authorization'];
  },
  
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },
  
  getStoredRefreshToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('refreshToken');
  },
  
  getUserId: async (): Promise<string | null> => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID from storage:', error);
      return null;
    }
  },
  
  storeTokens: async (token: string, refreshToken?: string): Promise<void> => {
    await AsyncStorage.setItem('token', token);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
    apiClient.setAuthToken(token);
  },
  
  clearTokens: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    apiClient.clearAuthToken();
  },
  
  instance: axiosInstance,
  
  // Store the interceptor ID for token refresh logic
  refreshInterceptorId: -1
};

// Initialize token from storage on app startup
export const initializeApiClient = async () => {
  const token = await apiClient.getStoredToken();
  if (token) {
    apiClient.setAuthToken(token);
  }
}; 