import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Searchbar, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { applicationsApi, JobApplication } from '../../services/api/applications';
import { employeeService } from '../../services/api/employee';
import { EmployeeProfile } from '../../types/profile';
import { jobsApi } from '../../services/api/jobs';

interface EnhancedApplication extends JobApplication {
  jobTitle: string;
  employeeProfile?: EmployeeProfile;
}

type HiringStackParamList = {
  Applications: undefined;
  ApplicantProfile: { userId: number };
  ApplicationDetails: { applicationId: string };
  JobApplicants: { jobId: number };
  PostJob: undefined;
};

type ApplicationsNavigationProp = NativeStackNavigationProp<HiringStackParamList>;

const ApplicationsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ApplicationsNavigationProp>();
  const [applications, setApplications] = useState<EnhancedApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<EnhancedApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [error, setError] = useState<string | null>(null);

  const filters: Array<{ label: string; value: 'all' | 'pending' | 'shortlisted' | 'rejected' }> = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return theme.colors.primary;
      case 'shortlisted':
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  // Fetch employee details by user ID
  const fetchEmployeeDetails = async (userId: number): Promise<EmployeeProfile | null> => {
    try {
      return await employeeService.getPublicEmployeeProfile(userId);
    } catch (error) {
      console.error(`Error fetching employee details for ID ${userId}:`, error);
      return null;
    }
  };

  // Enhance applications with employee profiles
  const enhanceApplicationsWithEmployeeProfiles = async (apps: EnhancedApplication[]) => {
    const enhancedApps = [...apps];
    
    for (let i = 0; i < apps.length; i++) {
      if (apps[i].userId && !apps[i].employeeProfile) {
        try {
          const profile = await fetchEmployeeDetails(apps[i].userId);
          if (profile) {
            enhancedApps[i] = {
              ...enhancedApps[i],
              employeeProfile: profile
            };
          }
        } catch (error) {
          console.error(`Failed to fetch profile for user ${apps[i].userId}:`, error);
        }
      }
    }
    
    return enhancedApps;
  };

  // Fetch job details if needed
  const fetchJobDetails = async (jobId: number): Promise<string> => {
    try {
      const response = await jobsApi.getJobById(jobId);
      if (response.isSuccess && response.data) {
        return response.data.title;
      }
      return `Job #${jobId}`;
    } catch (error) {
      console.error(`Error fetching job details for job ID ${jobId}:`, error);
      return `Job #${jobId}`;
    }
  };

  // Enhance applications with job titles if missing
  const enhanceApplicationsWithJobDetails = async (apps: EnhancedApplication[]): Promise<EnhancedApplication[]> => {
    const enhancedApps = [...apps];
    const jobDetailsPromises: Promise<void>[] = [];
    
    // Find applications missing job titles
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      if (!app.jobTitle) {
        jobDetailsPromises.push(
          (async () => {
            const jobTitle = await fetchJobDetails(app.jobId);
            enhancedApps[i] = {
              ...enhancedApps[i],
              jobTitle
            };
          })()
        );
      }
    }
    
    // Wait for all promises to resolve
    if (jobDetailsPromises.length > 0) {
      await Promise.all(jobDetailsPromises);
    }
    
    return enhancedApps;
  };

  // Fetch all applications for the employer's jobs
  const fetchApplications = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      setError(null);

      const response = await applicationsApi.getEmployerApplications();
      console.log("applications response", response);
      
      if (response.isSuccess) {
        // Handle the case where there are no jobs or applications
        if (!response.data || response.data.length === 0) {
          setApplications([]);
          setFilteredApplications([]);
          // Don't set error, just leave applications empty
          return;
        }
        
        console.log("response.data", response.data);
        
        // Sort applications by date (newest first)
        const sortedApps = response.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Create enhanced applications with required jobTitle field
        const enhancedApps: EnhancedApplication[] = sortedApps.map(app => {
          // Use any type to avoid TypeScript errors with potential jobTitle property
          const appAny = app as any;
          return {
            ...app,
            // Use the jobTitle if it exists in the returned data (from the API mapping),
            // otherwise use a fallback format
            jobTitle: appAny.jobTitle || `Job #${app.jobId}`
          };
        });
        
        setApplications(enhancedApps);
        
        // Apply filters and search
        applyFiltersAndSearch(enhancedApps, selectedFilter, searchQuery);
        
        // First, fetch employee details in the background
        const withEmployeeProfiles = await enhanceApplicationsWithEmployeeProfiles(enhancedApps);
        
        // Then, fetch any missing job details if needed
        const fullyEnhancedApps = await enhanceApplicationsWithJobDetails(withEmployeeProfiles);
        
        // Update state with both enhancements
        setApplications(fullyEnhancedApps);
        applyFiltersAndSearch(fullyEnhancedApps, selectedFilter, searchQuery);
      } else {
        setError(response.message || 'Failed to load applications');
        setApplications([]);
        setFilteredApplications([]);
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'An error occurred while fetching applications');
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, searchQuery]);

  const applyFiltersAndSearch = (apps: EnhancedApplication[], filter: string, query: string) => {
    let filtered = apps;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(app => 
        app.applicationStatus.toLowerCase() === filter.toLowerCase()
      );
    }
    
    // Apply search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(app => {
        const employeeName = app.employeeProfile 
          ? `${app.employeeProfile.firstName} ${app.employeeProfile.lastName}`.toLowerCase() 
          : '';
        
        return (
          app.jobTitle.toLowerCase().includes(searchTerm) ||
          employeeName.includes(searchTerm)
        );
      });
    }
    
    setFilteredApplications(filtered);
  };

  // Handle search query changes
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    applyFiltersAndSearch(applications, selectedFilter, query);
  };

  // Handle filter changes
  const handleFilterChange = (filter: 'all' | 'pending' | 'shortlisted' | 'rejected') => {
    setSelectedFilter(filter);
    applyFiltersAndSearch(applications, filter, searchQuery);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplications(true);
  }, [fetchApplications]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getInitials = (profile?: EmployeeProfile) => {
    if (!profile || (!profile.firstName && !profile.lastName)) return '?';
    return `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  const navigateToJobApplicants = (jobId: number) => {
    navigation.navigate('JobApplicants', { jobId });
  };

  const navigateToApplicantProfile = (userId: number) => {
    navigation.navigate('ApplicantProfile', { userId });
  };

  const navigateToApplicationDetails = (applicationId: string) => {
    navigation.navigate('ApplicationDetails', { applicationId });
  };

  const renderApplicationCard = ({ item }: { item: EnhancedApplication }) => {
    // Get applicant information
    const hasEmployeeProfile = !!item.employeeProfile;
    const firstName = item.employeeProfile?.firstName || '';
    const lastName = item.employeeProfile?.lastName || '';
    const applicantName = firstName && lastName ? `${firstName} ${lastName}` : `Applicant #${item.userId}`;
    
    // Get email from profile or generate a placeholder
    const applicantEmail = `employee${item.userId}@example.com`;
    
    // Get profile picture
    const profilePicture = item.employeeProfile?.profilePictureUrl;
    
    // Format date
    const applicationDate = new Date(item.createdAt);
    const formattedDate = !isNaN(applicationDate.getTime()) 
      ? `Applied: ${applicationDate.toLocaleDateString(undefined, {
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        })}`
      : 'Date unknown';
    
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.applicantHeader}>
            <View style={styles.applicantInfo}>
              {profilePicture ? (
                <Avatar.Image 
                  size={50} 
                  source={{ uri: profilePicture }} 
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={50}
                  label={getInitials(item.employeeProfile)}
                  style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                  color="#ffffff"
                />
              )}
              <View>
                <Text variant="titleMedium" style={styles.applicantName}>
                  {applicantName}
                </Text>
                <Text style={styles.applicantEmail}>{applicantEmail}</Text>
                <Text style={styles.date}>
                  {formattedDate}
                </Text>
                <View style={styles.metaInfoRow}>
                  <Text style={styles.metaInfoText}>
                    Job: #{item.jobId} • Application: #{item.id}
                  </Text>
                </View>
              </View>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.applicationStatus) }]}
              textStyle={{ color: '#fff' }}
            >
              {item.applicationStatus.charAt(0).toUpperCase() + item.applicationStatus.slice(1)}
            </Chip>
          </View>
          
          {item.coverLetter && (
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Cover Letter</Text>
              <Text numberOfLines={3}>{item.coverLetter}</Text>
            </View>
          )}
          
          <View style={styles.buttonsContainer}>
            <Button 
              mode="outlined" 
              style={styles.button}
              onPress={() => navigateToApplicantProfile(item.userId)}
            >
              View Profile
            </Button>
            <Button 
              mode="contained" 
              style={styles.button}
              onPress={() => navigateToApplicationDetails(item.id.toString())}
            >
              View Application
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Applications
        </Text>
        <Searchbar
          placeholder="Search applications"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              selected={selectedFilter === filter.value}
              onPress={() => handleFilterChange(filter.value)}
              style={styles.filterChip}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Loading applications...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.error }}>{error}</Text>
          <Button mode="contained" onPress={() => fetchApplications()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium">No applications found</Text>
              <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>
                {searchQuery || selectedFilter !== 'all' 
                  ? 'Try changing your search or filters'
                  : 'You have no job applications yet. Post a job to start receiving applications.'}
              </Text>
              {!searchQuery && selectedFilter === 'all' && (
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('PostJob')}
                  style={{ marginTop: 16 }}
                >
                  Post a Job
                </Button>
              )}
            </View>
          }
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
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    elevation: 0,
    borderRadius: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
  },
  listContainer: {
    padding: 16,
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
  metaInfoRow: {
    marginTop: 2,
  },
  metaInfoText: {
    fontSize: 11,
    color: '#666',
  },
  experience: {
    marginBottom: 8,
    color: '#666',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillChip: {
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
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
    padding: 16,
  },
});

export default ApplicationsScreen; 