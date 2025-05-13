import { apiClient } from './client';

interface FileUploadResponse {
  success: boolean;
  message: string;
  data: number; // File blob ID
}

/**
 * Service to handle file uploads and management
 */
export const fileService = {
  /**
   * Upload an employee profile picture
   * @param userId User ID
   * @param formData FormData containing the file to upload
   * @returns File blob ID
   */
  uploadEmployeeProfilePicture: async (userId: number | string, formData: FormData): Promise<number> => {
    try {
      const endpoint = `/employee-profile/upload/profile-picture/${userId}`;
      
      const response = await apiClient.instance.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Profile picture upload failed:', error);
      throw error;
    }
  },
  
  /**
   * Upload an employee background picture
   * @param userId User ID
   * @param formData FormData containing the file to upload
   * @returns File blob ID
   */
  uploadEmployeeBackgroundPicture: async (userId: number | string, formData: FormData): Promise<number> => {
    try {
      const endpoint = `/employee-profile/upload/background-picture/${userId}`;
      
      const response = await apiClient.instance.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Background picture upload failed:', error);
      throw error;
    }
  },
  
  /**
   * Upload an employee CV
   * @param userId User ID
   * @param formData FormData containing the file to upload
   * @returns File blob ID
   */
  uploadEmployeeCV: async (userId: number | string, formData: FormData): Promise<number> => {
    try {
      // Use the direct files upload endpoint instead of the employee-profile endpoint
      // This avoids validation issues with the user ID
      const endpoint = `/files/upload`;
      
      // Log form data contents (debugging)
      if (__DEV__) {
        // @ts-ignore
        for (const [key, value] of formData._parts) {
          const valueInfo = typeof value === 'object' ? 
            `${value.name}, type: ${value.type}, size: ${value.size || 'unknown'}` : 
            value;
        }
      }
      
      const response = await apiClient.instance.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ CV upload failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Upload an employer profile picture
   * @param employerId Employer ID
   * @param formData FormData containing the file to upload
   * @returns File blob ID
   */
  uploadEmployerProfilePicture: async (employerId: number, formData: FormData): Promise<number> => {
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employer-profile/upload/profile-picture/${employerId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  },
  
  /**
   * Upload an employer background picture
   * @param employerId Employer ID
   * @param formData FormData containing the file to upload
   * @returns File blob ID
   */
  uploadEmployerBackgroundPicture: async (employerId: number, formData: FormData): Promise<number> => {
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employer-profile/upload/background-picture/${employerId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  },
  
  /**
   * Get file download URL
   * @param fileId File blob ID
   * @returns URL to download the file
   */
  getFileUrl: (fileId: number): string => {
    // Use ngrok URL instead of localhost for direct file access
    const ngrokBaseUrl = 'https://e027-176-233-28-176.ngrok-free.app';
    return `${ngrokBaseUrl}/api/files/download/${fileId}`;
  }
}; 