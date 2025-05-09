import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import axios from 'axios';

// Types
export interface SavedJob {
  id: number;
  title: string;
  companyName?: string;
  minSalary: number;
  maxSalary: number;
  currency?: string;
  city?: string;
  country?: string;
  jobLocationType?: string;
  employmentType?: string;
  savedAt: string;
}

const BASE_STORAGE_KEY = 'saved_jobs';
const API_AVAILABLE = true; // Set to true now that the backend endpoint is implemented

// Helper function to get user-specific storage key
const getUserStorageKey = async (): Promise<string> => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return `${BASE_STORAGE_KEY}_${user.id}`;
    }
  } catch (error) {
    console.error('Error getting user from AsyncStorage:', error);
  }
  return BASE_STORAGE_KEY; // Fallback to base key if no user
};

// Helper function to clear all saved jobs from AsyncStorage (for logout)
export const clearSavedJobsStorage = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const savedJobsKeys = keys.filter(key => key.startsWith(BASE_STORAGE_KEY));
  if (savedJobsKeys.length > 0) {
    await AsyncStorage.multiRemove(savedJobsKeys);
  }
};

export const savedJobsApi = {
  // Save a job
  saveJob: async (job: Omit<SavedJob, 'savedAt'>): Promise<boolean> => {
    try {
      // Get current saved jobs
      const savedJobs = await getSavedJobs();
      
      // Check if job is already saved
      if (savedJobs.some(savedJob => savedJob.id === job.id)) {
        return true; // Job already saved
      }
      
      // Add new job to saved jobs
      const newSavedJob: SavedJob = {
        ...job,
        savedAt: new Date().toISOString(),
      };
      
      const updatedSavedJobs = [...savedJobs, newSavedJob];
      
      // Save to AsyncStorage with user-specific key
      const storageKey = await getUserStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedSavedJobs));
      
      // Save to backend if API is available
      if (API_AVAILABLE) {
        try {
          await apiClient.instance.post('/saved-jobs', { jobId: job.id });
        } catch (backendError) {
          if (!axios.isAxiosError(backendError) || backendError.response?.status !== 404) {
            console.error('Failed to save job to backend:', backendError);
          }
          // Continue with local storage if backend fails or isn't implemented yet
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving job:', error);
      return false;
    }
  },
  
  // Remove a saved job
  unsaveJob: async (jobId: number): Promise<boolean> => {
    try {
      // Get current saved jobs
      const savedJobs = await getSavedJobs();
      
      // Filter out the job to remove
      const updatedSavedJobs = savedJobs.filter(job => job.id !== jobId);
      
      // Save to AsyncStorage with user-specific key
      const storageKey = await getUserStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedSavedJobs));
      
      // Remove from backend if API is available
      if (API_AVAILABLE) {
        try {
          await apiClient.instance.delete(`/saved-jobs/${jobId}`);
        } catch (backendError) {
          if (!axios.isAxiosError(backendError) || backendError.response?.status !== 404) {
            console.error('Failed to remove job from backend:', backendError);
          }
          // Continue with local storage if backend fails or isn't implemented yet
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error removing saved job:', error);
      return false;
    }
  },
  
  // Check if a job is saved
  isJobSaved: async (jobId: number): Promise<boolean> => {
    try {
      const savedJobs = await getSavedJobs();
      return savedJobs.some(job => job.id === jobId);
    } catch (error) {
      console.error('Error checking if job is saved:', error);
      return false;
    }
  },
  
  // Get all saved jobs
  getAllSavedJobs: async (): Promise<SavedJob[]> => {
    try {
      // If API is not available or disabled, use local storage only
      if (!API_AVAILABLE) {
        return getSavedJobs();
      }
      
      // Try to get saved jobs from backend first
      try {
        const backendJobs = await fetchSavedJobsFromBackend();
        if (backendJobs.length > 0) {
          // Save fetched jobs to local storage for offline access
          const storageKey = await getUserStorageKey();
          await AsyncStorage.setItem(storageKey, JSON.stringify(backendJobs));
          return backendJobs;
        }
      } catch (backendError) {
        if (!axios.isAxiosError(backendError) || backendError.response?.status !== 404) {
          console.error('Error fetching from backend:', backendError);
        }
        // Continue with local storage if backend fails or isn't implemented yet
      }
      
      // Fall back to local storage if backend fetch fails or returns empty
      return await getSavedJobs();
    } catch (error) {
      console.error('Error fetching all saved jobs:', error);
      return getSavedJobs(); // Fall back to local storage
    }
  },
  
  // Sync local saved jobs with backend
  syncWithBackend: async (): Promise<boolean> => {
    // If API is not available, just return success but only use local storage
    if (!API_AVAILABLE) {
      return true;
    }
    
    try {
      // Get local saved jobs
      const localJobs = await getSavedJobs();
      
      // Try to get backend saved jobs
      let backendJobs: SavedJob[] = [];
      try {
        backendJobs = await fetchSavedJobsFromBackend();
      } catch (backendError) {
        if (!axios.isAxiosError(backendError) || backendError.response?.status !== 404) {
          console.error('Error fetching saved jobs from backend:', backendError);
        }
        // If backend API is not yet implemented (404) or fails, we'll just push local jobs
        // to backend when it becomes available
      }
      
      console.log('Syncing with backend. Local jobs:', localJobs.length, 'Backend jobs:', backendJobs.length);
      
      // Extract job IDs for comparison
      const localJobIds = new Set(localJobs.map(job => job.id));
      const backendJobIds = new Set(backendJobs.map(job => job.id));
      
      // Jobs to add to backend (in local but not in backend)
      const jobsToAdd = localJobs.filter(job => !backendJobIds.has(job.id));
      
      // Jobs to remove from backend (not in local but in backend)
      const jobsToRemove = backendJobs.filter(job => !localJobIds.has(job.id));
      
      console.log('Jobs to add to backend:', jobsToAdd.length, 'Jobs to remove from backend:', jobsToRemove.length);
      
      // Add missing jobs to backend
      for (const job of jobsToAdd) {
        try {
          await apiClient.instance.post('/saved-jobs', { jobId: job.id });
        } catch (error) {
          if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            console.error(`Failed to add job ${job.id} to backend:`, error);
          }
        }
      }
      
      // Remove extra jobs from backend
      for (const job of jobsToRemove) {
        try {
          await apiClient.instance.delete(`/saved-jobs/${job.id}`);
        } catch (error) {
          if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            console.error(`Failed to remove job ${job.id} from backend:`, error);
          }
        }
      }
      
      // Merge job details (keep the most complete information)
      const mergedJobs = mergeJobLists(localJobs, backendJobs);
      
      // Update local storage with merged list using user-specific key
      const storageKey = await getUserStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(mergedJobs));
      
      return true;
    } catch (error) {
      console.error('Error syncing saved jobs with backend:', error);
      return false;
    }
  }
};

