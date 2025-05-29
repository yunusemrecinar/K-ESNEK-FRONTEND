import { apiClient } from './client';
import { fileService } from './files';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateApplicationRequest {
  jobId: number;
  coverLetter?: string;
  resumeFileBlobId?: number;
  notes?: string;
}

export interface JobApplication {
  id: number;
  jobId: number;
  userId: number;
  applicationStatus: string;
  coverLetter?: string;
  resumeFileBlobId?: number;
  answers?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data?: T;
  isSuccess: boolean;
  message: string;
}

export const applicationsApi = {
  /**
   * Apply for a job
   * @param application - The application data
   * @returns Promise with application ID if successful
   */
  applyForJob: async (application: CreateApplicationRequest): Promise<ApiResponse<number>> => {
    try {
      const response = await apiClient.instance.post('/applications', application);
      
      if (response.data && response.data.success) {
        return {
          data: response.data.data,
          isSuccess: true,
          message: response.data.message || 'Application submitted successfully'
        };
      } else {
        return {
          isSuccess: false,
          message: response.data?.message || 'Failed to submit application'
        };
      }
    } catch (error: any) {
      console.error('Error applying for job:', error);
      return {
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Get all applications for the current user
   * @returns Promise with applications list
   */
  getUserApplications: async (): Promise<ApiResponse<JobApplication[]>> => {
    try {
      const response = await apiClient.instance.get('/applications/my');
      
      if (response.data && response.data.success) {
        return {
          data: response.data.data,
          isSuccess: true,
          message: 'Applications retrieved successfully'
        };
      } else {
        return {
          data: [],
          isSuccess: false,
          message: response.data?.message || 'Failed to get applications'
        };
      }
    } catch (error: any) {
      console.error('Error getting applications:', error);
      return {
        data: [],
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Get application by ID
   * @param id - Application ID
   * @returns Promise with application data
   */
  getApplicationById: async (id: number): Promise<ApiResponse<JobApplication>> => {
    try {
      const response = await apiClient.instance.get(`/applications/${id}`);
      
      if (response.data && response.data.success) {
        return {
          data: response.data.data,
          isSuccess: true,
          message: 'Application retrieved successfully'
        };
      } else {
        return {
          isSuccess: false,
          message: response.data?.message || 'Failed to get application'
        };
      }
    } catch (error: any) {
      console.error(`Error getting application with ID ${id}:`, error);
      return {
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Upload resume and apply for job
   * @param jobId - Job ID to apply for
   * @param resumeFile - Resume file FormData
   * @param coverLetter - Optional cover letter
   * @param notes - Optional notes
   * @returns Promise with application ID if successful
   */
  uploadResumeAndApply: async (
    jobId: number, 
    resumeFile: FormData,
    coverLetter?: string,
    notes?: string
  ): Promise<ApiResponse<number>> => {
    try {
      // First get the user ID from storage
      const userId = await apiClient.getUserId();
      if (!userId) {
        console.error('User ID not found in storage');
        return {
          isSuccess: false,
          message: 'User not authenticated or ID not found'
        };
      }
      
      try {
        // Upload the resume file using the numeric user ID
        const resumeId = await fileService.uploadEmployeeCV(userId, resumeFile);
        
        // Then apply with the resume ID
        return applicationsApi.applyForJob({
          jobId,
          coverLetter,
          resumeFileBlobId: resumeId,
          notes
        });
      } catch (uploadError: any) {
        console.error('Error during file upload:', uploadError);
        return {
          isSuccess: false,
          message: uploadError.message || 'Error uploading resume'
        };
      }
    } catch (error: any) {
      console.error('Error in uploadResumeAndApply:', error);
      return {
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Withdraw an application
   * @param id - Application ID
   * @returns Promise with success status
   */
  withdrawApplication: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.instance.patch(`/applications/${id}/withdraw`);
      
      if (response.data && response.data.success) {
        return {
          isSuccess: true,
          message: response.data.message || 'Application withdrawn successfully'
        };
      } else {
        return {
          isSuccess: false,
          message: response.data?.message || 'Failed to withdraw application'
        };
      }
    } catch (error: any) {
      console.error(`Error withdrawing application with ID ${id}:`, error);
      return {
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Check if the current user has already applied for a job
   * @param jobId - Job ID to check
   * @returns Promise with boolean indicating if user has applied
   */
  hasAppliedForJob: async (jobId: number): Promise<ApiResponse<boolean>> => {
    try {
      const response = await apiClient.instance.get(`/applications/check/${jobId}`);
      
      if (response.data && response.data.success) {
        return {
          data: response.data.data,
          isSuccess: true,
          message: 'Check completed successfully'
        };
      } else {
        return {
          data: false,
          isSuccess: false,
          message: response.data?.message || 'Failed to check application status'
        };
      }
    } catch (error: any) {
      console.error(`Error checking application status for job ID ${jobId}:`, error);
      // Assume user has not applied in case of error
      return {
        data: false,
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  },

  /**
   * Get all applications for the employer's jobs
   * @returns Promise with applications list
   */
  getEmployerApplications: async (): Promise<ApiResponse<JobApplication[]>> => {
    try {
      // Get employer ID from AsyncStorage
      const employerDataStr = await AsyncStorage.getItem('employerData');
      let employerId = null;
      
      if (employerDataStr) {
        try {
          const employerData = JSON.parse(employerDataStr);
          employerId = employerData.id;
        } catch (parseError) {
          console.error('Error parsing employer data from AsyncStorage:', parseError);
        }
      }
      
      if (!employerId) {
        return {
          data: [],
          isSuccess: false,
          message: 'No employer ID found in AsyncStorage'
        };
      }

      // First get all jobs for this employer
      const jobsResponse = await apiClient.instance.get('/jobs', {
        params: { employerId: employerId }
      });
      
      // Parse jobs response
      let employerJobs: any[] = [];
      if (Array.isArray(jobsResponse.data)) {
        employerJobs = jobsResponse.data;
      } else if (jobsResponse.data && jobsResponse.data.success && Array.isArray(jobsResponse.data.data)) {
        employerJobs = jobsResponse.data.data;
      }
      
      // If no jobs found, return empty array
      if (employerJobs.length === 0) {
        return {
          data: [],
          isSuccess: true,
          message: 'No jobs found for this employer'
        };
      }
      
      // Create a set of job IDs for quick lookup
      const employerJobIds = new Set(employerJobs.map(job => job.id));
      
      // Create a map of job titles by job id for quick lookup
      const jobTitlesById: Record<number, string> = {};
      employerJobs.forEach(job => {
        jobTitlesById[job.id] = job.title;
      });
      
      // Now fetch all applications
      const response = await apiClient.instance.get('/applications');
      
      // Handle the response format
      if (response.data && response.data.success) {
        // Extract applications from response
        const allApplications = response.data.data || [];
        
        // Filter applications to only include those for the employer's jobs
        const employerApplications = allApplications.filter((app: any) => 
          employerJobIds.has(app.jobId)
        );
        
        // Add job title to each application
        const enhancedApplications = employerApplications.map((app: any) => ({
          ...app,
          jobTitle: jobTitlesById[app.jobId] || `Job #${app.jobId}`
        }));
        
        return {
          data: enhancedApplications,
          isSuccess: true,
          message: 'Applications retrieved successfully'
        };
      } else {
        return {
          data: [],
          isSuccess: false,
          message: response.data?.message || 'Failed to get applications'
        };
      }
    } catch (error: any) {
      console.error('Error getting employer applications:', error);
      return {
        data: [],
        isSuccess: false,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred')
      };
    }
  }
}; 