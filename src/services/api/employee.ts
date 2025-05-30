import { apiClient } from './client';
import { EmployeeProfile } from '../../types/profile';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Employee statistics interface
 */
export interface EmployeeStats {
  totalProjects: number;
  totalRatingsSum: number;
  yearsOfExperience: number;
}

/**
 * Employee API service for fetching and managing employee data
 */
export const employeeService = {
  /**
   * Get employee profile data
   * @param userId User ID
   * @returns Employee profile data
   */
  getEmployeeProfile: async (userId: number | string): Promise<EmployeeProfile> => {
    const response = await apiClient.instance.get<ApiResponse<EmployeeProfile>>(
      `/employee-profile/${userId}`
    );
    
    return response.data.data;
  },

  /**
   * Get public employee profile data (accessible by employers)
   * @param userId User ID
   * @returns Employee profile data
   */
  getPublicEmployeeProfile: async (userId: number | string): Promise<EmployeeProfile> => {
    const response = await apiClient.instance.get<ApiResponse<EmployeeProfile>>(
      `/employee-profile/public/${userId}`
    );
    
    return response.data.data;
  },

  /**
   * Get employee user details by employee ID (includes email and other user info)
   * @param employeeId Employee ID (from EmployeeUsers table)
   * @returns Employee user details including email
   */
  getEmployeeUserDetails: async (employeeId: number | string) => {
    const response = await apiClient.instance.get(`/identity/employees/${employeeId}`);
    return response.data;
  },

  /**
   * Try to get enhanced employee profile with user details
   * @param userId User ID  
   * @param employeeId Employee ID (optional)
   * @returns Enhanced employee profile
   */
  getEnhancedEmployeeProfile: async (userId: number | string, employeeId?: number | string): Promise<EmployeeProfile> => {
    try {
      // First, get the basic profile
      const profile = await employeeService.getPublicEmployeeProfile(userId);
      
      // If we have an employee ID, try to get additional user details
      if (employeeId) {
        try {
          const userDetails = await employeeService.getEmployeeUserDetails(employeeId);
          // Merge user details if available
          if (userDetails && userDetails.userId) {
            return {
              ...profile,
              // The userDetails might have additional info we can use
              id: typeof employeeId === 'string' ? parseInt(employeeId, 10) : employeeId,
              userId: userDetails.userId,
            };
          }
        } catch (error) {
          console.log('Could not fetch user details, using basic profile');
        }
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching enhanced employee profile:', error);
      throw error;
    }
  },

  /**
   * Get employee statistics
   * @param userId User ID
   * @returns Employee statistics
   */
  getEmployeeStats: async (userId: number | string): Promise<EmployeeStats> => {
    const response = await apiClient.instance.get<ApiResponse<EmployeeStats>>(
      `/employee-profile/${userId}/stats`
    );
    
    return response.data.data;
  },

  /**
   * Get all employees (for employer search)
   * @returns Array of employee profile data
   */
  getAllEmployees: async (): Promise<EmployeeProfile[]> => {
    try {
      const response = await apiClient.instance.get<EmployeeProfile[]>(
        '/identity/employees'
      );
      
      // The identity/employees endpoint returns a direct array rather than an ApiResponse wrapper
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all employees:', error);
      throw error;
    }
  },

  /**
   * Update employee profile data
   * @param userId User ID
   * @param profile Updated profile data
   * @returns Updated employee profile
   */
  updateEmployeeProfile: async (userId: number | string, profile: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
    const response = await apiClient.instance.put<ApiResponse<EmployeeProfile>>(
      `/employee-profile/${userId}`,
      profile
    );
    
    return response.data.data;
  }
}; 