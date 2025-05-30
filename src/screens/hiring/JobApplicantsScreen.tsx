import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, Chip, Avatar, Searchbar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/client';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { employeeService } from '../../services/api/employee';
import { EmployeeProfile } from '../../types/profile';

// Define types
type HiringStackParamList = {
  JobApplicants: { jobId: number };
  ApplicantProfile: { userId: number };
  ApplicationDetails: { applicationId: string };
};

type JobApplicantsRouteProp = RouteProp<HiringStackParamList, 'JobApplicants'>;
type JobApplicantsNavigationProp = NativeStackNavigationProp<HiringStackParamList>;

interface JobApplication {
  id: number;
  jobId: number;
  userId: number;
  applicationStatus: string;
  coverLetter?: string;
  resumeId: number;
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
  // Cache for fetched employee profile
  employeeProfile?: EmployeeProfile;
}

interface Job {
  id: number;
  title: string;
  applications?: JobApplication[];
}

const JobApplicantsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<JobApplicantsNavigationProp>();
  const route = useRoute<JobApplicantsRouteProp>();
  const { jobId } = route.params;
  
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [fetchingUserDetails, setFetchingUserDetails] = useState(false);

  const statusOptions = ['All', 'Pending', 'Reviewing', 'Interviewed', 'Accepted', 'Rejected'];

  const fetchJobApplicants = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch job details with applications
      const response = await apiClient.instance.get(`/jobs/${jobId}`);
      
      if (response.data && response.data.success) {
        setJob(response.data.data);
        if (response.data.data.applications && response.data.data.applications.length > 0) {
          
          // Process and validate application data
          const apps = response.data.data.applications.map((app: JobApplication) => {
            // Ensure application has proper date fields
            if (!app.createdAt) {
              console.warn(`Application ${app.id} missing createdAt field`);
              app.createdAt = new Date().toISOString();
            }
            
            if (!app.updatedAt) {
              console.warn(`Application ${app.id} missing updatedAt field`);
              app.updatedAt = app.createdAt;
            }
            
            return app;
          });
          
          setApplications(apps);
          // Fetch user details for each application
          fetchUserDetailsForApplications(apps);
        } else {
          setApplications([]);
        }
      } else {
        setError('Failed to fetch job applicants');
        setApplications([]);
      }
    } catch (err) {
      console.error('Error fetching job applicants:', err);
      setError('Failed to load applicants. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserDetailsForApplications = async (applications: JobApplication[]) => {
    if (!applications || applications.length === 0) return;
    
    setFetchingUserDetails(true);
    
    try {
      const updatedApplications = [...applications];
      
      // Fetch employee profiles for each application
      for (let i = 0; i < applications.length; i++) {
        const app = applications[i];
        
        if (app.userId && !app.employeeProfile) {
          try {
            // Fetch employee profile using the public endpoint (now includes email)
            const employeeProfile = await employeeService.getPublicEmployeeProfile(app.userId);
            
            // Update application with employee profile
            updatedApplications[i] = {
              ...app,
              employeeProfile,
              user: {
                id: app.userId,
                firstName: employeeProfile.firstName || '',
                lastName: employeeProfile.lastName || '',
                email: employeeProfile.email || `user${app.userId}@example.com`,
                profilePicture: employeeProfile.profilePictureUrl
              }
            };
            
            // Update the applications state to show progress
            setApplications([...updatedApplications]);
          } catch (error: any) {
            console.error(`Error fetching profile for user ${app.userId}:`, error);
            
            // Create basic profile with userId information only for failed requests
            updatedApplications[i] = {
              ...app,
              user: {
                id: app.userId,
                firstName: '',
                lastName: '',
                email: `user${app.userId}@example.com`,
                profilePicture: undefined
              }
            };
          }
        }
      }
      
      // Final update with all fetched profiles
      setApplications(updatedApplications);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setFetchingUserDetails(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobApplicants(true);
  }, [jobId]);

  useEffect(() => {
    fetchJobApplicants();
  }, [jobId]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status === 'All' ? null : status);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      (app.user && 
        (app.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         app.user.email.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesStatus = !statusFilter || app.applicationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  console.log("filteredApplications", filteredApplications);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const getStatusColor = (status?: string) => {
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

  const formatDate = (dateString?: string) => {
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
        .replace(',', ',').replace(' at', ' at'); // Ensure consistent formatting
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

  const renderApplicantCard = ({ item }: { item: JobApplication }) => {
    // Use the employee profile data if available
    const hasEmployeeProfile = !!item.employeeProfile;
    const hasUserData = item.user && (item.user.firstName || item.user.lastName || item.user.email);
    const isProfileMissing = !hasEmployeeProfile && item.userId;
    
    // Generate fallback user name based on userId if no other data is available
    const generateFallbackUserName = (userId: number) => {
      return `Applicant #${userId}`;
    };
    
    let userName: string;
    let userEmail: string;
    let profilePicture: string | undefined;
    
    if (hasEmployeeProfile) {
      // Use data from employee profile (now includes email from backend)
      userName = `${item.employeeProfile?.firstName || ''} ${item.employeeProfile?.lastName || ''}`.trim();
      userEmail = item.employeeProfile?.email || `user${item.userId}@example.com`;
      profilePicture = item.employeeProfile?.profilePictureUrl;
    } else {
      // Fallback to basic user data
      userName = hasUserData 
        ? `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() 
        : 'Unknown Applicant';
      userEmail = item.user?.email || `user${item.userId}@example.com`;
      profilePicture = item.user?.profilePicture;
    }
    
    // If we still don't have a name, show a placeholder based on userId
    if (!userName || userName.trim() === '') {
      userName = item.userId ? generateFallbackUserName(item.userId) : 'Unknown Applicant';
    }
    
    // Format the application date
    let applicationDateText = 'Date not available';
    
    if (item.createdAt) {
      try {
        // Try to create a date object from the string
        const applicationDate = new Date(item.createdAt);
        
        if (!isNaN(applicationDate.getTime())) {
          // Format as "Month Day, Year at Time" (e.g., "May 12, 2025 at 14:47")
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          };
          
          applicationDateText = `Applied: ${applicationDate.toLocaleDateString(undefined, options)}`;
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
    }
    
    const hasApplicationStatus = item.applicationStatus && item.applicationStatus.trim() !== '';
    const displayStatus = hasApplicationStatus ? item.applicationStatus : 'Pending';
    
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.applicantHeader}>
            <View style={styles.applicantInfo}>
              {isProfileMissing && (
                <View style={styles.warningBadge}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#FFF" />
                </View>
              )}
              {profilePicture ? (
                <Avatar.Image 
                  size={50} 
                  source={{ uri: profilePicture }} 
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={50}
                  label={getInitials(item.employeeProfile?.firstName || item.user?.firstName, 
                                  item.employeeProfile?.lastName || item.user?.lastName)}
                  style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                  color="#ffffff"
                />
              )}
              <View>
                <Text variant="titleMedium" style={styles.applicantName}>
                  {userName}
                </Text>
                <Text style={styles.applicantEmail}>{userEmail}</Text>
                <Text style={styles.date}>
                  {applicationDateText}
                </Text>
                <View style={styles.metaInfoRow}>
                  <Text style={styles.metaInfoText}>
                    Job: #{item.jobId} • Application: #{item.id}
                  </Text>
                </View>
                {isProfileMissing && (
                  <Text style={styles.warningText}>
                    Employee profile not found
                  </Text>
                )}
              </View>
            </View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(displayStatus) }]}
              textStyle={{ color: '#fff' }}
            >
              {displayStatus}
            </Chip>
          </View>
          
          {item.coverLetter && item.coverLetter.trim() !== '' && (
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Cover Letter</Text>
              <Text numberOfLines={3}>{item.coverLetter}</Text>
            </View>
          )}
          
          <View style={styles.buttonsContainer}>
            <Button 
              mode="outlined" 
              style={styles.button}
              onPress={() => {
                // Navigate to applicant profile
                if (item.userId) {
                  navigation.navigate('ApplicantProfile', { userId: item.userId });
                }
              }}
              disabled={!item.userId || isProfileMissing ? true : false}
            >
              View Profile
            </Button>
            <Button 
              mode="contained" 
              style={styles.button}
              onPress={() => {
                // Navigate to detailed application screen
                navigation.navigate('ApplicationDetails', { applicationId: item.id.toString() });
              }}
            >
              View Application
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-search-outline" size={80} color={theme.colors.primary} />
      <Text variant="titleMedium" style={styles.emptyText}>
        No applicants found
      </Text>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => fetchJobApplicants()} 
            style={styles.retryButton}
          >
            Retry
          </Button>
        </>
      ) : searchQuery || statusFilter ? (
        <Text style={styles.emptyDescription}>Try adjusting your search or filters</Text>
      ) : (
        <Text style={styles.emptyDescription}>When candidates apply for this job, they'll appear here</Text>
      )}
    </View>
  );

  // Calculate counts for the summary
  const applicantsCount = filteredApplications.length;

  // Define styles here to access the theme object
  const dynamicStyles = {
    countChip: {
      marginLeft: 8,
      height: 32,
      backgroundColor: theme.colors.primary,
    },
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Button 
            icon="arrow-left" 
            mode="text" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back
          </Button>
          {job && (
            <Text variant="headlineMedium" style={styles.title}>
              {job.title}
            </Text>
          )}
        </View>
        
        {!job && (
          <View style={styles.loadingTitleContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.loadingText}>Loading job details...</Text>
          </View>
        )}

        {/* Summary section */}
        {applications.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text variant="titleMedium" style={styles.summaryTitle}>Applicants</Text>
              <Chip mode="flat" style={dynamicStyles.countChip}>
                {applications.length}
              </Chip>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="account-group" size={22} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryItemText}>
                  {applications.length} {applications.length === 1 ? 'candidate' : 'candidates'}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <Searchbar
          placeholder="Search applicants"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <FlatList
          data={statusOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={statusFilter === item || (item === 'All' && !statusFilter)}
              showSelectedCheck={false}
              onPress={() => handleStatusChange(item)}
              style={styles.filterChip}
              selectedColor={theme.colors.primary}
            >
              {item}
            </Chip>
          )}
          keyExtractor={(item) => item}
          style={styles.chipsList}
          contentContainerStyle={styles.chipsContainer}
        />
        
        {fetchingUserDetails && (
          <View style={styles.fetchingIndicatorContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.fetchingIndicator} />
            <Text variant="bodySmall">Fetching applicant details...</Text>
          </View>
        )}
      </View>

      <Divider />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {filteredApplications.length > 0 && (
            <View style={styles.listHeaderContainer}>
              <Text variant="titleSmall" style={styles.listHeaderText}>
                {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'} 
                {statusFilter ? ` - ${statusFilter}` : ''}
                {searchQuery ? ` matching "${searchQuery}"` : ''}
              </Text>
            </View>
          )}
          <FlatList
            data={filteredApplications}
            renderItem={renderApplicantCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
          />
        </>
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginLeft: -8,
  },
  title: {
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  loadingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    elevation: 0,
    borderRadius: 8,
  },
  chipsList: {
    marginBottom: 12,
  },
  chipsContainer: {
    paddingVertical: 4,
    gap: 10,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    // Android shadow
    elevation: 2,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    marginRight: 12,
  },
  applicantName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  applicantEmail: {
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    marginVertical: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  fetchingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 6,
    borderRadius: 8,
  },
  fetchingIndicator: {
    marginRight: 8,
  },
  warningBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  summaryItemText: {
    marginLeft: 4,
  },
  metaInfoRow: {
    marginTop: 2,
  },
  metaInfoText: {
    fontSize: 11,
    color: '#666',
  },
  listHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listHeaderText: {
    color: '#666',
  },
});

export default JobApplicantsScreen; 