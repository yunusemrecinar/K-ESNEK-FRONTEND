// This is a mock implementation that will be replaced with real API client later
export const apiClient = {
  setAuthToken: (token: string) => {
    // Mock implementation - store token if needed
    console.log('Auth token set:', token);
  },
  
  clearAuthToken: () => {
    // Mock implementation - clear token if needed
    console.log('Auth token cleared');
  }
}; 