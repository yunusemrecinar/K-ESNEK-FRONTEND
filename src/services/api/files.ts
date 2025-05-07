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
   * @param employeeId Employee ID
   * @param file File to upload
   * @returns File blob ID
   */
  uploadEmployeeProfilePicture: async (employeeId: number, file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employee-profile/upload/profile-picture/${employeeId}`,
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
   * Upload an employee background picture
   * @param employeeId Employee ID
   * @param file File to upload
   * @returns File blob ID
   */
  uploadEmployeeBackgroundPicture: async (employeeId: number, file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employee-profile/upload/background-picture/${employeeId}`,
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
   * Upload an employee CV
   * @param employeeId Employee ID
   * @param file File to upload
   * @returns File blob ID
   */
  uploadEmployeeCV: async (employeeId: number, file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.instance.post<FileUploadResponse>(
      `/employee-profile/upload/cv/${employeeId}`,
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
   * @param file File to upload
   * @returns File blob ID
   */
  uploadEmployerProfilePicture: async (employerId: number, file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
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
   * @param file File to upload
   * @returns File blob ID
   */
  uploadEmployerBackgroundPicture: async (employerId: number, file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
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
    return `${apiClient.instance.defaults.baseURL}/files/download/${fileId}`;
  }
}; 