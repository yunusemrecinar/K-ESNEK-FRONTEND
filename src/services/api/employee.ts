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