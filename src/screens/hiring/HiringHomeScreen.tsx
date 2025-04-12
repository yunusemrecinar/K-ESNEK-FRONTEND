import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Card, Button, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/client';
import { useNavigation } from '@react-navigation/native';

// Job interface based on backend JobDto
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

// API response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

const HiringHomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.instance.get('/jobs');
      
      // The API returns an array directly instead of an ApiResponse object
      if (Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (response.data.success && response.data.data) {
        // Also handle if it's in the ApiResponse format
        setJobs(response.data.data);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = () => {
    // Navigate to job creation screen
    // navigation.navigate('CreateJob');
  };

  const handleViewJobDetails = (jobId: number) => {
    // navigation.navigate('JobDetails', { jobId });
  };

  const handleViewApplicants = (jobId: number) => {
    // navigation.navigate('JobApplicants', { jobId });
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={item.title}
        subtitle={`Posted on ${new Date(item.createdAt).toLocaleDateString()}`}
        right={(props) => (
          <Text {...props} style={[styles.status, { color: item.jobStatus?.toLowerCase() === 'active' ? theme.colors.primary : theme.colors.error }]}>
            {item.jobStatus?.toUpperCase() || 'DRAFT'}
          </Text>
        )}
      />
      <Card.Content>
        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.statText}>{item.applications?.length || 0} Applicants</Text>
          </View>
          {item.applicationDeadline && (
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.statText}>
                Deadline: {new Date(item.applicationDeadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="text" onPress={() => handleViewJobDetails(item.id)}>View Details</Button>
        <Button mode="contained" onPress={() => handleViewApplicants(item.id)}>View Applicants</Button>
      </Card.Actions>
    </Card>
  );

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
        <Text variant="headlineMedium" style={styles.title}>
          My Job Posts
        </Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchJobs} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.emptyText}>
                No job posts yet
              </Text>
              <Button mode="contained" style={styles.createButton} onPress={handleCreateJob}>
                Create Your First Job Post
              </Button>
            </View>
          ) : null
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    marginLeft: 4,
  },
  status: {
    fontWeight: 'bold',
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    marginTop: 8,
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
  },
});

export default HiringHomeScreen; 