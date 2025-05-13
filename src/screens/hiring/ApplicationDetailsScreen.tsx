import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../../services/api/client';
import { employeeService } from '../../services/api/employee';
import { EmployeeProfile } from '../../types/profile';

// Define the types
type RootStackParamList = {
  ApplicationDetails: { applicationId: string };
  JobApplicants: { jobId: number };
  ApplicantProfile: { userId: number };
  Chat: { userId: string; userName: string; userImage: string };
};

type ApplicationDetailsRouteProp = RouteProp<RootStackParamList, 'ApplicationDetails'>;
type ApplicationDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Application {
  id: number;
  jobId: number;
  userId: number;
  applicationStatus: string;
  coverLetter?: string;
  resumeId?: number;
  answers?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  employeeProfile?: EmployeeProfile;
}

interface Job {
  id: number;
  title: string;
  description: string;
  // Other job details
}

const ApplicationDetailsScreen = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const theme = useTheme();
  const route = useRoute<ApplicationDetailsRouteProp>();
  const navigation = useNavigation<ApplicationDetailsNavigationProp>();
  const { applicationId } = route.params;

  // Fetch application details
  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch application data
      const response = await apiClient.instance.get(`/applications/${applicationId}`);
      
      if (response.data && response.data.success) {
        const applicationData = response.data.data;
        
        // Add timestamp fields if missing
        const now = new Date().toISOString();
        
        if (!applicationData.createdAt) {
          applicationData.createdAt = now;
        }
        
        if (!applicationData.updatedAt) {
          applicationData.updatedAt = applicationData.createdAt || now;
        }
        
        setApplication(applicationData);
        
        // Fetch job details if we have a jobId
        if (applicationData.jobId) {
          fetchJobDetails(applicationData.jobId);
        }
        
        // Fetch applicant details if not included
        if (applicationData.userId && !applicationData.user) {
          await fetchApplicantDetails(applicationData.userId);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch application details');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      setError('Failed to load application details. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobDetails = async (jobId: number) => {
    try {
      const response = await apiClient.instance.get(`/jobs/${jobId}`);
      
      if (response.data && response.data.success) {
        setJob(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const fetchApplicantDetails = async (userId: number) => {
    try {
      // Try to get employee profile
      const employeeProfile = await employeeService.getPublicEmployeeProfile(userId);
      
      setApplication(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          employeeProfile,
          user: {
            id: userId,
            firstName: employeeProfile.firstName || '',
            lastName: employeeProfile.lastName || '',
            email: `employee${userId}@example.com`,
            profilePicture: employeeProfile.profilePictureUrl
          }
        };
      });
    } catch (error) {
      console.log('Error fetching applicant details:', error);
    }
  };

  // Status chip color mapping
  const getStatusColor = (status: string) => {
    if (!status) return theme.colors.surfaceVariant;
    
    switch (status.toLowerCase()) {
      case 'accepted':
        return theme.colors.primary;
      case 'rejected':
        return theme.colors.error;
      case 'interviewed':
        return '#FFA726'; // Orange
      case 'reviewing':
        return '#29B6F6'; // Light Blue
      default:
        return theme.colors.surfaceVariant;
    }
  };

  // Format date helper
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      // Format as "Month Day, Year at Time" (e.g., "May 12, 2025 at 14:47")
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString(undefined, options)
        .replace(',', ',').replace(' at', ' at');
    } catch (error) {
      console.error('Error formatting date:', error);
      // Try a different approach for PostgreSQL timestamp format
      try {
        // Extract date components from PostgreSQL timestamp format
        // Example: 2025-05-12 14:47:21.09564+03
        const matches = dateString.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
        if (matches) {
          const [_, year, month, day, hour, minute] = matches;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = parseInt(month, 10) - 1;
          const monthName = monthNames[monthIndex] || month;
          return `${monthName} ${parseInt(day, 10)}, ${year} at ${hour}:${minute}`;
        }
      } catch (innerError) {
        console.error('Error parsing PostgreSQL timestamp:', innerError);
      }
      return 'N/A';
    }
  };

  // Update application status
  const updateApplicationStatus = async (newStatus: string) => {
    if (!application) return;
    
    try {
      setStatusUpdating(true);
      
      // Make sure we have a valid resumeId (must be > 0)
      const resumeId = application.resumeId && application.resumeId > 0 ? application.resumeId : 1;
      
      // Create complete request data with all required fields
      const requestData = {
        id: application.id,
        applicationStatus: newStatus,
        jobId: application.jobId,
        userId: application.userId,
        resumeId: resumeId, // Always provide a positive number
        coverLetter: application.coverLetter || '',
        answers: application.answers || '',
        notes: application.notes || ''
      };
      
      // Standard PATCH request
      const response = await apiClient.instance.patch(`/applications/${application.id}`, requestData);
      
      if (response.data && response.data.success) {
        // Update local state
        setApplication(prev => prev ? { ...prev, applicationStatus: newStatus } : null);
        setSnackbarVisible(true);
        setError(`Application ${newStatus.toLowerCase()} successfully`);
      } else {
        throw new Error(response.data?.message || 'Failed to update application status');
      }
    } catch (error: any) {
      console.error('Error updating application status:', error);
      // Log more details about the error
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data ? JSON.stringify(error.response.data, null, 2) : 'No response data');
      }
      setSnackbarVisible(true);
      setError('Failed to update application status. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Contact applicant (via chat)
  const contactApplicant = () => {
    if (!application || !application.userId) {
      setSnackbarVisible(true);
      setError('Could not find applicant information.');
      return;
    }
    
    // Navigate to the chat screen with the applicant's information
    const applicantName = application.user 
      ? `${application.user.firstName} ${application.user.lastName}`.trim() 
      : application.employeeProfile 
        ? `${application.employeeProfile.firstName} ${application.employeeProfile.lastName}`.trim()
        : 'Applicant';
    
    // Get profile picture or use a default
    const profilePicture = application.user?.profilePicture 
      || application.employeeProfile?.profilePictureUrl 
      || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(applicantName);
    
    navigation.navigate('Chat', {
      userId: application.userId.toString(),
      userName: applicantName,
      userImage: profilePicture
    });
  };

  // View resume
  const viewResume = async () => {
    if (!application || !application.resumeId) {
      setSnackbarVisible(true);
      setError('No resume available for this application.');
      return;
    }
    
    try {
      // Construct proper URL for resume download
      // Use the ngrok URL or API URL from the config
      const apiUrl = 'https://e027-176-233-28-176.ngrok-free.app/api';
      const fileUrl = `/files/download/${application.resumeId}`;
      Linking.openURL(`${apiUrl}${fileUrl}`);
    } catch (error) {
      console.error('Error opening resume:', error);
      setSnackbarVisible(true);
      setError('Could not open the resume. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading application details...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="file-alert" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Application not found or error loading details.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const applicantName = application.user 
    ? `${application.user.firstName} ${application.user.lastName}`.trim() 
    : application.employeeProfile 
      ? `${application.employeeProfile.firstName} ${application.employeeProfile.lastName}`.trim()
      : 'Unknown Applicant';
      
  const applicantEmail = application.user?.email || 'No email provided';
  const hasResume = !!application.resumeId;
  const hasCoverLetter = !!application.coverLetter && application.coverLetter.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Button 
            icon="arrow-left" 
            mode="text" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back
          </Button>
          <Text variant="headlineMedium" style={styles.title}>Application Details</Text>
        </View>
        
        {/* Applicant Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text variant="titleLarge" style={styles.applicantName}>{applicantName}</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(application.applicationStatus) }]}
                textStyle={{ color: '#fff' }}
              >
                {application.applicationStatus || 'Pending'}
              </Chip>
            </View>
            
            <Text style={styles.applicantEmail}>{applicantEmail}</Text>
            
            <Divider style={styles.divider} />
            
            <Text variant="titleMedium">Application Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Application ID:</Text>
                <Text style={styles.detailValue}>#{application.id}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Job:</Text>
                <Text style={styles.detailValue}>{job?.title || `#${application.jobId}`}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Applied:</Text>
                <Text style={styles.detailValue}>{formatDate(application.createdAt)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{formatDate(application.updatedAt)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Cover Letter Card */}
        {hasCoverLetter && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Cover Letter</Text>
              <Text style={styles.coverLetter}>{application.coverLetter}</Text>
            </Card.Content>
          </Card>
        )}
        
        {/* Resume Card */}
        {hasResume && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Resume</Text>
              <Button 
                mode="contained" 
                icon="file-document" 
                onPress={viewResume} 
                style={styles.resumeButton}
              >
                View Resume
              </Button>
            </Card.Content>
          </Card>
        )}
        
        {/* Actions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Actions</Text>
            
            <View style={styles.actionButtonsContainer}>
              <Button 
                mode="contained" 
                icon="chat" 
                onPress={() => contactApplicant()}
                style={[styles.actionButton, styles.contactButton]}
              >
                Contact Applicant
              </Button>
              
              <Button 
                mode="contained" 
                icon="account" 
                onPress={() => navigation.navigate('ApplicantProfile', { userId: application.userId })}
                style={[styles.actionButton, styles.profileButton]}
                disabled={!application.userId}
              >
                View Profile
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text variant="titleMedium" style={styles.statusTitle}>Update Status</Text>
            
            <View style={styles.statusButtonsContainer}>
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Reviewing'}
                onPress={() => updateApplicationStatus('Reviewing')}
                style={[styles.statusButton, styles.reviewingButton]}
              >
                Mark as Reviewing
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Interviewed'}
                onPress={() => updateApplicationStatus('Interviewed')}
                style={[styles.statusButton, styles.interviewedButton]}
              >
                Mark as Interviewed
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Accepted'}
                onPress={() => updateApplicationStatus('Accepted')}
                style={[styles.statusButton, styles.acceptButton]}
              >
                Accept Applicant
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Rejected'}
                onPress={() => updateApplicationStatus('Rejected')}
                style={[styles.statusButton, styles.rejectButton]}
              >
                Reject Applicant
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginVertical: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginLeft: -8,
  },
  title: {
    fontWeight: 'bold',
    marginLeft: 16,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    // Android shadow
    elevation: 2,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantName: {
    fontWeight: 'bold',
    flex: 1,
  },
  applicantEmail: {
    opacity: 0.7,
    marginVertical: 4,
  },
  statusChip: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailsContainer: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  detailLabel: {
    width: 120,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  detailValue: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  coverLetter: {
    lineHeight: 20,
  },
  resumeButton: {
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    margin: 4,
  },
  contactButton: {
    backgroundColor: '#4CAF50',
  },
  profileButton: {
    backgroundColor: '#2196F3',
  },
  statusTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  statusButtonsContainer: {
    flexDirection: 'column',
  },
  statusButton: {
    marginVertical: 4,
  },
  reviewingButton: {
    backgroundColor: '#29B6F6',
  },
  interviewedButton: {
    backgroundColor: '#FFA726',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
});

export default ApplicationDetailsScreen; 