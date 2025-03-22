import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { LoginResponse, authApi } from './auth';

/**
 * Manages token refresh and authentication state
 */
export const tokenUtils = {
  /**
   * Attempts to refresh the JWT token using the refresh token
   * @returns Promise<boolean> True if refresh was successful, false otherwise
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      // Get the stored refresh token
      const refreshToken = await apiClient.getStoredRefreshToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Attempt to refresh the token
      const response = await authApi.refreshToken(refreshToken);
      
      if (response.flag && response.token) {
        // Store the new tokens
        await apiClient.storeTokens(response.token, response.refreshToken);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Sets up an axios interceptor to handle 401 Unauthorized errors by attempting token refresh
   */
  setupTokenRefreshInterceptor: () => {
    // Remove any existing interceptors first to avoid duplicates
    apiClient.instance.interceptors.response.eject(apiClient.refreshInterceptorId);
    
    // Add a new interceptor for handling token refresh
    apiClient.refreshInterceptorId = apiClient.instance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If we get a 401 Unauthorized error and haven't already tried to refresh
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          originalRequest.url !== '/identity/refreshToken'
        ) {
          originalRequest._retry = true;
          
          // Try to refresh the token
          const refreshSuccess = await tokenUtils.refreshToken();
          
          if (refreshSuccess) {
            // Get the new token
            const newToken = await apiClient.getStoredToken();
            
            // Update the failed request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request with the new token
            return apiClient.instance(originalRequest);
          }
          
          // If refresh failed, clear tokens and force user to login again
          await apiClient.clearTokens();
          
          // Trigger an app-wide event to notify about authentication failure
          // This could be implemented with a global event emitter or context
          if (tokenUtils.onAuthenticationFailure) {
            tokenUtils.onAuthenticationFailure();
          }
        }
        
        return Promise.reject(error);
      }
    );
  },
  
  /**
   * Callback to be triggered when authentication fails completely
   * This should be set by the app initialization code
   */
  onAuthenticationFailure: null as (() => void) | null,
  
  /**
   * Initialize the token utilities
   * @param onAuthFailure Callback to execute when auth fails even after refresh
   */
  initialize: (onAuthFailure?: () => void) => {
    if (onAuthFailure) {
      tokenUtils.onAuthenticationFailure = onAuthFailure;
    }
    
    tokenUtils.setupTokenRefreshInterceptor();
  }
}; 