import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text, Divider, Surface, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { SavedJob, savedJobsApi } from '../../services/api/savedJobs';

type SavedJobsNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const SavedJobsScreen = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const theme = useTheme();
  const navigation = useNavigation<SavedJobsNavigationProp>();

  const loadSavedJobs = useCallback(async () => {
    try {
      setLoading(true);
      const jobs = await savedJobsApi.getAllSavedJobs();
      setSavedJobs(jobs);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      showSnackbar('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncWithBackend = useCallback(async () => {
    try {
      setSyncing(true);
      console.log('Starting sync with backend');
      const success = await savedJobsApi.syncWithBackend();
      if (success) {
        console.log('Sync successful, fetching updated saved jobs');
        const jobs = await savedJobsApi.getAllSavedJobs();
        console.log(`Retrieved ${jobs.length} saved jobs`);
        setSavedJobs(jobs);
        showSnackbar('Synchronized saved jobs with the cloud');
      } else {
        console.log('Sync returned unsuccessful');
        showSnackbar('Failed to sync with the cloud');
      }
    } catch (error) {
      console.error('Error syncing saved jobs:', error);
      showSnackbar('Failed to sync with the cloud');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Load saved jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        console.log('SavedJobsScreen came into focus');
        await loadSavedJobs();
        // Sync with backend after loading local data
        syncWithBackend();
      };
      
      fetchData();
    }, [loadSavedJobs, syncWithBackend])
  );

  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncWithBackend(); // Sync with backend on manual refresh
    setRefreshing(false);
  }, [syncWithBackend]);

  // Handle job item press
  const handleJobPress = (jobId: number) => {
    navigation.navigate('JobDetails', { jobId });
  };

  // Handle unsave job
  const handleUnsaveJob = async (jobId: number) => {
    const success = await savedJobsApi.unsaveJob(jobId);
    if (success) {
      setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      showSnackbar('Job removed from saved jobs');
    } else {
      showSnackbar('Failed to remove job');
    }
  };

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderJobItem = ({ item }: { item: SavedJob }) => (
    <Surface style={styles.jobCard} elevation={1}>
      <TouchableOpacity 
        style={styles.jobCardContent}
        onPress={() => handleJobPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.jobHeader}>
          <Text variant="titleMedium" style={styles.jobTitle}>{item.title}</Text>
          <TouchableOpacity 
            onPress={() => handleUnsaveJob(item.id)}
            style={styles.unsaveButton}
          >
            <MaterialCommunityIcons 
              name="bookmark" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
        
        <Text variant="bodyMedium" style={styles.companyName}>
          {item.companyName || 'Company'}
        </Text>
        
        <View style={styles.jobDetailsRow}>
          {item.city && (
            <View style={styles.jobDetailItem}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text variant="bodySmall" style={styles.jobDetailText}>
                {item.city}{item.country ? `, ${item.country}` : ''}
              </Text>
            </View>
          )}
          
          {item.jobLocationType && (
            <View style={styles.jobDetailItem}>
              <MaterialCommunityIcons 
                name="office-building" 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text variant="bodySmall" style={styles.jobDetailText}>
                {item.jobLocationType}
              </Text>
            </View>
          )}
          
          {item.employmentType && (
            <View style={styles.jobDetailItem}>
              <MaterialCommunityIcons 
                name="briefcase-outline" 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text variant="bodySmall" style={styles.jobDetailText}>
                {item.employmentType}
              </Text>
            </View>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.jobFooter}>
          <Text variant="titleSmall" style={styles.salary}>
            {item.currency || '$'}{item.minSalary} - {item.currency || '$'}{item.maxSalary}
          </Text>
          <Text variant="bodySmall" style={styles.savedDate}>
            Saved {formatDate(item.savedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </Surface>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="bookmark-outline" 
        size={64} 
        color={theme.colors.primary} 
      />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No Saved Jobs
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        Bookmark jobs that interest you to view them later
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text variant="labelLarge" style={styles.browseButtonText}>
          Browse Jobs
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Saved Jobs
        </Text>
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={syncWithBackend}
          disabled={syncing}
        >
          <MaterialCommunityIcons 
            name="cloud-sync" 
            size={24} 
            color={syncing ? "#ccc" : "#5D56E0"} 
          />
          {syncing && (
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary}
              style={styles.syncingIndicator} 
            />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={savedJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => `saved-job-${item.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyListComponent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  syncingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  jobCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  jobCardContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  unsaveButton: {
    padding: 4,
  },
  companyName: {
    marginTop: 4,
    opacity: 0.7,
  },
  jobDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salary: {
    fontWeight: 'bold',
    color: '#5D56E0',
  },
  savedDate: {
    opacity: 0.6,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyDescription: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#5D56E0',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  snackbar: {
    marginBottom: 16,
  },
});

export default SavedJobsScreen; 