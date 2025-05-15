import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Chip, Button, Divider, Banner, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import { jobsApi, JobResponse } from '../../services/api/jobs';
import { recommendationsApi, JobRecommendationDto } from '../../services/api/recommendations';

// Utils
import { 
  filterJobsByQuery, 
  convertRecommendationToJobResponse, 
  sortJobsByRecommendation,
  EnhancedJobResponse 
} from '../../utils/jobSearchUtils';

// Components
import JobCard from '../../components/JobCard';

// Types
interface User {
  id: number | string;
  email: string;
  role?: string;
  // Add other properties as needed
}

// Navigation types
type RootStackParamList = {
  JobSearch: undefined;
  JobDetails: { jobId: number };
};

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
};

// Recent search history stored in state (in a real app, this would come from persistent storage)
const popularCategories = [
  'Remote',
  'Full-time',
  'Part-time',
  'Contract',
  'Technology',
  'Marketing',
  'Design',
];

const JobSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedJobResponse[]>([]);
  const [allJobs, setAllJobs] = useState<EnhancedJobResponse[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<EnhancedJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecommended, setShowRecommended] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // User state replacing the useCurrentUser hook
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const navigation = useNavigation() as NavigationProp;
  const theme = useTheme();

  // Load user data from AsyncStorage
  const loadUserData = useCallback(async () => {
    try {
      setUserLoading(true);
      // Get user from AsyncStorage
      const userJson = await AsyncStorage.getItem('employeeData');
      const accountType = await AsyncStorage.getItem('accountType');
      
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        
        // Make sure the role is included in the user object
        if (accountType) {
          // Map accountType to the role needed for recommendations
          // The backend expects 'Employee' or 'Employer' (capitalized)
          parsedUser.role = accountType === 'employee' ? 'Employee' : 'Employer';
        }
        
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      setErrorMessage('Failed to load user data');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Fetch all jobs
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await jobsApi.getAllJobs();
      
      // Check if we got a properly formatted response
      if (response.isSuccess) {
        setAllJobs(response.data);
        setSearchResults(response.data);
      } else {
        setErrorMessage('Could not load jobs. Please try again later.');
      }
    } catch (error) {
      setErrorMessage('Could not load jobs. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch recommended jobs
  const fetchRecommendedJobs = useCallback(async () => {
    // Check if user exists and has appropriate role
    if (!user) {
      return;
    }
    
    if (!user.id) {
      return;
    }
    
    if (user.role !== 'Employee') {
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert user.id to number if it's a string
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      const response = await recommendationsApi.getRecommendedJobsForUser(userId);
      
      // Handle potential API response format issues
      if (response.isSuccess) {
        // Convert recommendations to job format
        const convertedJobs = response.data.map(convertRecommendationToJobResponse);
        setRecommendedJobs(convertedJobs);
        
        if (response.data.length === 0) {
          Alert.alert('No recommendations', 'We don\'t have any job recommendations for you at this time.');
        }
      } else {
        Alert.alert('Error', 'Could not retrieve job recommendations. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching job recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, user]);

  // Initial data loading
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load recommendations when we have user data
  useEffect(() => {
    if (!userLoading && user) {
      fetchRecommendedJobs();
    }
  }, [userLoading, user, fetchRecommendedJobs]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    await Promise.all([fetchJobs(), fetchRecommendedJobs()]);
    setIsRefreshing(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reset to show all jobs
      setSearchResults(allJobs);
      return;
    }
    
    // Filter jobs based on search query
    const filtered = filterJobsByQuery(allJobs, query);
    setSearchResults(filtered as EnhancedJobResponse[]);
    
    // Add to recent searches (prevent duplicates)
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  // Handle applying a category filter
  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  // Toggle between all jobs and recommended jobs
  const toggleRecommendedJobs = () => {
    setShowRecommended(prev => !prev);
  };

  // Handle job selection
  const handleJobSelect = (job: EnhancedJobResponse) => {
    // Navigate to job details with proper typing
    navigation.navigate('JobDetails', { jobId: job.id });
  };

  // Combine and filter jobs based on current state
  const getDisplayJobs = (): EnhancedJobResponse[] => {
    let displayJobs = [...searchResults];
    
    // Add recommended jobs if toggled on
    if (showRecommended && recommendedJobs.length > 0) {
      // Only add recommendations that aren't already in the search results
      const recommendationIds = new Set(recommendedJobs.map(job => job.id));
      const regularJobs = displayJobs.filter(job => !recommendationIds.has(job.id));
      displayJobs = [...recommendedJobs, ...regularJobs];
    }
    
    // Apply category filters if any
    if (activeFilters.length > 0) {
      displayJobs = displayJobs.filter(job => {
        // Check if job matches any active filter
        return activeFilters.some(filter => {
          const lowerFilter = filter.toLowerCase();
          // Check job properties that might match the filter
          return (
            (job.employmentType && job.employmentType.toLowerCase().includes(lowerFilter)) ||
            (job.jobLocationType && job.jobLocationType.toLowerCase() === 'remote' && lowerFilter === 'remote') ||
            (job.categoryId?.toString() === filter)
          );
        });
      });
    }
    
    // Sort by recommendation score if available
    return sortJobsByRecommendation(displayJobs) as EnhancedJobResponse[];
  };

  const filteredJobs = getDisplayJobs();

  // Render job item
  const renderJobItem = ({ item }: { item: EnhancedJobResponse }) => (
    <JobCard 
      job={item}
      onPress={handleJobSelect}
      isRecommendation={item.isRecommendation}
      recommendationScore={item.recommendationScore}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Find Your Perfect Job
        </Text>
        <Searchbar
          placeholder="Search for jobs..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon={() => <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.primary} />}
          right={() => (
            <MaterialCommunityIcons
              name="tune-variant"
              size={24}
              color={theme.colors.primary}
              style={styles.filterIcon}
            />
          )}
        />
      </View>

      {errorMessage && (
        <Banner
          visible={!!errorMessage}
          actions={[
            {
              label: 'Dismiss',
              onPress: () => setErrorMessage(null),
            },
            {
              label: 'Try Again',
              onPress: handleRefresh,
            },
          ]}
          icon={({size}) => (
            <MaterialCommunityIcons name="alert-circle" size={size} color="#F44336" />
          )}
          style={styles.banner}
        >
          {errorMessage}
        </Banner>
      )}

      <View style={styles.filtersContainer}>
        <FlatList
          data={popularCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={activeFilters.includes(item)}
              onPress={() => handleFilterToggle(item)}
              style={[
                styles.filterChip,
                activeFilters.includes(item) && styles.activeFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                activeFilters.includes(item) && styles.activeFilterChipText
              ]}
              elevation={2}
            >
              {item}
            </Chip>
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersScrollContent}
        />
      </View>

      {recommendedJobs.length > 0 && (
        <View style={styles.recommendedToggle}>
          <LinearGradient
            colors={showRecommended ? ['#6C63FF', '#5A52D5'] : ['#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.recommendedButton,
              showRecommended ? styles.recommendedButtonActive : styles.recommendedButtonInactive
            ]}
          >
            <TouchableOpacity
              onPress={toggleRecommendedJobs}
              style={styles.recommendedButtonTouchable}
            >
              <MaterialCommunityIcons 
                name="star" 
                size={20} 
                color={showRecommended ? "#FFFFFF" : "#6C63FF"} 
              />
              <Text style={[
                styles.recommendedButtonLabel,
                showRecommended ? styles.recommendedButtonLabelActive : styles.recommendedButtonLabelInactive
              ]}>
                {showRecommended ? "Showing Recommended" : "Show Recommended"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <Divider style={styles.divider} />

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <>
          {searchQuery.length === 0 && recentSearches.length > 0 && filteredJobs.length === 0 && (
            <View style={styles.recentSearchesContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recent Searches
              </Text>
              <View style={styles.recentSearchesList}>
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    style={styles.recentSearchChip}
                    onPress={() => handleSearch(search)}
                    icon={() => (
                      <MaterialCommunityIcons name="history" size={16} color={theme.colors.primary} />
                    )}
                    elevation={1}
                  >
                    {search}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <FlatList
            data={filteredJobs}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.jobsList}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={handleRefresh} 
                colors={[theme.colors.primary]} 
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="file-search-outline" 
                  size={80} 
                  color={theme.colors.surfaceVariant} 
                />
                <Text variant="titleLarge" style={styles.emptyText}>
                  No jobs found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Try adjusting your search or filters
                </Text>
                {!isLoading && filteredJobs.length === 0 && !errorMessage && (
                  <Button 
                    mode="contained" 
                    onPress={handleRefresh}
                    style={styles.retryButton}
                    contentStyle={styles.retryButtonContent}
                    icon={({size, color}) => 
                      <MaterialCommunityIcons name="refresh" size={size} color={color} />
                    }
                  >
                    Refresh
                  </Button>
                )}
              </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    marginBottom: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchBar: {
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    fontSize: 16,
    marginLeft: 6,
  },
  filterIcon: {
    marginRight: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 6,
  },
  filtersContainer: {
    marginVertical: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  filterChip: {
    marginRight: 10,
    backgroundColor: '#fff',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    height: 36,
    marginBottom: 2,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  activeFilterChip: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  filterChipText: {
    color: '#333',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '600',
  },
  recommendedToggle: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  recommendedButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recommendedButtonActive: {
    borderWidth: 0,
  },
  recommendedButtonInactive: {
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  recommendedButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  recommendedButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  recommendedButtonLabelActive: {
    color: '#FFFFFF',
  },
  recommendedButtonLabelInactive: {
    color: '#6C63FF',
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 8,
  },
  jobsList: {
    padding: 20,
    paddingTop: 12,
  },
  itemSeparator: {
    height: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#555',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 24,
    color: '#333',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
  },
  recentSearchesContainer: {
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    margin: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentSearchChip: {
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});

export default JobSearchScreen; 