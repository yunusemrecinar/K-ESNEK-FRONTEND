import { apiClient } from './client';

// Types based on backend model
export interface JobRecommendationDto {
  recommendedJobId: number;
  recommendedJobTitle: string;
  employerId: number;
  employerName: string;
  score: number;
  matchingSkills?: string[];
}

export interface UserRecommendationDto {
  recommendedUserId: number;
  recommendedUserName?: string;
  recommendedUserTitle?: string;
  score: number;
  matchingSkills?: string[];
}

// API Response type
export interface ApiResponse<T> {
  data: T;
  message: string;
  isSuccess: boolean;
}

// Recommendations API service
export const recommendationsApi = {
  // Get recommended jobs for user
  getRecommendedJobsForUser: async (userId: number): Promise<ApiResponse<JobRecommendationDto[]>> => {
    try {
      const response = await apiClient.instance.get(`/recommendations/jobs/for-user/${userId}`);
      
      // Handle the case where API returns a string that starts with "[{"
      if (typeof response.data === 'string' && response.data.startsWith('[{')) {
        try {
          const parsedData = JSON.parse(response.data);
          if (Array.isArray(parsedData)) {
            return {
              data: parsedData,
              message: 'Warning: API returned stringified JSON but it was parsed',
              isSuccess: true
            };
          }
        } catch (parseError) {
          console.error('Failed to parse stringified JSON:', parseError);
        }
      }
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        const recommendationData = response.data.data || [];
        return {
          data: recommendationData,
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else if (Array.isArray(response.data)) {
        // Handle case where response is a direct array of recommendations (no wrapper object)
        return {
          data: response.data,
          message: 'Success',
          isSuccess: true
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
      console.error(`Error fetching recommended jobs for user ${userId}:`, error);
      return {
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  },

  // Get recommended users for employer
  getRecommendedUsersForEmployer: async (employerId: number): Promise<ApiResponse<UserRecommendationDto[]>> => {
    console.log('Fetching recommended users for employer:', employerId);
    try {
      const response = await apiClient.instance.get(`/recommendations/users/for-employer/${employerId}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
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
    } catch (error: any) {
      console.error(`Error fetching recommended users for employer ${employerId}:`, error);
      
      // Log detailed error information
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('HTTP Headers:', error.response.headers);
        console.error('Response Data:', error.response.data);
        console.error('Request Config:', error.config);
      }
      
      let errorMessage = 'Unknown error occurred';
      if (error.response?.status === 400) {
        errorMessage = `Bad Request (400): ${error.response.data?.message || error.response.data || 'Invalid request parameters'}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized (401): Please log in again';
      } else if (error.response?.status === 403) {
        errorMessage = 'Forbidden (403): You don\'t have permission to access this resource';
      } else if (error.response?.status === 404) {
        errorMessage = 'Not Found (404): Endpoint not found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Internal Server Error (500): Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        data: [],
        message: errorMessage,
        isSuccess: false
      };
    }
  },
  
  // Trigger recommendation generation (admin only)
  generateRecommendations: async (): Promise<ApiResponse<boolean>> => {
    try {
      const response = await apiClient.instance.post('/recommendations/generate');
      
      // Map backend response format to frontend expected format
      if (response.data && typeof response.data.success === 'boolean') {
        return {
          data: response.data.data || false,
          message: response.data.message || '',
          isSuccess: response.data.success
        };
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          data: false,
          message: 'Invalid response format from API',
          isSuccess: false
        };
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        data: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        isSuccess: false
      };
    }
  }
}; 