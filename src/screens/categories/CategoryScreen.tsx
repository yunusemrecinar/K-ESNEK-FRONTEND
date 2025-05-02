import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text, Searchbar, Card, IconButton, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { apiClient } from '../../services/api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// Define the Job interface based on backend data
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
  applications?: Array<{id: number}>;
}

type CategoryScreenProps = NativeStackScreenProps<MainStackParamList, 'Category'>;
type CategoryNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const JobCard: React.FC<{
  job: Job;
  isPopular?: boolean;
}> = ({ job, isPopular }) => {
  const navigation = useNavigation<CategoryNavigationProp>();
  const cardStyle = isPopular ? styles.popularCard : styles.regularCard;

  return (
    <Card style={[styles.card, cardStyle]} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge">{job.title}</Text>
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
        
        <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
          {job.description}
        </Text>
        
        <View style={styles.jobDetails}>
          {job.city && (
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {job.city}
              </Text>
            </View>
          )}
          
          {job.employmentType && (
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {job.employmentType}
              </Text>
            </View>
          )}
          
          {job.applicationDeadline && (
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.salary}>
          <Text variant="titleMedium" style={styles.price}>
            {job.currency || '$'}{job.minSalary} - {job.currency || '$'}{job.maxSalary}
          </Text>
          {job.employmentType?.toLowerCase().includes('hourly') && (
            <Text variant="bodySmall" style={styles.hourly}>/hour</Text>
          )}
        </View>
        
        <Button 
          mode="contained" 
          style={styles.applyButton}
          onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
        >
          View Details
        </Button>
      </Card.Content>
    </Card>
  );
};

const CategoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CategoryScreenProps['route']>();
  const { categoryId, title } = route.params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [popularJobs, setPopularJobs] = useState<Job[]>([]);

  const fetchJobsByCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get jobs by category ID
      const response = await apiClient.instance.get(`/jobs?categoryId=${categoryId}`);
      
      let fetchedJobs: Job[] = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        fetchedJobs = response.data;
      } else if (response.data.success && response.data.data) {
        fetchedJobs = response.data.data;
      } else {
        setError('Failed to fetch jobs for this category');
        return;
      }
      
      setJobs(fetchedJobs);
      setFilteredJobs(fetchedJobs);
      
      // Determine popular jobs (can be based on various criteria like newest, most applications, etc.)
      // For now, just take the first 3 active jobs
      const activeJobs = fetchedJobs.filter(job => 
        job.jobStatus?.toLowerCase() === 'active'
      );
      setPopularJobs(activeJobs.slice(0, 3));
      
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredJobs(jobs);
      return;
    }
    
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase()) ||
      job.city?.toLowerCase().includes(query.toLowerCase()) ||
      job.employmentType?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredJobs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobsByCategory();
  };

  useEffect(() => {
    fetchJobsByCategory();
  }, [categoryId]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {title}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      <Searchbar
        placeholder={`Search ${title.toLowerCase()} jobs...`}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchJobsByCategory} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={() => (
            <>
              {popularJobs.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>
                    Popular {title} Jobs
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularScrollContent}
                  >
                    {popularJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isPopular
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text variant="titleLarge" style={styles.sectionTitle}>
                All {title} Jobs
              </Text>
              
              {filteredJobs.length === 0 && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="file-search-outline" size={48} color="#6C63FF" />
                  <Text style={styles.emptyText}>No jobs found for this category</Text>
                </View>
              )}
            </>
          )}
          renderItem={({ item }) => <JobCard job={item} />}
          contentContainerStyle={styles.listContent}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  searchInput: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Add extra padding at the bottom
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  popularScrollContent: {
    paddingRight: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  popularCard: {
    width: width * 0.85,
    marginRight: 16,
  },
  regularCard: {
    width: CARD_WIDTH,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginVertical: 8,
  },
  jobDetails: {
    marginVertical: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 6,
    color: '#666',
  },
  salary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  price: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  hourly: {
    color: '#666',
    marginLeft: 4,
  },
  applyButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  retryButton: {
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CategoryScreen; 