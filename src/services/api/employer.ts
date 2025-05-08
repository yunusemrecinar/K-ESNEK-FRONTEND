import { apiClient } from './client';
import { ApiResponse } from '../../config/api.types';
import { EmployerProfile } from '../../types/profile';

/**
 * Employer API service for fetching and managing employer data
 */
export const employerService = {
  /**
   * Get employer profile data
   * @param userId User ID
   * @returns Employer profile data
   */
  getEmployerProfile: async (userId: number | string): Promise<EmployerProfile> => {
    const response = await apiClient.instance.get<ApiResponse<EmployerProfile>>(
      `/employer-profile/${userId}`
    );
    
    return response.data.data;
  },

  /**
   * Update employer profile data
   * @param userId User ID
   * @param profile Updated profile data
   * @returns Updated employer profile
   */
  updateEmployerProfile: async (userId: number | string, profile: Partial<EmployerProfile>): Promise<EmployerProfile> => {
    const response = await apiClient.instance.put<ApiResponse<EmployerProfile>>(
      `/employer-profile/${userId}`,
      profile
    );
    
    return response.data.data;
  }
}; 