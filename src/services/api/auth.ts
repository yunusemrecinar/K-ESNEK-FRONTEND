import { apiClient } from './client';

// Types for our authentication responses
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  location?: string;
  // Add other user properties as needed
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: User;
  flag: boolean;
  message: string;
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
      
      // Add fallback for potentially missing user object
      if (!response.data.user && response.data.flag) {
        // Create a default user object if it's missing
        response.data.user = {
          id: 'temp-id',
          email: email,
          fullName: email.split('@')[0] || 'User',
        };
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
      
      // Add fallback for potentially missing user object
      if (!response.data.user && response.data.flag) {
        // Create a default user object if it's missing
        response.data.user = {
          id: 'temp-id',
          email: email,
          fullName: email.split('@')[0] || 'User',
        };
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
        ...data,
        userName: data.email, // Make sure userName is included if the API expects it
        UserEmail: data.email, // Add UserEmail field required by backend
        fullName: `${data.firstName} ${data.lastName}`.trim()
      };

      console.log('Registering employee with payload:', JSON.stringify(payload));
      
      const response = await apiClient.instance.post<RegisterResponse>('/identity/employee/register', payload);
      
      if (response.data.token) {
        // Use the new token storage method
        await apiClient.storeTokens(response.data.token, response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Employee registration failed:', error);
      throw error;
    }
  },

  registerEmployer: async (data: RegisterEmployerRequest): Promise<RegisterResponse> => {
    try {
      // Format the data to match what the backend expects
      const payload = {
        ...data,
        userName: data.email, // Make sure userName is included if the API expects it
        UserEmail: data.email, // Add UserEmail field required by backend
      };

      console.log('Registering employer with payload:', JSON.stringify(payload));
      
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
