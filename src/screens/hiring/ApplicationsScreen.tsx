import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Searchbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Application {
  id: string;
  jobTitle: string;
  applicantName: string;
  applicantPhoto: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  appliedDate: string;
  experience: string;
  skills: string[];
}

const ApplicationsScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Application['status'] | 'all'>('all');

  const filters: Array<{ label: string; value: Application['status'] | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return theme.colors.primary;
      case 'shortlisted':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const renderApplicationCard = ({ item }: { item: Application }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={item.jobTitle}
        subtitle={`Applied on ${new Date(item.appliedDate).toLocaleDateString()}`}
        left={(props) => (
          <Avatar.Image
            {...props}
            source={{ uri: item.applicantPhoto }}
            size={40}
          />
        )}
      />
      <Card.Content>
        <View style={styles.applicantInfo}>
          <Text variant="titleMedium">{item.applicantName}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: '#fff' }}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Chip>
        </View>
        <Text style={styles.experience}>{item.experience} years experience</Text>
        <View style={styles.skillsContainer}>
          {item.skills.map((skill) => (
            <Chip key={skill} style={styles.skillChip}>
              {skill}
            </Chip>
          ))}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="text">View Profile</Button>
        <Button mode="contained">Review Application</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Applications
        </Text>
        <Searchbar
          placeholder="Search applications"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              selected={selectedFilter === filter.value}
              onPress={() => setSelectedFilter(filter.value)}
              style={styles.filterChip}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium">No applications found</Text>
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
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filtersContainer: {
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
  applicantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 4,
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
});

export default ApplicationsScreen; 