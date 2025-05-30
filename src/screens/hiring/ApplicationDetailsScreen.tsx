import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme, Snackbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../../services/api/client';
import { employeeService } from '../../services/api/employee';
import { employeeReviewsService, CreateEmployeeReviewDto } from '../../services/api/employeeReviews';
import { EmployeeProfile } from '../../types/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendApplicationStatusMessage } from '../../utils/applicationMessaging';

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
  resumeFileBlobId?: number;
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
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
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
        
        // Always fetch applicant details to ensure we have complete profile data
        if (applicationData.userId) {
          await fetchApplicantDetails(applicationData.userId);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch application details');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      setError('Failed to load application details. Please try again.');
      setSnackbarMessage('Failed to load application details. Please try again.');
      setSnackbarType('error');
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
      // Try to get enhanced employee profile - use the employee ID if available from current application data
      const employeeId = application?.userId; // This is the EmployeeUsers table ID
      const employeeProfile = employeeId 
        ? await employeeService.getEnhancedEmployeeProfile(userId, employeeId)
        : await employeeService.getPublicEmployeeProfile(userId);
      
      setApplication(prev => {
        if (!prev) return null;
        
        // Use the correct user ID - prefer employeeProfile.userId if available, fallback to userId
        const actualUserId = employeeProfile.userId || userId;
        const firstName = employeeProfile.firstName || '';
        const lastName = employeeProfile.lastName || '';
        
        // Generate email with same logic as ApplicationsScreen
        const email = employeeProfile.email || 
          (firstName && lastName 
            ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`
            : `user${actualUserId}@example.com`);
        
        // Merge with existing user data if available
        const existingUser = prev.user;
        
        return {
          ...prev,
          employeeProfile,
          user: {
            // Start with existing user data if available
            ...existingUser,
            // Override with enhanced data
            id: userId,
            firstName,
            lastName,
            email,
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

  // Send automatic message for application status change
  const handleApplicationStatusMessage = async (status: 'Accepted' | 'Rejected') => {
    if (!application) {
      console.error('No application data available for messaging');
      return;
    }
    
    // Get applicant name for personalized message
    const applicantName = application.user 
      ? `${application.user.firstName} ${application.user.lastName}`.trim() 
      : application.employeeProfile 
        ? `${application.employeeProfile.firstName} ${application.employeeProfile.lastName}`.trim()
        : 'there';
    
    // Get job title if available
    const jobTitle = job?.title || 'the position';
    
    // Use the utility function to send the message
    const success = await sendApplicationStatusMessage(status, {
      employeeId: application.userId,
      applicantName,
      jobTitle
    });
    
    if (!success) {
      console.warn(`Failed to send automatic ${status.toLowerCase()} message to employee ${application.userId}`);
    }
  };

  // Update application status
  const updateApplicationStatus = async (newStatus: string) => {
    if (!application) return;
    
    try {
      setStatusUpdating(true);
      
      // Make sure we have a valid resumeId (must be > 0)
      const resumeId = application.resumeFileBlobId && application.resumeFileBlobId > 0 ? application.resumeFileBlobId : 1;
      
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
        // Update local state with new status and current timestamp
        const now = new Date().toISOString();
        setApplication(prev => prev ? { 
          ...prev, 
          applicationStatus: newStatus,
          updatedAt: now
        } : null);
        
        // Send automatic message for Accept/Reject status changes
        if (newStatus === 'Accepted' || newStatus === 'Rejected') {
          await handleApplicationStatusMessage(newStatus as 'Accepted' | 'Rejected');
        }
        
        setSnackbarMessage(`Application ${newStatus.toLowerCase()} successfully`);
        setSnackbarType('success');
        setSnackbarVisible(true);
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
      setSnackbarMessage('Failed to update application status. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Confirmation dialog for accepting applicant
  const confirmAcceptApplicant = () => {
    const applicantName = application?.user 
      ? `${application.user.firstName} ${application.user.lastName}`.trim() 
      : application?.employeeProfile 
        ? `${application.employeeProfile.firstName} ${application.employeeProfile.lastName}`.trim()
        : 'this applicant';

    Alert.alert(
      'Accept Applicant',
      `Are you sure you want to accept ${applicantName}? This is a FINAL decision and cannot be changed later. The applicant will be notified immediately.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => updateApplicationStatus('Accepted'),
        },
      ],
      { cancelable: true }
    );
  };

  // Confirmation dialog for rejecting applicant
  const confirmRejectApplicant = () => {
    const applicantName = application?.user 
      ? `${application.user.firstName} ${application.user.lastName}`.trim() 
      : application?.employeeProfile 
        ? `${application.employeeProfile.firstName} ${application.employeeProfile.lastName}`.trim()
        : 'this applicant';

    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${applicantName}'s application? This is a FINAL decision and cannot be changed later. The applicant will be notified of the rejection.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => updateApplicationStatus('Rejected'),
        },
      ],
      { cancelable: true }
    );
  };

  // Contact applicant (via chat)
  const contactApplicant = () => {
    if (!application || !application.userId) {
      setSnackbarMessage('Could not find applicant information.');
      setSnackbarType('error');
      setSnackbarVisible(true);
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
    if (!application || !application.resumeFileBlobId) {
      setSnackbarMessage('No resume available for this application.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }
    
    try {
      // Construct proper URL for resume download
      // Use the ngrok URL or API URL from the config
      const apiUrl = 'http://165.22.90.212:8080/api';
      const fileUrl = `/files/download/${application.resumeFileBlobId}`;
      Linking.openURL(`${apiUrl}${fileUrl}`);
    } catch (error) {
      console.error('Error opening resume:', error);
      setSnackbarMessage('Could not open the resume. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  // Review functions
  const openReviewModal = () => {
    setProjectTitle(job?.title || '');
    setReviewComment('');
    setReviewRating(5);
    setReviewModalVisible(true);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setReviewComment('');
    setProjectTitle('');
    setReviewRating(5);
  };

  const submitReview = async () => {
    if (!application) {
      setSnackbarMessage('Could not find application information.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    // Get employee ID from either employeeProfile or user object
    const employeeId = application.employeeProfile?.id || application.user?.id;
    
    if (!employeeId) {
      setSnackbarMessage('Employee ID not available.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setSnackbarMessage('Please provide a rating between 1 and 5 stars.');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    try {
      setIsSubmittingReview(true);
      
      // Get the current user (employer) ID from context/storage
      const currentUserString = await AsyncStorage.getItem('employerData');
      
      let employerId: number;
      
      if (currentUserString) {
        const currentUser = JSON.parse(currentUserString);
        employerId = currentUser.id;
      } else {
        throw new Error('Employer information not found');
      }

      const reviewData: CreateEmployeeReviewDto = {
        employeeId: employeeId,
        employerId: employerId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        projectTitle: projectTitle.trim() || undefined,
      };

      await employeeReviewsService.createEmployeeReview(reviewData);
      
      setSnackbarMessage('Review submitted successfully!');
      setSnackbarType('success');
      setSnackbarVisible(true);
      closeReviewModal();
      
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setSnackbarMessage('Failed to submit review. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderRatingStars = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text variant="labelLarge" style={styles.ratingLabel}>Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setReviewRating(star)}
              style={styles.starButton}
            >
              <MaterialCommunityIcons
                name={star <= reviewRating ? 'star' : 'star-outline'}
                size={24}
                color={star <= reviewRating ? '#FFC107' : '#CCCCCC'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>{reviewRating}/5</Text>
      </View>
    );
  };

  const renderReviewModal = () => {
    return (
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Leave a Review for {application?.user?.firstName || application?.employeeProfile?.firstName}
              </Text>
              <IconButton
                icon="close"
                onPress={closeReviewModal}
                disabled={isSubmittingReview}
              />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Rating Section */}
              {renderRatingStars()}
              
              {/* Project Title */}
              <View style={styles.inputSection}>
                <Text variant="labelLarge" style={styles.inputLabel}>Project Title (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="e.g., Website Development, Mobile App Design"
                  placeholderTextColor="#999"
                  editable={!isSubmittingReview}
                />
              </View>
              
              {/* Comment Section */}
              <View style={styles.inputSection}>
                <Text variant="labelLarge" style={styles.inputLabel}>Comment (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.commentInput]}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience working with this employee..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmittingReview}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={closeReviewModal}
                style={styles.modalButton}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={submitReview}
                style={styles.modalButtonPrimary}
                loading={isSubmittingReview}
                disabled={isSubmittingReview}
              >
                Submit Review
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
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

  // Improved email logic similar to ApplicationsScreen
  const getApplicantEmail = () => {
    // First try user.email if available
    if (application.user?.email) {
      return application.user.email;
    }
    
    // Then try employeeProfile.email if available  
    if (application.employeeProfile?.email) {
      return application.employeeProfile.email;
    }
    
    // Generate email from names if available
    const firstName = application.user?.firstName || application.employeeProfile?.firstName;
    const lastName = application.user?.lastName || application.employeeProfile?.lastName;
    
    if (firstName && lastName) {
      return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    }
    
    // Use the correct user ID - prefer employeeProfile.userId, fallback to application.userId
    const actualUserId = application.employeeProfile?.userId || application.userId;
    return `user${actualUserId}@example.com`;
  };

  const applicantEmail = getApplicantEmail();
  const hasResume = !!application.resumeFileBlobId;
  console.log("application", application);
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
            
            {/* Leave Review Button - Only show for accepted applications */}
            {application.applicationStatus === 'Accepted' && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.statusTitle}>Post-Project</Text>
                <Button 
                  mode="contained" 
                  icon="star-outline" 
                  onPress={openReviewModal}
                  style={[styles.statusButton, styles.reviewButton]}
                  disabled={isSubmittingReview}
                >
                  Leave Review for {application.user?.firstName || application.employeeProfile?.firstName}
                </Button>
              </>
            )}
            
            <Divider style={styles.divider} />
            
            <Text variant="titleMedium" style={styles.statusTitle}>Update Status</Text>
            
            <View style={styles.statusButtonsContainer}>
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Reviewing' || application.applicationStatus === 'Accepted' || application.applicationStatus === 'Rejected'}
                onPress={() => updateApplicationStatus('Reviewing')}
                style={[styles.statusButton, styles.reviewingButton]}
              >
                Mark as Reviewing
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Interviewed' || application.applicationStatus === 'Accepted' || application.applicationStatus === 'Rejected'}
                onPress={() => updateApplicationStatus('Interviewed')}
                style={[styles.statusButton, styles.interviewedButton]}
              >
                Mark as Interviewed
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Accepted' || application.applicationStatus === 'Rejected'}
                onPress={confirmAcceptApplicant}
                style={[styles.statusButton, styles.acceptButton]}
              >
                Accept Applicant
              </Button>
              
              <Button 
                mode="contained" 
                loading={statusUpdating}
                disabled={statusUpdating || application.applicationStatus === 'Accepted' || application.applicationStatus === 'Rejected'}
                onPress={confirmRejectApplicant}
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
        style={[
          snackbarType === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#F44336' }
        ]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
          labelStyle: { color: '#fff' }
        }}
      >
        {snackbarMessage}
      </Snackbar>
      
      {renderReviewModal()}
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  ratingLabel: {
    marginRight: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '85%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 400,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#6C63FF',
  },
  reviewButton: {
    backgroundColor: '#FFA726',
  },
});

export default ApplicationDetailsScreen; 