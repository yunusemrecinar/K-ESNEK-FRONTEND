import { apiClient } from './client';

// Types based on backend model
export interface JobRequirement {
  requirement: string;
}

export interface JobResponsibility {
  responsibility: string;
}

export interface JobBenefit {
  benefit: string;
}

export interface JobSkill {
  skill: string;
}

export interface JobCategory {
  id: number;
  name: string;
  description?: string;
}

export interface CreateJobRequest {
  employerId?: number;
  title: string;
  description: string;
  categoryId: number;
  jobLocationType?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  minSalary: number;
  maxSalary: number;
  jobRequirements: JobRequirement[];
  jobResponsibilities: JobResponsibility[];
  jobBenefits: JobBenefit[];
  jobSkills: JobSkill[];
  employmentType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  jobStatus?: string;
  applicationDeadline?: Date;
}

export interface JobResponse {
  id: number;
  employerId: number;
  title: string;
  description: string;
  categoryId: number;
  jobLocationType?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  minSalary: number;
  maxSalary: number;
  jobRequirements: JobRequirement[];
  jobResponsibilities: JobResponsibility[];
  jobBenefits: JobBenefit[];
  jobSkills: JobSkill[];
  employmentType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  jobStatus?: string;
  applicationDeadline?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  isSuccess: boolean;
}

// Job API service
export const jobsApi = {
  getAllJobs: async (): Promise<ApiResponse<JobResponse[]>> => {
    try {
      const response = await apiClient.instance.get('/jobs');
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || [],
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: [],
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  getJobById: async (id: number): Promise<ApiResponse<JobResponse>> => {
    try {
      const response = await apiClient.instance.get(`/jobs/${id}`);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || {},
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: {} as JobResponse,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error(`Error fetching job with ID ${id}:`, error);
      return {
        data: {} as JobResponse,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  createJob: async (job: CreateJobRequest): Promise<ApiResponse<number>> => {
    try {
      const response = await apiClient.instance.post('/jobs', job);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || 0,
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: 0,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        data: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  updateJob: async (id: number, job: Partial<CreateJobRequest>): Promise<ApiResponse<void>> => {
    try {
      // Create a shallow copy for modifications and include the id in the payload
      const jobData = { 
        ...job,
        id: id.toString() // API requires id as string in the request body
      };
      
      // Convert date to ISO string if it's a Date object
      if (job.applicationDeadline instanceof Date) {
        // @ts-ignore - We know applicationDeadline is a Date from the condition above
        jobData.applicationDeadline = job.applicationDeadline.toISOString();
      }
      
      const response = await apiClient.instance.patch(`/jobs/${id}`, jobData);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: undefined,
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: undefined,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error: any) {
      console.error(`Error updating job with ID ${id}:`, error);
      return {
        data: undefined,
        message: error.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error occurred'),
        isSuccess: false
      };
    }
  },

  deleteJob: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.instance.delete(`/jobs/${id}`);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: undefined,
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: undefined,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error(`Error deleting job with ID ${id}:`, error);
      return {
        data: undefined,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },
};

// Categories API service
export const categoriesApi = {
  getAllCategories: async (): Promise<ApiResponse<JobCategory[]>> => {
    try {
      const response = await apiClient.instance.get('/categories');
      
      // Check if the response has the expected structure
      if (response.data && typeof response.data.success === 'boolean') {
        // Map backend response format to frontend expected format
        return {
          data: response.data.data || [],
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: [],
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  getCategoryById: async (id: number): Promise<ApiResponse<JobCategory>> => {
    try {
      const response = await apiClient.instance.get(`/categories/${id}`);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || {},
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: {} as JobCategory,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      return {
        data: {} as JobCategory,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  getCategoryWithJobs: async (id: number): Promise<ApiResponse<JobCategory & { jobs: JobResponse[] }>> => {
    try {
      const response = await apiClient.instance.get(`/categories/${id}/jobs`);
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || {},
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: {} as (JobCategory & { jobs: JobResponse[] }),
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error(`Error fetching category with jobs for ID ${id}:`, error);
      return {
        data: {} as (JobCategory & { jobs: JobResponse[] }),
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },
}; 