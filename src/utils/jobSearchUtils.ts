import { JobRecommendationDto } from '../services/api/recommendations';
import { JobResponse } from '../services/api/jobs';

// Extended JobResponse interface to include recommendation data
export interface EnhancedJobResponse extends Partial<JobResponse> {
  id: number; 
  title: string;
  description: string;
  employerId: number;
  categoryId: number;
  minSalary: number;
  maxSalary: number;
  // Optional fields from regular jobs
  jobSkills?: { skill: string }[];
  // Recommendation specific fields
  recommendationScore?: number;
  isRecommendation?: boolean;
  // Company name field
  companyName?: string;
}

/**
 * Filter jobs based on a search query
 */
export const filterJobsByQuery = (
  jobs: EnhancedJobResponse[] | JobRecommendationDto[],
  query: string
): (EnhancedJobResponse | JobRecommendationDto)[] => {
  if (!query.trim()) return jobs;

  const normalizedQuery = query.toLowerCase().trim();

  return jobs.filter((job) => {
    // For JobResponse objects
    if ('title' in job) {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const skills = job.jobSkills?.map(skill => skill.skill.toLowerCase()) || [];
      
      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        skills.some(skill => skill.includes(normalizedQuery))
      );
    } 
    // For JobRecommendationDto objects
    else {
      const title = job.recommendedJobTitle?.toLowerCase() || '';
      const employerName = job.employerName?.toLowerCase() || '';
      const skills = job.matchingSkills?.map(skill => skill.toLowerCase()) || [];
      
      return (
        title.includes(normalizedQuery) ||
        employerName.includes(normalizedQuery) ||
        skills.some(skill => skill.includes(normalizedQuery))
      );
    }
  });
};

/**
 * Convert JobRecommendationDto to a format compatible with JobResponse
 * This helps display recommendations in the same UI components as regular jobs
 */
export const convertRecommendationToJobResponse = (
  recommendation: JobRecommendationDto
): EnhancedJobResponse => {
  return {
    id: recommendation.recommendedJobId,
    title: recommendation.recommendedJobTitle,
    description: `Company: ${recommendation.employerName} | Match Score: ${Math.round(recommendation.score * 100)}%`,
    employerId: recommendation.employerId,
    jobSkills: recommendation.matchingSkills?.map(skill => ({ skill })) || [],
    // Add default values for required fields
    categoryId: 0,
    minSalary: 0,
    maxSalary: 0,
    // Add the recommendation metadata
    isRecommendation: true,
    recommendationScore: recommendation.score
  };
};

/**
 * Sort jobs by recommendation score (if available)
 */
export const sortJobsByRecommendation = (
  jobs: (EnhancedJobResponse | JobRecommendationDto)[]
): (EnhancedJobResponse | JobRecommendationDto)[] => {
  return [...jobs].sort((a, b) => {
    // Sort by recommendation score if available
    const scoreA = 'recommendationScore' in a ? a.recommendationScore || 0 : 
                   'score' in a ? a.score : 0;
    const scoreB = 'recommendationScore' in b ? b.recommendationScore || 0 : 
                   'score' in b ? b.score : 0;
    
    return scoreB - scoreA;
  });
}; 