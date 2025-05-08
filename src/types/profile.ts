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