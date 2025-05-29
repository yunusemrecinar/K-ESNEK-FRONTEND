import { apiClient } from './client';

export interface EmployeeReviewDto {
  id: number;
  employeeId: number;
  employeeName: string;
  employerId: number;
  employerName: string;
  rating: number; // 1-5 stars
  comment?: string;
  projectTitle?: string;
  reviewDate: string;
  isVisible: boolean;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface CreateEmployeeReviewDto {
  employeeId: number;
  employerId: number;
  rating: number; // 1-5 stars
  comment?: string;
  projectTitle?: string;
}

export interface EmployeeReviewSummaryDto {
  totalReviews: number;
  averageRating: number;
  recentReviews: EmployeeReviewDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export const employeeReviewsService = {
  /**
   * Get all reviews for a specific employee
   */
  async getEmployeeReviews(employeeId: number, includeHidden: boolean = false): Promise<EmployeeReviewSummaryDto> {
    try {
      const response = await apiClient.instance.get<ApiResponse<EmployeeReviewSummaryDto>>(
        `/employee-reviews/employee/${employeeId}?includeHidden=${includeHidden}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch employee reviews');
      }
    } catch (error: any) {
      console.error('Error fetching employee reviews:', error);
      if (error.response?.status === 404) {
        // Return empty summary if employee not found or no reviews
        return {
          totalReviews: 0,
          averageRating: 0,
          recentReviews: []
        };
      }
      throw error;
    }
  },

  /**
   * Create a new review for an employee
   */
  async createEmployeeReview(reviewData: CreateEmployeeReviewDto): Promise<EmployeeReviewDto> {
    try {
      const response = await apiClient.instance.post<ApiResponse<EmployeeReviewDto>>(
        '/employee-reviews',
        reviewData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create employee review');
      }
    } catch (error: any) {
      console.error('Error creating employee review:', error);
      throw error;
    }
  }
}; 