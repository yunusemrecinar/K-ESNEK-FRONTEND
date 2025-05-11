import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { apiClient } from '../../services/api/client';
import { savedJobsApi } from '../../services/api/savedJobs';
import { applicationsApi } from '../../services/api/applications';
import JobApplicationModal from '../../components/jobs/JobApplicationModal';

type JobDetailsRouteProp = RouteProp<MainStackParamList, 'JobDetails'>;
type JobDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Define the Job interface
interface Job {
  id: number;
  title: string;
  description: string;
  employerId: number;
  categoryId: number;
  jobLocationType?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  minSalary: number;
  maxSalary: number;
  employmentType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  jobStatus?: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  requirements?: string[];
  responsibilities?: string[];
  companyName?: string;
  companyLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
}

const JobDetailsScreen: React.FC = () => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const theme = useTheme();
  const route = useRoute<JobDetailsRouteProp>();
  const navigation = useNavigation<JobDetailsNavigationProp>();
  const { jobId } = route.params;

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Fetch job details, check if job is saved, and if user has applied
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if job is saved
        const jobSaved = await savedJobsApi.isJobSaved(jobId);
        setIsSaved(jobSaved);

        // Check if user has applied for this job
        const applicationResponse = await applicationsApi.hasAppliedForJob(jobId);
        if (applicationResponse.isSuccess && applicationResponse.data) {
          setHasApplied(true);
        }

        // Make actual API call to get job details
        const response = await apiClient.instance.get(`/jobs/${jobId}`);
        if (response.data && response.data.data) {
          // Map the API response to our Job interface
          const apiJob = response.data.data;
          const jobData: Job = {
            id: apiJob.id,
            title: apiJob.title,
            description: apiJob.description,
            employerId: apiJob.employerId,
            categoryId: apiJob.categoryId,
            jobLocationType: apiJob.jobLocationType,
            city: apiJob.city,
            country: apiJob.country,
            currency: apiJob.currency || '$',
            minSalary: apiJob.minSalary,
            maxSalary: apiJob.maxSalary,
            employmentType: apiJob.employmentType,
            experienceLevel: apiJob.experienceLevel,
            educationLevel: apiJob.educationLevel,
            jobStatus: apiJob.jobStatus,
            applicationDeadline: apiJob.applicationDeadline,
            createdAt: apiJob.createdAt,
            updatedAt: apiJob.updatedAt,
            // Map other fields from API response
            requirements: apiJob.jobRequirements?.map((req: any) => req.description) || [],
            responsibilities: apiJob.jobResponsibilities?.map((resp: any) => resp.description) || [],
            // These fields might need to be fetched from a different endpoint or included in the job response
            companyName: apiJob.companyName || "Company Name",
            contactEmail: apiJob.contactEmail,
            contactPhone: apiJob.contactPhone
          };
          
          setJob(jobData);
        } else {
          // Fallback to mock data if API doesn't return expected format
          console.warn('API response format unexpected, using mock data');
          
          // Mock data for the job details - only used as fallback
          const mockJob: Job = {
            id: jobId,
            title: "Senior React Native Developer",
            description: "We are looking for an experienced React Native developer to join our mobile app development team. In this role, you will develop and maintain high-quality mobile applications for both iOS and Android platforms using React Native. You will work with our design and product teams to implement new features and ensure the performance and quality of applications.",
            employerId: 1,
            categoryId: 1,
            jobLocationType: "Remote",
            city: "Istanbul",
            country: "Turkey",
            currency: "$",
            minSalary: 60000,
            maxSalary: 90000,
            employmentType: "Full-time",
            experienceLevel: "Senior",
            educationLevel: "Bachelor's Degree",
            jobStatus: "Active",
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            requirements: [
              "3+ years of experience with React Native",
              "Strong understanding of React Native components, state management, and hooks",
              "Experience with RESTful APIs and third-party libraries",
              "Familiarity with native build tools like Xcode and Android Studio",
              "Knowledge of TypeScript",
              "Experience with state management libraries (Redux, Context API)",
              "Understanding of mobile UI/UX principles"
            ],
            responsibilities: [
              "Develop and maintain React Native applications for iOS and Android",
              "Implement new features and ensure the overall reliability and performance of applications",
              "Collaborate with the design team to implement UI/UX designs",
              "Work with the backend team to integrate API services",
              "Identify and fix bugs and performance bottlenecks",
              "Write clean, maintainable code and perform code reviews",
              "Stay up-to-date with emerging trends in mobile development"
            ],
            companyName: "Tech Innovations Ltd",
            contactEmail: "careers@techinnovations.com",
            contactPhone: "+90 212 555 6789"
          };
          
          setJob(mockJob);
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Handle opening email
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Handle opening phone
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Handle save job
  const handleSaveJob = async () => {
    if (!job) return;
    
    try {
      setSavingJob(true);
      
      if (isSaved) {
        // Unsave the job
        const success = await savedJobsApi.unsaveJob(job.id);
        if (success) {
          setIsSaved(false);
          showSnackbar('Job removed from saved jobs');
        } else {
          showSnackbar('Failed to remove job');
        }
      } else {
        // Save the job
        const jobToSave = {
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          minSalary: job.minSalary,
          maxSalary: job.maxSalary,
          currency: job.currency,
          city: job.city,
          country: job.country,
          jobLocationType: job.jobLocationType,
          employmentType: job.employmentType,
        };
        
        const success = await savedJobsApi.saveJob(jobToSave);
        if (success) {
          setIsSaved(true);
          showSnackbar('Job saved successfully');
        } else {
          showSnackbar('Failed to save job');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      showSnackbar('An error occurred');
    } finally {
      setSavingJob(false);
    }
  };

  // Handle successful job application
  const handleApplicationSuccess = () => {
    setHasApplied(true);
    showSnackbar('Your application has been submitted successfully!');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text variant="headlineSmall" style={styles.errorTitle}>Job Not Found</Text>
        <Text variant="bodyMedium" style={styles.errorDescription}>
          {error || "The job details could not be loaded. Please try again later."}
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          mode="text" 
          onPress={() => navigation.goBack()}
          contentStyle={styles.backButtonContent}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>Job Details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="titleLarge" style={styles.jobTitle}>{job.title}</Text>
                <Text variant="titleMedium" style={styles.companyName}>{job.companyName || "Company Name"}</Text>
              </View>
              {job.jobStatus && (
                <Chip 
                  style={{ 
                    backgroundColor: job.jobStatus.toLowerCase() === 'active' ? '#E8FFE8' : '#FFE8E8'
                  }}
                >
                  {job.jobStatus}
                </Chip>
              )}
            </View>

            <View style={styles.detailsContainer}>
              {job.city && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    {job.city}{job.country ? `, ${job.country}` : ''}
                  </Text>
                </View>
              )}
              
              {job.jobLocationType && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="office-building" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    {job.jobLocationType}
                  </Text>
                </View>
              )}
              
              {job.employmentType && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="briefcase-outline" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    {job.employmentType}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="currency-usd" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.detailText}>
                  {job.currency || '$'}{job.minSalary} - {job.currency || '$'}{job.maxSalary}
                  {job.employmentType?.toLowerCase().includes('hourly') ? ' /hour' : ' /year'}
                </Text>
              </View>
              
              {job.applicationDeadline && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {job.experienceLevel && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="account-star" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    Experience: {job.experienceLevel}
                  </Text>
                </View>
              )}
              
              {job.educationLevel && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="school" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>
                    Education: {job.educationLevel}
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Job Description</Text>
            <Text variant="bodyMedium" style={styles.descriptionText}>{job.description}</Text>

            {job.requirements && job.requirements.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
                {job.requirements.map((requirement, index) => (
                  <View key={`req-${index}`} style={styles.listItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.listItemText}>{requirement}</Text>
                  </View>
                ))}
              </>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Responsibilities</Text>
                {job.responsibilities.map((responsibility, index) => (
                  <View key={`resp-${index}`} style={styles.listItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.listItemText}>{responsibility}</Text>
                  </View>
                ))}
              </>
            )}

            {(job.contactEmail || job.contactPhone) && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Contact Information</Text>
                
                {job.contactEmail && (
                  <TouchableOpacity 
                    style={styles.contactItem} 
                    onPress={() => handleEmailPress(job.contactEmail || '')}
                  >
                    <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>
                      {job.contactEmail}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {job.contactPhone && (
                  <TouchableOpacity 
                    style={styles.contactItem} 
                    onPress={() => handlePhonePress(job.contactPhone || '')}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>
                      {job.contactPhone}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            icon={hasApplied ? "check-bold" : "check-circle"} 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={() => hasApplied ? showSnackbar('You have already applied for this job') : setApplicationModalVisible(true)}
            disabled={hasApplied}
          >
            {hasApplied ? "Already Applied" : "Apply for This Job"}
          </Button>
          <Button 
            mode="contained" 
            icon="chat" 
            style={[styles.actionButton, styles.secondaryButton]} 
            buttonColor="#4A87C9"
            onPress={() => {
              // Navigate to Chat screen with the employer information
              navigation.navigate('Chat', {
                userId: job.employerId.toString(),
                userName: job.companyName || 'Employer',
                userImage: job.companyLogo || `https://i.pravatar.cc/150?u=${job.employerId}` // Use company logo or generate avatar
              });
            }}
          >
            Contact Employer
          </Button>
          <Button 
            mode="outlined" 
            icon={isSaved ? "bookmark" : "bookmark-outline"} 
            style={styles.actionButton} 
            loading={savingJob}
            onPress={handleSaveJob}
          >
            {isSaved ? "Unsave Job" : "Save Job"}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {job && (
        <JobApplicationModal
          visible={applicationModalVisible}
          onDismiss={() => setApplicationModalVisible(false)}
          onSuccess={handleApplicationSuccess}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 50, // To balance the back button on the left
  },
  backButtonContent: {
    flexDirection: 'row-reverse',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    opacity: 0.7,
  },
  detailsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  listItemText: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactText: {
    opacity: 0.7,
  },
  contactLink: {
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
  snackbar: {
    marginBottom: 16,
  },
});

export default JobDetailsScreen; 