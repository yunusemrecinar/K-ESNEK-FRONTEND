import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button, Searchbar, useTheme, Snackbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { applicationsApi, JobApplication } from '../../services/api/applications';
import { apiClient } from '../../services/api/client';
import { jobsApi, JobResponse } from '../../services/api/jobs';
import { employerService } from '../../services/api/employer';
import { EmployerProfile } from '../../types/profile';

// Types for the application
interface Application {
  id: number;
  jobId: number;
  applicationStatus: string;
  coverLetter?: string;
  resumeId?: number;
  answers?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // UI display properties (may come from job details)
  jobTitle: string;
  companyName: string;
  location?: string;
  salary?: string;
}

// Define the navigation param list type
type RootStackParamList = {
  ApplicationDetails: { applicationId: string };
};

type ApplicationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ApplicationsScreen = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  // Cache for job and employer details to avoid duplicate requests
  const [employerCache, setEmployerCache] = useState<Record<number, EmployerProfile>>({});
  const theme = useTheme();
  const navigation = useNavigation<ApplicationsScreenNavigationProp>();

  // Fetch employer details by ID
  const fetchEmployerDetails = async (employerId: number): Promise<EmployerProfile | null> => {
    // Check cache first
    if (employerCache[employerId]) {
      return employerCache[employerId];
    }
    
    try {
      const employer = await employerService.getEmployerProfile(employerId);
      // Update cache
      setEmployerCache(prevCache => ({
        ...prevCache,
        [employerId]: employer
      }));
      return employer;
    } catch (error) {
      console.error(`Error fetching employer details for ID ${employerId}:`, error);
      return null;
    }
  };

  // Fetch job details by ID
  const fetchJobDetails = async (jobId: number): Promise<Partial<Application> | null> => {
    try {
      const response = await jobsApi.getJobById(jobId);
      
      if (response.isSuccess && response.data) {
        const jobData = response.data;
        
        // Default job details without employer info
        const jobDetails: Partial<Application> = {
          jobTitle: jobData.title,
          companyName: `Company #${jobData.employerId}`,
          location: jobData.city && jobData.country 
            ? `${jobData.city}, ${jobData.country}`
            : jobData.jobLocationType || '',
          salary: jobData.currency 
            ? `${jobData.currency}${jobData.minSalary} - ${jobData.currency}${jobData.maxSalary}`
            : `${jobData.minSalary} - ${jobData.maxSalary}`
        };
        
        // Try to fetch employer details to get company name
        try {
          const employer = await fetchEmployerDetails(jobData.employerId);
          if (employer) {
            jobDetails.companyName = employer.name;
          }
        } catch (err) {
          console.log('Could not fetch employer details:', err);
          // Continue with default company name
        }
        
        return jobDetails;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching job details for job ID ${jobId}:`, error);
      return null;
    }
  };

  // Fetch applications with job details
  const fetchApplicationsWithJobDetails = async (applications: Application[]): Promise<Application[]> => {
    // Process applications in smaller batches to avoid too many concurrent requests
    const batchSize = 5;
    const enhancedApplications: Application[] = [...applications];
    
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      const batchPromises = batch.map(async (app, index) => {
        const jobDetails = await fetchJobDetails(app.jobId);
        if (jobDetails) {
          enhancedApplications[i + index] = {
            ...app,
            ...jobDetails
          };
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    return enhancedApplications;
  };

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch applications from API
      const response = await applicationsApi.getUserApplications();
      
      if (response.isSuccess && response.data) {
        // Map the API response to our Application interface
        const formattedApplications: Application[] = response.data.map(app => ({
          id: app.id,
          jobId: app.jobId,
          applicationStatus: app.applicationStatus || 'Pending',
          coverLetter: app.coverLetter,
          resumeId: app.resumeFileBlobId,
          answers: app.answers,
          notes: app.notes,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          // Default values, will be updated with actual job details
          jobTitle: `Job #${app.jobId}`,
          companyName: 'Company',
          location: '',
          salary: ''
        }));
        
        // First set applications with basic info to show something quickly
        setApplications(formattedApplications);
        
        // Then fetch job details for each application and update the UI
        const enhancedApplications = await fetchApplicationsWithJobDetails(formattedApplications);
        setApplications(enhancedApplications);
      } else {
        console.error('Failed to fetch applications:', response.message);
        let errorMessage = 'Failed to load applications. Please try again.';
        
        // Check if it's an authorization issue
        if (response.message && response.message.includes('403')) {
          errorMessage = 'You are not authorized to view applications. Please log in again.';
          // Optionally, you could trigger a logout here or redirect to login
        }
        
        setError(errorMessage);
        setSnackbarVisible(true);
        
        // Use mock data as fallback for development only
        if (__DEV__) {
          const mockApplications: Application[] = [
            {
              id: 1,
              jobId: 1,
              applicationStatus: 'Pending',
              jobTitle: 'Software Developer',
              companyName: 'Tech Corp',
              location: 'Istanbul, Turkey',
              salary: '$50,000 - $70,000',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            // Add more mock data as needed
          ];
          setApplications(mockApplications);
        }
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      let errorMessage = 'Error loading applications. Please try again.';
      
      // Handle auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Authentication error. Please log in again.';
        // Optionally, you could trigger a logout here or redirect to login
      }
      
      setError(errorMessage);
      setSnackbarVisible(true);
      
      // Fallback to empty applications list
      setApplications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Add useEffect to call fetchApplications on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplications();
  }, [fetchApplications]);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       app.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Map API status values to our filter values
    const statusMap: Record<string, 'pending' | 'accepted' | 'rejected'> = {
      'Pending': 'pending',
      'In Review': 'pending',
      'Approved': 'accepted',
      'Accepted': 'accepted',
      'Hired': 'accepted',
      'Rejected': 'rejected',
    };
    
    const appStatus = statusMap[app.applicationStatus] || 'pending';
    const matchesFilter = selectedFilter === 'all' || appStatus === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

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

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Render application card
  const renderApplicationCard = ({ item }: { item: Application }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text variant="titleMedium" style={styles.jobTitle}>{item.jobTitle}</Text>
            <Text variant="bodyMedium" style={styles.companyName}>{item.companyName}</Text>
          </View>
          <Chip
            mode="flat"
            textStyle={{ color: '#fff' }}
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.applicationStatus) }]}
          >
            {item.applicationStatus.charAt(0).toUpperCase() + item.applicationStatus.slice(1)}
          </Chip>
        </View>
        
        <View style={styles.detailsContainer}>
          {item.location ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.detailText}>{item.location}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.detailText}>
              Applied {formatDate(item.createdAt)}
            </Text>
          </View>
          {item.salary ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.detailText}>{item.salary}</Text>
            </View>
          ) : null}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('ApplicationDetails', { applicationId: item.id.toString() })}
        >
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="file-search" size={64} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={styles.emptyStateTitle}>No Applications Found</Text>
      <Text variant="bodyMedium" style={styles.emptyStateDescription}>
        You haven't applied to any jobs yet. Start exploring opportunities!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <IconButton
            icon="briefcase-outline"
            size={24}
            style={styles.applicationsIcon}
          />
        </View>
        <Searchbar
          placeholder="Search applications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={styles.filterChip}
              mode="outlined"
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
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
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 16,
  },
  applicationsIcon: {
    marginRight: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyStateDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default ApplicationsScreen; 