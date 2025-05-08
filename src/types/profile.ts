/**
 * Base profile interface for all user types
 */
export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  location?: string;
}

/**
 * Employee profile data interface
 */
export interface EmployeeProfile extends UserProfile {
  // User stats summary
  totalProjects: number;
  totalReviews: number;
  averageRating: number;
  yearsOfExperience: number;
  
  // Profile picture reference
  profilePictureId?: number;
  profilePictureUrl?: string;
  
  // Background picture reference
  backgroundPictureId?: number;
  backgroundPictureUrl?: string;
  
  // CV reference
  cvId?: number;
  cvUrl?: string;
}

/**
 * Employer profile data interface
 */
export interface EmployerProfile extends UserProfile {
  // Company information
  name: string;
  description: string;
  industry: string;
  size: string;
  website?: string;
  email?: string;
  
  // User stats summary
  stats?: {
    totalJobsPosted: number;
    activeJobs: number;
    totalApplications: number;
    averageResponseTime: number;
  };
  
  // Profile picture reference
  profilePictureId?: number;
  profilePictureUrl?: string;
  
  // Background picture reference
  backgroundPictureId?: number;
  backgroundPictureUrl?: string;
} 