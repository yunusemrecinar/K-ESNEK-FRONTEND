/**
 * API Endpoints and Types Documentation
 * This file contains all the API endpoints, request/response types, and authentication requirements
 */

// Base URL Configuration
export const API_BASE_URL = 'https://api.kesnek.com/v1'; // Replace with actual base URL

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  LOGOUT: '/auth/logout',
} as const;

// User Endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/change-password',
  UPDATE_PREFERENCES: '/user/preferences',
} as const;

// Job Management Endpoints
export const JOB_ENDPOINTS = {
  GET_JOBS: '/jobs',
  GET_JOB_BY_ID: '/jobs/:id',
  CREATE_JOB: '/jobs',
  UPDATE_JOB: '/jobs/:id',
  DELETE_JOB: '/jobs/:id',
  SEARCH_JOBS: '/jobs/search',
  GET_RECOMMENDED_JOBS: '/jobs/recommended',
  GET_EMPLOYER_JOBS: '/jobs/employer/:employerId',
  TOGGLE_JOB_STATUS: '/jobs/:id/toggle-status',
} as const;

// Application Management Endpoints
export const APPLICATION_ENDPOINTS = {
  GET_APPLICATIONS: '/applications',
  GET_APPLICATION_BY_ID: '/applications/:id',
  CREATE_APPLICATION: '/applications',
  UPDATE_APPLICATION: '/applications/:id',
  GET_USER_APPLICATIONS: '/applications/user/:userId',
  GET_JOB_APPLICATIONS: '/applications/job/:jobId',
  UPDATE_APPLICATION_STATUS: '/applications/:id/status',
  WITHDRAW_APPLICATION: '/applications/:id/withdraw',
} as const;

// Category Management Endpoints
export const CATEGORY_ENDPOINTS = {
  GET_CATEGORIES: '/categories',
  GET_CATEGORY_BY_ID: '/categories/:id',
  CREATE_CATEGORY: '/categories',
  UPDATE_CATEGORY: '/categories/:id',
  DELETE_CATEGORY: '/categories/:id',
  GET_CATEGORY_JOBS: '/categories/:id/jobs',
  GET_POPULAR_CATEGORIES: '/categories/popular',
} as const;

// Profile Management Endpoints
export const PROFILE_ENDPOINTS = {
  // Worker Profile
  GET_WORKER_PROFILE: '/profiles/worker/:userId',
  UPDATE_WORKER_PROFILE: '/profiles/worker/:userId',
  UPDATE_WORK_EXPERIENCE: '/profiles/worker/:userId/experience',
  UPDATE_EDUCATION: '/profiles/worker/:userId/education',
  UPDATE_SKILLS: '/profiles/worker/:userId/skills',
  UPDATE_CERTIFICATES: '/profiles/worker/:userId/certificates',
  
  // Employer Profile
  GET_EMPLOYER_PROFILE: '/profiles/employer/:userId',
  UPDATE_EMPLOYER_PROFILE: '/profiles/employer/:userId',
  UPDATE_COMPANY_INFO: '/profiles/employer/:userId/company',
  GET_EMPLOYER_STATS: '/profiles/employer/:userId/stats',
} as const;

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin';
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  deviceToken?: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin';
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// User Types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: File;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Error Response Type
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

// API Response Wrapper Type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError;
}

// Authentication Header Type
export interface AuthHeader {
  Authorization: string;
}

// Job Types
export interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  categoryId: string;
  location: {
    type: 'remote' | 'on-site' | 'hybrid';
    address?: string;
    city?: string;
    country?: string;
  };
  requirements: string[];
  responsibilities: string[];
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  educationLevel?: 'high-school' | 'bachelor' | 'master' | 'phd';
  status: 'draft' | 'published' | 'closed' | 'archived';
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  categoryId: string;
  location: {
    type: 'remote' | 'on-site' | 'hybrid';
    address?: string;
    city?: string;
    country?: string;
  };
  requirements: string[];
  responsibilities: string[];
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  educationLevel?: 'high-school' | 'bachelor' | 'master' | 'phd';
  applicationDeadline?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: 'draft' | 'published' | 'closed' | 'archived';
}

// Application Types
export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  coverLetter?: string;
  resume: {
    url: string;
    filename: string;
  };
  answers?: Record<string, string>; // For job-specific questions
  notes?: string; // Employer notes
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  jobId: string;
  coverLetter?: string;
  resume: File;
  answers?: Record<string, string>;
}

export interface UpdateApplicationStatusRequest {
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  notes?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  jobCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

// Profile Types
export interface WorkerProfile extends UserProfile {
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certificates: Certificate[];
  preferredJobTypes: ('full-time' | 'part-time' | 'contract' | 'temporary')[];
  preferredLocations: string[];
  preferredSalary?: {
    min: number;
    currency: string;
  };
  availability: {
    immediate: boolean;
    startDate?: string;
  };
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface EmployerProfile extends UserProfile {
  company: {
    name: string;
    description: string;
    industry: string;
    size: string;
    website?: string;
    logo?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
  };
  stats: {
    totalJobsPosted: number;
    activeJobs: number;
    totalApplications: number;
    averageResponseTime: number;
  };
}

/**
 * API Usage Examples:
 * 
 * Login:
 * POST ${API_BASE_URL}${AUTH_ENDPOINTS.LOGIN}
 * Headers: { "Content-Type": "application/json" }
 * Body: LoginRequest
 * Response: ApiResponse<LoginResponse>
 * 
 * Register:
 * POST ${API_BASE_URL}${AUTH_ENDPOINTS.REGISTER}
 * Headers: { "Content-Type": "application/json" }
 * Body: RegisterRequest
 * Response: ApiResponse<RegisterResponse>
 * 
 * Get User Profile:
 * GET ${API_BASE_URL}${USER_ENDPOINTS.GET_PROFILE}
 * Headers: { "Authorization": "Bearer ${accessToken}" }
 * Response: ApiResponse<UserProfile>
 * 
 * Create Job:
 * POST ${API_BASE_URL}${JOB_ENDPOINTS.CREATE_JOB}
 * Headers: {
 *   "Content-Type": "application/json",
 *   "Authorization": "Bearer ${accessToken}"
 * }
 * Body: CreateJobRequest
 * Response: ApiResponse<Job>
 * 
 * Submit Application:
 * POST ${API_BASE_URL}${APPLICATION_ENDPOINTS.CREATE_APPLICATION}
 * Headers: {
 *   "Content-Type": "multipart/form-data",
 *   "Authorization": "Bearer ${accessToken}"
 * }
 * Body: CreateApplicationRequest
 * Response: ApiResponse<Application>
 * 
 * Update Worker Profile:
 * PUT ${API_BASE_URL}${PROFILE_ENDPOINTS.UPDATE_WORKER_PROFILE}
 * Headers: {
 *   "Content-Type": "application/json",
 *   "Authorization": "Bearer ${accessToken}"
 * }
 * Body: Partial<WorkerProfile>
 * Response: ApiResponse<WorkerProfile>
 */ 