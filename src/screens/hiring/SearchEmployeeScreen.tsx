import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Card, Button, useTheme, Chip, Avatar, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { employeeService } from '../../services/api/employee';
import { recommendationsApi, UserRecommendationDto } from '../../services/api/recommendations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { EmployeeProfile } from '../../types/profile';

// Define navigation types
type HiringStackParamList = {
  ApplicantProfile: { userId: number };
  Chat: { 
    userId: string; 
    userName: string; 
    userImage: string;
    idType?: 'employee' | 'employer';
  };
};

type HiringNavigationProp = NativeStackNavigationProp<HiringStackParamList>;

// SearchMode type for toggling between all employees and recommended employees
type SearchMode = 'all' | 'recommended';

// Extended employee interface that includes recommendation data
interface EmployeeWithRecommendation extends Partial<EmployeeProfile> {
  userId: number;
  firstName: string;
  lastName: string;
  score?: number;
  matchingSkills?: string[];
  availableNow?: boolean;
  jobTitle?: string;
  location?: string;
  yearsOfExperience?: number;
  certifications?: string[];
  profilePictureUrl?: string;
}

const SearchEmployeeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<HiringNavigationProp>();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<EmployeeWithRecommendation[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('recommended');
  const [recommendations, setRecommendations] = useState<UserRecommendationDto[]>([]);
  
  // Fetch regular employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await employeeService.getAllEmployees();
      
      // Transform to include properties needed for the UI
      const enhancedEmployees: EmployeeWithRecommendation[] = response.map(emp => ({
        userId: emp.userId || emp.id || 0, // Ensure userId is never undefined
        firstName: emp.firstName || 'Unknown',
        lastName: emp.lastName || 'User',
        profilePictureUrl: emp.profilePictureUrl || `https://i.pravatar.cc/150?u=${emp.userId || emp.id || 0}`,
        jobTitle: 'Professional', // Default value
        yearsOfExperience: emp.yearsOfExperience || Math.floor(Math.random() * 10) + 1,
        location: emp.location || 'Remote',
        certifications: Array.isArray(emp.certifications) ? emp.certifications : [],
        availableNow: Math.random() > 0.5, // Mock data for availableNow (remove in production)
      }));
      
      setEmployees(enhancedEmployees);
      
      // Only update filtered employees if we're in 'all' mode
      if (searchMode === 'all') {
        setFilteredEmployees(enhancedEmployees);
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      // Log more details about the error
      if (err.response) {
        console.error('HTTP Status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      // Don't set error here to allow recommendations to still work
      setEmployees([]);
      
      // If we're in 'all' mode, show an appropriate error
      if (searchMode === 'all') {
        // If we have recommendations, create fallback data and show a warning
        if (recommendations.length > 0) {
          const fallbackEmployees = createEmployeesFromRecommendations(recommendations);
          setFilteredEmployees(fallbackEmployees);
          setError('Unable to load all employees. Showing recommended employees instead.');
        } else {
          setError('Failed to load employees. Please try again.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Create employee profiles from recommendation data
  const createEmployeesFromRecommendations = (recs: UserRecommendationDto[]): EmployeeWithRecommendation[] => {
    return recs.map(rec => ({
      userId: rec.recommendedUserId,
      firstName: rec.recommendedUserName?.split(' ')[0] || 'Unknown',
      lastName: rec.recommendedUserName?.split(' ').slice(1).join(' ') || 'User',
      jobTitle: rec.recommendedUserTitle || 'Job Seeker',
      score: rec.score,
      matchingSkills: rec.matchingSkills || [],
      yearsOfExperience: Math.floor(Math.random() * 10) + 1, // Mock data
      availableNow: Math.random() > 0.5, // Mock data
      location: 'Remote', // Mock data
      profilePictureUrl: `https://i.pravatar.cc/150?u=${rec.recommendedUserId}`,
    }));
  };
  
  // Fetch recommended employees
  const fetchRecommendedEmployees = async () => {
    if (!user?.id) {
      setError('User ID not available. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we're passing a number for employerId
      const employerId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const response = await recommendationsApi.getRecommendedUsersForEmployer(employerId);
      
      if (response.isSuccess && response.data) {
        setRecommendations(response.data);
        
        // Create employee objects from recommendation data
        const recommendedEmployees = createEmployeesFromRecommendations(response.data);
        
        if (searchMode === 'recommended') {
          setFilteredEmployees(recommendedEmployees);
        }
        
        // Try to update existing employee data with recommendation scores
        if (employees.length > 0) {
          updateFilteredEmployeesWithRecommendations(response.data);
        } else {
          // If no employees data, just use the recommendations
          setEmployees(prevEmployees => {
            const combinedEmployees = [...prevEmployees];
            
            // Add any new employees from recommendations
            recommendedEmployees.forEach(recEmp => {
              if (!combinedEmployees.some(emp => emp.userId === recEmp.userId)) {
                combinedEmployees.push(recEmp);
              }
            });
            
            return combinedEmployees;
          });
        }
      } else {
        setError(response.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Update filtered employees with recommendation data
  const updateFilteredEmployeesWithRecommendations = (recs: UserRecommendationDto[]) => {
    if (searchMode === 'recommended') {
      // If there are no employees yet, create them from recommendations
      if (employees.length === 0) {
        const recommendedEmployees = createEmployeesFromRecommendations(recs);
        setFilteredEmployees(recommendedEmployees);
        return;
      }
      
      // Filter employees that have recommendations and merge recommendation data
      const recommendedEmployees = employees.filter(emp => 
        recs.some(rec => rec.recommendedUserId === emp.userId)
      ).map(emp => {
        const recommendation = recs.find(rec => rec.recommendedUserId === emp.userId);
        return {
          ...emp,
          score: recommendation?.score,
          matchingSkills: recommendation?.matchingSkills,
        };
      });
      
      // If no matches found in existing employees, create new ones from recommendations
      if (recommendedEmployees.length === 0) {
        const newEmployees = createEmployeesFromRecommendations(recs);
        setFilteredEmployees(newEmployees);
        return;
      }
      
      // Sort by recommendation score (highest first)
      recommendedEmployees.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      setFilteredEmployees(recommendedEmployees);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (searchMode === 'all') {
      fetchEmployees();
    } else {
      fetchRecommendedEmployees();
    }
  }, [searchMode]);
  
  // Initial data fetch
  useEffect(() => {
    // Try to fetch regular employees, but don't block on it
    fetchEmployees().catch(() => {
      console.log('Could not fetch employees, continuing with recommendations only');
    });
    
    // Always try to get recommendations if we have a user ID
    if (user?.id) {
      fetchRecommendedEmployees();
    }
  }, [user?.id]);
  
  // Update displayed employees when search mode changes
  useEffect(() => {
    if (searchMode === 'all') {
      // If we have recommendations but no employees data, create fallback employee data
      if (employees.length === 0 && recommendations.length > 0) {
        const fallbackEmployees = createEmployeesFromRecommendations(recommendations);
        setFilteredEmployees(fallbackEmployees);
        setError('Sorry, we couldn\'t load all employees. Showing recommendations instead.');
      } else {
        setFilteredEmployees(employees);
        if (employees.length === 0) {
          setError('No employees available. Please try again later.');
        }
      }
    } else if (recommendations.length > 0) {
      updateFilteredEmployeesWithRecommendations(recommendations);
      setError(null); // Clear any errors when switching to recommendations view
    } else if (user?.id) {
      fetchRecommendedEmployees();
    }
  }, [searchMode, employees, recommendations]);
  
  // Filter employees based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // If no search query, restore the appropriate list based on mode
      if (searchMode === 'all') {
        setFilteredEmployees(employees);
      } else {
        updateFilteredEmployeesWithRecommendations(recommendations);
      }
    } else {
      // Apply search filtering to the current list (all or recommended)
      const currentList = searchMode === 'all' ? employees : filteredEmployees;
      const query = searchQuery.toLowerCase();
      
      const filtered = currentList.filter(
        employee => 
          (employee.firstName && employee.firstName.toLowerCase().includes(query)) ||
          (employee.lastName && employee.lastName.toLowerCase().includes(query)) ||
          (employee.location && employee.location.toLowerCase().includes(query)) ||
          (employee.jobTitle && employee.jobTitle.toLowerCase().includes(query)) ||
          (employee.certifications && employee.certifications.some(skill => skill.toLowerCase().includes(query)))
      );
      
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees, searchMode, recommendations]);
  
  const handleEmployeePress = (employee: EmployeeWithRecommendation) => {
    navigation.navigate('ApplicantProfile', { userId: employee.userId });
  };
  
  const handleContactEmployee = (employee: EmployeeWithRecommendation) => {
    // Navigate to chat screen with this employee
    navigation.navigate('Chat', {
      userId: employee.userId.toString(),
      userName: `${employee.firstName} ${employee.lastName}`,
      userImage: employee.profilePictureUrl || `https://i.pravatar.cc/150?u=${employee.userId}`,
      idType: 'employee'
    });
  };
  
  const handleModeChange = (value: string) => {
    const newMode = value as SearchMode;
    setSearchMode(newMode);
    
    // If switching to "all" mode and we don't have employee data, try to fetch it
    if (newMode === 'all' && employees.length === 0) {
      fetchEmployees();
    } else if (newMode === 'recommended' && recommendations.length === 0 && user?.id) {
      // If switching to "recommended" mode and we don't have recommendations, fetch them
      fetchRecommendedEmployees();
    }
    
    // Clear search when switching modes
    setSearchQuery('');
  };
  
  const renderEmployeeCard = ({ item }: { item: EmployeeWithRecommendation }) => {
    // Calculate color for match score badge based on score value
    const getMatchScoreColor = (score?: number) => {
      if (!score) return { bg: '#e0e0e0', text: '#757575' };
      if (score >= 0.8) return { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' }; // High match - green
      if (score >= 0.6) return { bg: '#fff8e1', text: '#ff8f00', border: '#ffd54f' }; // Medium match - amber
      return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' }; // Low match - red
    };
    
    const matchColors = getMatchScoreColor(item.score);
    
    return (
      <Card style={styles.card} mode="outlined">
        <TouchableOpacity 
          style={styles.cardTouchable} 
          onPress={() => handleEmployeePress(item)}
          activeOpacity={0.7}
        >
          {/* Header Section with Avatar and Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={60}
                source={{ uri: item.profilePictureUrl || `https://i.pravatar.cc/150?u=${item.userId}` }}
                style={styles.avatar}
              />
              {item.availableNow && (
                <View style={styles.availableDot}>
                  <Ionicons name="ellipse" size={12} color="#4caf50" />
                </View>
              )}
            </View>
            
            <View style={styles.headerContent}>
              <Text style={styles.employeeName}>{`${item.firstName} ${item.lastName}`}</Text>
              <Text style={styles.jobTitle}>{item.jobTitle || 'Professional'}</Text>
              
              {/* Match Score Badge */}
              {item.score ? (
                <View style={[styles.matchScoreBadge, { backgroundColor: matchColors.bg, borderColor: matchColors.border }]}>
                  <Ionicons name="star" size={14} color={matchColors.text} style={styles.matchIcon} />
                  <Text style={[styles.matchScoreText, { color: matchColors.text }]}>
                    {`${(item.score * 100).toFixed(0)}% Match`}
                  </Text>
                </View>
              ) : null}
            </View>
            
            {/* Availability Chip */}
            {item.availableNow && (
              <Chip 
                mode="outlined" 
                style={styles.availableChip}
                textStyle={styles.availableChipText}
              >
                Available Now
              </Chip>
            )}
          </View>
          
          <Divider style={styles.cardDivider} />
          
          {/* Employee Info Section */}
          <View style={styles.infoSection}>
            {item.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
            )}
            
            {item.yearsOfExperience !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {item.yearsOfExperience} {item.yearsOfExperience === 1 ? 'year' : 'years'} of experience
                </Text>
              </View>
            )}
          </View>
          
          {/* Skills Section */}
          {(item.matchingSkills && item.matchingSkills.length > 0) ? (
            <View style={styles.skillsContainer}>
              <Text style={styles.matchingSkillsTitle}>Matching Skills:</Text>
              <View style={styles.skillsRow}>
                {item.matchingSkills.slice(0, 3).map((skill, index) => (
                  <Chip 
                    key={index} 
                    style={styles.matchingSkillChip} 
                    textStyle={styles.skillText}
                    icon={() => <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />}
                  >
                    {skill}
                  </Chip>
                ))}
                {item.matchingSkills.length > 3 && (
                  <Chip style={styles.moreSkillsChip} textStyle={styles.moreSkillsText}>
                    +{item.matchingSkills.length - 3}
                  </Chip>
                )}
              </View>
            </View>
          ) : (
            item.certifications && item.certifications.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsTitle}>Skills:</Text>
                <View style={styles.skillsRow}>
                  {item.certifications.slice(0, 3).map((skill, index) => (
                    <Chip key={index} style={styles.skillChip} textStyle={styles.skillText}>
                      {skill}
                    </Chip>
                  ))}
                  {item.certifications.length > 3 && (
                    <Chip style={styles.moreSkillsChip} textStyle={styles.moreSkillsText}>
                      +{item.certifications.length - 3}
                    </Chip>
                  )}
                </View>
              </View>
            )
          )}
        </TouchableOpacity>
        
        {/* Action Buttons */}
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="outlined" 
            onPress={() => handleEmployeePress(item)}
            style={styles.viewProfileButton}
            icon="account"
          >
            View Profile
          </Button>
          <Button 
            mode="contained" 
            onPress={() => handleContactEmployee(item)}
            style={styles.contactButton}
            icon="message-text"
          >
            Contact
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, skills, location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={2}
          icon="magnify"
        />
        
        <SegmentedButtons
          value={searchMode}
          onValueChange={handleModeChange}
          style={styles.segmentedButtons}
          theme={{ roundness: 2 }}
          buttons={[
            {
              value: 'recommended',
              label: 'Recommended',
              icon: 'star',
              style: searchMode === 'recommended' ? styles.activeSegment : styles.inactiveSegment,
              labelStyle: searchMode === 'recommended' ? styles.activeSegmentText : styles.inactiveSegmentText,
            },
            {
              value: 'all',
              label: 'All Employees',
              icon: 'account-group',
              style: searchMode === 'all' ? styles.activeSegment : styles.inactiveSegment,
              labelStyle: searchMode === 'all' ? styles.activeSegmentText : styles.inactiveSegmentText,
            },
          ]}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={onRefresh} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployeeCard}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.emptyText}>
                {searchMode === 'recommended' 
                  ? 'No recommended employees found'
                  : 'No employees found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery 
                  ? 'Try adjusting your search filters'
                  : searchMode === 'recommended'
                    ? 'Try switching to "All Employees" view'
                    : 'Try refreshing or check back later'}
              </Text>
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
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  divider: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for content
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTouchable: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    borderRadius: 30,
  },
  availableDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  headerContent: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  jobTitle: {
    fontSize: 14,
    color: '#666',
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: '#81c784',
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  matchIcon: {
    marginRight: 4,
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  availableChip: {
    backgroundColor: '#e6f7e9',
    borderColor: '#4caf50',
    height: 32,
  },
  availableChipText: {
    color: '#4caf50',
    fontSize: 12,
  },
  cardDivider: {
    marginVertical: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
  },
  skillsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  skillsTitle: {
    fontSize: 14,
    marginBottom: 6,
    color: '#666',
  },
  matchingSkillsTitle: {
    fontSize: 14,
    marginBottom: 6,
    color: '#2E7D32', // Dark green for matching skills
    fontWeight: '500',
  },
  matchingSkillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E8F5E9', // Light green background
    borderColor: '#81C784',
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  skillText: {
    fontSize: 12,
  },
  moreSkillsChip: {
    marginLeft: 4,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#666',
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  viewProfileButton: {
    flex: 1,
    marginRight: 8,
  },
  contactButton: {
    flex: 1,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
  },
  activeSegment: {
    backgroundColor: '#4caf50',
  },
  inactiveSegment: {
    backgroundColor: '#f0f0f0',
  },
  activeSegmentText: {
    color: '#fff',
  },
  inactiveSegmentText: {
    color: '#666',
  },
});

export default SearchEmployeeScreen; 