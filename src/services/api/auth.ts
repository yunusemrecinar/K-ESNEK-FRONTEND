import { apiClient } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our authentication responses
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  location?: string;
  // Add other user properties as needed
}

// Backend user info format
export interface BackendUserInfo {
  id: number;
  email: string;
  name: string;
}

// Employer-specific data
export interface EmployerData {
  id: number;
  userId: number;
  name: string;
  description: string;
  industry: string;
  size?: string;
  phoneNumber?: string;
  location?: string;
}

// Employee-specific data
export interface EmployeeData {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  location?: string;
  dateOfBirth?: string;
  bio?: string;
  preferredJobTypes?: string;
  preferredLocations?: string;
  currentEmployerId?: number;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: User;
  flag: boolean;
  message: string;
  employerData?: EmployerData;
  employeeData?: EmployeeData;
}

export interface RegisterResponse {
  token: string;
  refreshToken?: string;
  user?: User;
  flag: boolean;
  message: string;
}

export interface RegisterEmployeeRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  location?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  language?: string;
  dateOfBirth?: string;
  currentEmployerId?: number;
  preferredJobTypes?: string;
  preferredLocations?: string;
  minSalaryPreference?: number;
  immediate?: boolean;
  startDate?: string; // Will be converted to DateOnly in backend
}

export interface RegisterEmployerRequest {
  email: string;
  password: string;
  phoneNumber?: string;
  location?: string;
  name: string;
  description: string;
  industry: string;
  size?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Real API implementation
export const authApi = {
  loginEmployee: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // The API expects userName instead of email, based on API testing
      const response = await apiClient.instance.post<LoginResponse>('/identity/employee/login', {
        userName: email, // Use userName as the API expects this parameter
        password,
      });
      
      if (response.data.token) {
        // Use the new token storage method
        await apiClient.storeTokens(response.data.token, response.data.refreshToken);
      }
      
      // Map the backend user info to our frontend User format
      if (response.data.user) {
        const backendUser = response.data.user as unknown as BackendUserInfo;
        response.data.user = {
          id: backendUser.id.toString(),
          email: backendUser.email,
          fullName: backendUser.name
        };
      } else if (response.data.flag) {
        // Fallback only if user info is still missing
        response.data.user = {
          id: 'temp-id',
          email: email,
          fullName: email.split('@')[0] || 'User',
        };
      }
      
      // Store employee data if available
      if (response.data.employeeData) {
        await AsyncStorage.setItem('employeeData', JSON.stringify(response.data.employeeData));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  loginEmployer: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // The API expects userName instead of email, based on API testing
      const response = await apiClient.instance.post<LoginResponse>('/identity/employer/login', {
        userName: email, // Use userName as the API expects this parameter
        password,
      });
      
      if (response.data.token) {
        // Use the new token storage method
        await apiClient.storeTokens(response.data.token, response.data.refreshToken);
      }
      
      // Map the backend user info to our frontend User format
      if (response.data.user) {
        const backendUser = response.data.user as unknown as BackendUserInfo;
        response.data.user = {
          id: backendUser.id.toString(),
          email: backendUser.email,
          fullName: backendUser.name
        };
      } else if (response.data.flag) {
        // Fallback only if user info is still missing
        response.data.user = {
          id: 'temp-id',
          email: email,
          fullName: email.split('@')[0] || 'User',
        };
      }
      
      // Store employer data if available
      if (response.data.employerData) {
        await AsyncStorage.setItem('employerData', JSON.stringify(response.data.employerData));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  registerEmployee: async (data: RegisterEmployeeRequest): Promise<RegisterResponse> => {
    try {
      // Format the data to match what the backend expects
      const payload = {
        UserEmail: data.email, // Capital U as seen in the backend code
        Password: data.password,
        FirstName: data.firstName,
        LastName: data.lastName,
        PhoneNumber: data.phoneNumber,
        Location: data.location,
        EmailNotifications: data.emailNotifications ?? true,
        PushNotifications: data.pushNotifications ?? true,
        SmsNotifications: data.smsNotifications ?? false,
        Language: data.language,
        DateOfBirth: data.dateOfBirth,
        CurrentEmployerId: data.currentEmployerId,
        PreferredJobTypes: data.preferredJobTypes,
        PreferredLocations: data.preferredLocations,
        MinSalaryPreference: data.minSalaryPreference,
        Immediate: data.immediate ?? false,
        StartDate: data.startDate ?? new Date().toISOString().split('T')[0] // Default to today
      };

      const response = await apiClient.instance.post<RegisterResponse>('/identity/employee/register', payload);
      
      if (response.data.token) {
        // Use the new token storage method
        await apiClient.storeTokens(response.data.token, response.data.refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Employee registration failed:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  },

  registerEmployer: async (data: RegisterEmployerRequest): Promise<RegisterResponse> => {
    try {
      // Format the data to match what the backend expects
      const payload = {
        UserEmail: data.email,
        Password: data.password,
        Name: data.name,
        Description: data.description,
        Industry: data.industry,
        Size: data.size,
        PhoneNumber: data.phoneNumber,
        Location: data.location,
        EmailNotifications: data.emailNotifications ?? true,
        PushNotifications: data.pushNotifications ?? true,
        SmsNotifications: data.smsNotifications ?? false
      };

      const response = await apiClient.instance.post<RegisterResponse>('/identity/employer/register', payload);
      
      if (response.data.token) {
        // Use the new token storage method
        await apiClient.storeTokens(response.data.token, response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Employer registration failed:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    // Clear tokens and headers
    await apiClient.clearTokens();
    // Note: Backend might need a logout endpoint to invalidate tokens
    // If so, you can add the API call here
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.instance.post<LoginResponse>('/identity/refreshToken', refreshToken);
    
    if (response.data.token) {
      // Use the new token storage method
      await apiClient.storeTokens(response.data.token, response.data.refreshToken);
    }
    
    return response.data;
  }
};
