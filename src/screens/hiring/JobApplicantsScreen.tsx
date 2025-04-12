import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button, useTheme, Chip, Avatar, Searchbar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/client';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define types
type JobApplicantsRouteProp = RouteProp<{
  JobApplicants: { jobId: number };
}, 'JobApplicants'>;

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
}

interface Job {
  id: number;
  title: string;
  applications?: JobApplication[];
}

const JobApplicantsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<JobApplicantsRouteProp>();
  const { jobId } = route.params;
  
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusOptions = ['All', 'Pending', 'Reviewing', 'Interviewed', 'Accepted', 'Rejected'];

  const fetchJobApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch job details with applications
      const response = await apiClient.instance.get(`/jobs/${jobId}`);
      
      if (response.data && response.data.success) {
        setJob(response.data.data);
        if (response.data.data.applications) {
          setApplications(response.data.data.applications);
        }
      } else if (response.data) {
        setJob(response.data);
        if (response.data.applications) {
          setApplications(response.data.applications);
        }
      } else {
        setError('Failed to fetch job applicants');
      }
    } catch (err) {
      console.error('Error fetching job applicants:', err);
      setError('Failed to load applicants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const renderApplicantCard = ({ item }: { item: JobApplication }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.applicantHeader}>
          <View style={styles.applicantInfo}>
            {item.user?.profilePicture ? (
              <Avatar.Image 
                size={50} 
                source={{ uri: item.user.profilePicture }} 
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={50}
                label={getInitials(item.user?.firstName, item.user?.lastName)}
                style={styles.avatar}
              />
            )}
            <View>
              <Text variant="titleMedium" style={styles.applicantName}>
                {item.user?.firstName} {item.user?.lastName}
              </Text>
              <Text style={styles.applicantEmail}>{item.user?.email}</Text>
              <Text style={styles.date}>Applied on {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.applicationStatus) }]}
            textStyle={{ color: '#fff' }}
          >
            {item.applicationStatus || 'Pending'}
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
            onPress={() => {
              // Navigate to applicant profile or resume
              // navigation.navigate('ApplicantProfile', { applicationId: item.id });
            }}
          >
            View Profile
          </Button>
          <Button 
            mode="contained" 
            style={styles.button}
            onPress={() => {
              // Navigate to detailed application screen
              // navigation.navigate('ApplicationDetails', { applicationId: item.id });
            }}
          >
            View Application
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
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
          <Text variant="headlineMedium" style={styles.title}>
            Applicants
          </Text>
        </View>
        
        {job && (
          <Text variant="titleLarge" style={styles.jobTitle}>
            {job.title}
          </Text>
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
      </View>

      <Divider />

      <FlatList
        data={filteredApplications}
        renderItem={renderApplicantCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.emptyText}>
              No applicants found
            </Text>
            {error ? (
              <Button mode="contained" onPress={fetchJobApplicants} style={styles.retryButton}>
                Retry
              </Button>
            ) : searchQuery || statusFilter ? (
              <Text>Try adjusting your filters</Text>
            ) : (
              <Text>When candidates apply, they'll appear here</Text>
            )}
          </View>
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
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginLeft: -8,
  },
  title: {
    fontWeight: 'bold',
    marginLeft: 16,
  },
  jobTitle: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  chipsList: {
    marginBottom: 8,
  },
  chipsContainer: {
    paddingVertical: 4,
    gap: 8,
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
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  applicantName: {
    fontWeight: 'bold',
  },
  applicantEmail: {
    opacity: 0.7,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  statusChip: {
    borderRadius: 4,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
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
  },
  retryButton: {
    marginTop: 16,
  },
});

export default JobApplicantsScreen; 