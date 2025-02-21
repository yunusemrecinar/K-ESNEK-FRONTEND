import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// You'll need to create these types based on your backend response
interface Job {
  id: string;
  title: string;
  description: string;
  applicantsCount: number;
  status: 'active' | 'closed';
  createdAt: string;
}

const HiringHomeScreen = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [jobs, setJobs] = React.useState<Job[]>([]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Fetch jobs data here
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const renderJobCard = ({ item }: { item: Job }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={item.title}
        subtitle={`Posted on ${new Date(item.createdAt).toLocaleDateString()}`}
        right={(props) => (
          <Text {...props} style={[styles.status, { color: item.status === 'active' ? theme.colors.primary : theme.colors.error }]}>
            {item.status.toUpperCase()}
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
            <Text style={styles.statText}>{item.applicantsCount} Applicants</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="text">View Details</Button>
        <Button mode="contained">View Applicants</Button>
      </Card.Actions>
    </Card>
  );

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

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.emptyText}>
              No job posts yet
            </Text>
            <Button mode="contained" style={styles.createButton}>
              Create Your First Job Post
            </Button>
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
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
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
});

export default HiringHomeScreen; 