import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { applicationsApi, JobApplication } from '../../services/api/applications';
import { jobsApi, JobResponse } from '../../services/api/jobs';
import { employerService } from '../../services/api/employer';
import { EmployerProfile } from '../../types/profile';

// Define the types
type RootStackParamList = {
  ApplicationDetails: { applicationId: string };
  Chat: { userId: string; userName: string; userImage: string };
};

type ApplicationDetailsRouteProp = RouteProp<RootStackParamList, 'ApplicationDetails'>;
type ApplicationDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Application {
  id: string;
  jobId: number;
  applicationStatus: string;
  coverLetter?: string;
  resumeId?: number;
  jobTitle: string;
  companyName: string;
  employerId?: number;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  contactEmail?: string;
  contactPhone?: string;
  appliedDate: Date;
}

const ApplicationDetailsScreen = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const theme = useTheme();
  const route = useRoute<ApplicationDetailsRouteProp>();
  const navigation = useNavigation<ApplicationDetailsNavigationProp>();
  const { applicationId } = route.params;

  // Fetch application details
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch application data
        const appResponse = await applicationsApi.getApplicationById(parseInt(applicationId));
        
        if (!appResponse.isSuccess || !appResponse.data) {
          throw new Error(appResponse.message || 'Failed to fetch application details');
        }
        
        const applicationData = appResponse.data;
        
        // Fetch job details using jobId from the application
        const jobResponse = await jobsApi.getJobById(applicationData.jobId);
        
        if (!jobResponse.isSuccess || !jobResponse.data) {
          throw new Error('Failed to fetch job details for this application');
        }
        
        const jobData = jobResponse.data;
        
        // Try to fetch employer details
        let employerName = 'Employer';
        let employerEmail: string | undefined;
        let employerPhone: string | undefined;
        
        try {
          if (jobData.employerId) {
            const employer = await employerService.getEmployerProfile(jobData.employerId);
            if (employer) {
              employerName = employer.name;
              employerEmail = employer.email;
            }
          }
        } catch (err) {
          console.log('Could not fetch employer details:', err);
        }
        
        // Format the combined data
        const formattedApp: Application = {
          id: applicationData.id.toString(),
          jobId: applicationData.jobId,
          applicationStatus: applicationData.applicationStatus || 'Pending',
          coverLetter: applicationData.coverLetter,
          resumeId: applicationData.resumeId,
          employerId: jobData.employerId,
          appliedDate: new Date(), // Default to current date in case parsing fails
          jobTitle: jobData.title,
          companyName: employerName,
          description: jobData.description,
          location: jobData.city && jobData.country 
            ? `${jobData.city}, ${jobData.country}` 
            : jobData.jobLocationType || '',
          salary: jobData.currency 
            ? `${jobData.currency}${jobData.minSalary} - ${jobData.currency}${jobData.maxSalary}`
            : `${jobData.minSalary} - ${jobData.maxSalary}`,
          requirements: jobData.jobRequirements?.map(req => req.requirement) || [],
          responsibilities: jobData.jobResponsibilities?.map(resp => resp.responsibility) || [],
          contactEmail: employerEmail,
          contactPhone: employerPhone
        };
        
        // Safely parse the date after object creation
        try {
          if (applicationData.createdAt) {
            const parsedDate = new Date(applicationData.createdAt);
            // Check if date is valid
            if (!isNaN(parsedDate.getTime())) {
              formattedApp.appliedDate = parsedDate;
            }
          }
        } catch (err) {
          console.log('Error parsing date:', err);
          // Keep default date if parsing fails
        }
        
        setApplication(formattedApp);
      } catch (error) {
        console.error('Error fetching application details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load application details');
        setSnackbarVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  // Status chip color mapping
  const getStatusColor = (status: string) => {
    // Convert API status to our status format
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('pend') || normalizedStatus.includes('review')) 
      return theme.colors.primary;
    if (normalizedStatus.includes('accept') || normalizedStatus.includes('approve') || normalizedStatus.includes('hire')) 
      return '#4CAF50';
    if (normalizedStatus.includes('reject')) 
      return theme.colors.error;
    return theme.colors.primary;
  };

  // Handle opening email
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Handle opening phone
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Handle withdraw application
  const handleWithdraw = async () => {
    if (!application) return;
    
    try {
      const response = await applicationsApi.withdrawApplication(parseInt(application.id));
      if (response.isSuccess) {
        setSnackbarVisible(true);
        setError('Application withdrawn successfully');
        
        // Update the local application status
        setApplication(prev => 
          prev ? { ...prev, applicationStatus: 'Withdrawn' } : null
        );
      } else {
        setSnackbarVisible(true);
        setError('Failed to withdraw application: ' + response.message);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setSnackbarVisible(true);
      setError('Error withdrawing application');
    }
  };

  // Format date helper
  const formatDate = (dateString: Date | string): string => {
    try {
      if (typeof dateString === 'string') {
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          return 'Unknown date';
        }
        return format(parsedDate, 'MMM dd, yyyy');
      }
      // If it's already a Date object
      return format(dateString, 'MMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.error} />
        <Text variant="headlineSmall" style={styles.errorTitle}>Application Not Found</Text>
        <Text variant="bodyMedium" style={styles.errorDescription}>
          The application details could not be loaded. Please try again later.
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
        <Text variant="headlineSmall" style={styles.title}>Application Details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="titleLarge" style={styles.jobTitle}>{application.jobTitle}</Text>
                <Text variant="titleMedium" style={styles.companyName}>{application.companyName}</Text>
              </View>
              <Chip
                mode="flat"
                textStyle={{ color: '#fff' }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(application.applicationStatus) }]}
              >
                {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
              </Chip>
            </View>

            <View style={styles.detailsContainer}>
              {application.location && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>{application.location}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.detailText}>
                  Applied {formatDate(application.appliedDate)}
                </Text>
              </View>
              {application.salary && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={styles.detailText}>{application.salary}</Text>
                </View>
              )}
              {application.coverLetter && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleMedium" style={styles.sectionTitle}>Your Cover Letter</Text>
                  <Text variant="bodyMedium" style={styles.descriptionText}>{application.coverLetter}</Text>
                </>
              )}
            </View>

            {application.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Job Description</Text>
                <Text variant="bodyMedium" style={styles.descriptionText}>{application.description}</Text>
              </>
            )}

            {application.requirements && application.requirements.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
                {application.requirements.map((requirement, index) => (
                  <View key={`req-${index}`} style={styles.listItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.listItemText}>{requirement}</Text>
                  </View>
                ))}
              </>
            )}

            {application.responsibilities && application.responsibilities.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Responsibilities</Text>
                {application.responsibilities.map((responsibility, index) => (
                  <View key={`resp-${index}`} style={styles.listItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.listItemText}>{responsibility}</Text>
                  </View>
                ))}
              </>
            )}

            {(application.contactEmail || application.contactPhone) && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Contact Information</Text>
                
                {application.contactEmail && (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => handleEmailPress(application.contactEmail || '')}
                  >
                    <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>{application.contactEmail}</Text>
                  </TouchableOpacity>
                )}
                
                {application.contactPhone && (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => handlePhonePress(application.contactPhone || '')}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>{application.contactPhone}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          {application.employerId && (
            <Button 
              mode="contained" 
              icon="chat" 
              style={[styles.actionButton, styles.primaryButton]} 
              buttonColor="#4A87C9"
              onPress={() => {
                // Navigate to Chat screen with the employer information
                navigation.navigate('Chat', {
                  userId: application.employerId?.toString() || '',
                  userName: application.companyName || 'Employer',
                  userImage: `https://i.pravatar.cc/150?u=${application.employerId}` // Generate avatar based on ID
                });
              }}
            >
              Contact Employer
            </Button>
          )}
          <Button 
            mode="outlined" 
            icon="close" 
            style={styles.actionButton} 
            textColor={theme.colors.error}
            onPress={handleWithdraw}
            disabled={application.applicationStatus.toLowerCase() === 'withdrawn'}
          >
            Withdraw Application
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {error || 'An error occurred'}
      </Snackbar>
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
  statusChip: {
    borderRadius: 4,
  },
  detailsContainer: {
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
    marginBottom: 8,
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
});

export default ApplicationDetailsScreen; 