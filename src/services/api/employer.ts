import { apiClient } from './client';
import { ApiResponse } from '../../config/api.types';
import { EmployerProfile } from '../../types/profile';

// Define the command structure that matches backend expectations
interface UpdateEmployerProfileCommand {
  EmployerId: number;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Location?: string;
  Name?: string;
  Description?: string;
  Industry?: string;
  Size?: string;
  Website?: string;
  // Email is not included as it's not updatable by users
}

// Define the employer stats interface
interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  hired: number;
}

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
  updateEmployerProfile: async (userId: number | string, profile: UpdateEmployerProfileCommand): Promise<EmployerProfile> => {
    const response = await apiClient.instance.put<ApiResponse<EmployerProfile>>(
      `/employer-profile/${userId}`,
      profile
    );
    
    return response.data.data;
  },

  /**
   * Get employer statistics
   * @param userId User ID
   * @returns Employer statistics
   */
  getEmployerStats: async (userId: number | string): Promise<EmployerStats> => {
    const response = await apiClient.instance.get<ApiResponse<EmployerStats>>(
      `/employer-profile/${userId}/stats`
    );
    
    return response.data.data;
  }
}; 