// Helper function to get saved jobs from AsyncStorage
const getSavedJobs = async (): Promise<SavedJob[]> => {
  try {
    const storageKey = await getUserStorageKey();
    const savedJobsJson = await AsyncStorage.getItem(storageKey);
    return savedJobsJson ? JSON.parse(savedJobsJson) : [];
  } catch (error) {
    console.error('Error getting saved jobs from local storage:', error);
    return [];
  }
};

// Helper function to fetch saved jobs from backend
const fetchSavedJobsFromBackend = async (): Promise<SavedJob[]> => {
  try {
    console.log('Fetching saved jobs from backend');
    console.log('Auth headers:', apiClient.instance.defaults.headers.common);
    
    const response = await apiClient.instance.get('/saved-jobs');
    
    console.log('Backend response for saved jobs:', response.data);
    
    if (response.data && response.data.data) {
      // Transform backend response to SavedJob format
      return response.data.data.map((item: any) => ({
        id: item.job.id,
        title: item.job.title,
        companyName: item.job.companyName || item.employer?.companyName,
        minSalary: item.job.minSalary,
        maxSalary: item.job.maxSalary,
        currency: item.job.currency,
        city: item.job.city,
        country: item.job.country,
        jobLocationType: item.job.jobLocationType,
        employmentType: item.job.employmentType,
        savedAt: item.createdAt || new Date().toISOString(),
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching saved jobs from backend:', error);
    if (axios.isAxiosError(error)) {
      console.error('HTTP status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    throw error; // Re-throw to let the caller handle it
  }
};

// Helper function to merge two job lists, keeping the most complete information
const mergeJobLists = (list1: SavedJob[], list2: SavedJob[]): SavedJob[] => {
  const jobMap = new Map<number, SavedJob>();
  
  // Add all jobs from first list
  list1.forEach(job => {
    jobMap.set(job.id, job);
  });
  
  // Merge with second list (or add if not exists)
  list2.forEach(job => {
    if (jobMap.has(job.id)) {
      // Merge properties, preferring non-empty values
      const existingJob = jobMap.get(job.id)!;
      jobMap.set(job.id, {
        ...existingJob,
        ...job,
        // Keep oldest savedAt date
        savedAt: new Date(existingJob.savedAt) < new Date(job.savedAt) ? existingJob.savedAt : job.savedAt,
        // Prefer existing values for optional fields if they exist
        companyName: existingJob.companyName || job.companyName,
        currency: existingJob.currency || job.currency,
        city: existingJob.city || job.city,
        country: existingJob.country || job.country,
        jobLocationType: existingJob.jobLocationType || job.jobLocationType,
        employmentType: existingJob.employmentType || job.employmentType,
      });
    } else {
      jobMap.set(job.id, job);
    }
  });
  
  return Array.from(jobMap.values());
}; 