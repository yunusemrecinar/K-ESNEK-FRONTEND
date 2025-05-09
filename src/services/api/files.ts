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
      console.log(`📤 Uploading profile picture for user ${userId}`);
      const endpoint = `/employee-profile/upload/profile-picture/${userId}`;
      console.log(`🔗 Endpoint: ${endpoint}`);
      
      const response = await apiClient.instance.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log(`✅ Upload success, File ID: ${response.data.data}`);
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
      console.log(`📤 Uploading background picture for user ${userId}`);
      const endpoint = `/employee-profile/upload/background-picture/${userId}`;
      console.log(`🔗 Endpoint: ${endpoint}`);
      
      const response = await apiClient.instance.post<FileUploadResponse>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log(`✅ Upload success, File ID: ${response.data.data}`);
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
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employee-profile/upload/cv/${userId}`,
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
    const ngrokBaseUrl = 'https://42c6-176-233-28-176.ngrok-free.app';
    return `${ngrokBaseUrl}/api/files/download/${fileId}`;
  }
}; 