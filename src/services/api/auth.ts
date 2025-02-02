// Types for our authentication responses
export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse extends LoginResponse {}

// Mock API implementation
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock successful response
    return {
      token: `mock-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        email,
        fullName: 'Mock User'
      }
    };
  },

  register: async (
    fullName: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock successful response
    return {
      token: `mock-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        email,
        fullName
      }
    };
  },

  logout: async (): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Always succeeds
    return;
  }
}; 