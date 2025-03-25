import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button, Searchbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Types for the application
interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedDate: Date;
  location: string;
  salary: string;
}

const ApplicationsScreen = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const theme = useTheme();

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      // TODO: Implement actual API call
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockApplications: Application[] = [
        {
          id: '1',
          jobTitle: 'Software Developer',
          companyName: 'Tech Corp',
          status: 'pending',
          appliedDate: new Date(),
          location: 'Istanbul, Turkey',
          salary: '$50,000 - $70,000'
        },
        // Add more mock data as needed
      ];
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
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
    const matchesFilter = selectedFilter === 'all' || app.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Status chip color mapping
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending': return theme.colors.primary;
      case 'accepted': return '#4CAF50';
      case 'rejected': return theme.colors.error;
      default: return theme.colors.primary;
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
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Chip>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.detailText}>
              Applied {format(item.appliedDate, 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.detailText}>{item.salary}</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="text" onPress={() => {}}>View Details</Button>
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
        <Text variant="headlineMedium" style={styles.title}>My Applications</Text>
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
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
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
});

export default ApplicationsScreen; 