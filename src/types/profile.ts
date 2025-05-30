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
 * Service offered by an employee
 */
export interface EmployeeService {
  id?: number;
  name: string;
  price?: string;
  icon: string;
}

/**
 * Employee profile data interface
 */
export interface EmployeeProfile extends UserProfile {
  // Identity field (sometimes returned from backend instead of userId)
  id?: number;
  
  // Optional email field (may be available in some contexts)
  email?: string;
  
  // User stats summary
  totalProjects: number;
  totalReviews: number;
  averageRating: number;
  yearsOfExperience: number;
  
  // Bio/About information
  bio?: string;
  
  // Services offered - can be either a string (from API) or parsed array
  services?: EmployeeService[] | string;
  
  // Skills and certifications
  certifications?: string[];
  
  // Profile picture reference
  profilePictureId?: number;
  profilePictureUrl?: string;
  
  // Background picture reference
  backgroundPictureId?: number;
  backgroundPictureUrl?: string;
  
  // CV reference
  cvId?: number;
  cvUrl?: string;
  
  // Timestamps (may be available from some endpoints)
  createdAt?: string;
  lastUpdatedAt?: string;
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