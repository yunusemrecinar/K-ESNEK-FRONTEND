import { apiClient } from './client';
import { EmployeeProfile } from '../../types/profile';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
  }
}; 