import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Card, Button, useTheme, Chip, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { employeeService } from '../../services/api/employee';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';

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

// Employee interface
interface Employee {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  location?: string;
  skills?: string[];
  jobTitle?: string;
  experience?: string;
  availableNow?: boolean;
  profilePictureUrl?: string;
}

const SearchEmployeeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<HiringNavigationProp>();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would need to be implemented in the backend
      // For now, use the existing API to get all employees
      const response = await employeeService.getAllEmployees();
      
      if (Array.isArray(response)) {
        setEmployees(response);
        setFilteredEmployees(response);
      } else {
        setError('Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmployees();
  }, []);
  
  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, []);
  
  // Filter employees based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        employee => 
          employee.firstName.toLowerCase().includes(query) ||
          employee.lastName.toLowerCase().includes(query) ||
          (employee.location && employee.location.toLowerCase().includes(query)) ||
          (employee.skills && employee.skills.some(skill => skill.toLowerCase().includes(query))) ||
          (employee.jobTitle && employee.jobTitle.toLowerCase().includes(query))
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);
  
  const handleEmployeePress = (employee: Employee) => {
    navigation.navigate('ApplicantProfile', { userId: employee.userId });
  };
  
  const handleContactEmployee = (employee: Employee) => {
    // Navigate to chat screen with this employee
    navigation.navigate('Chat', {
      userId: employee.userId.toString(),
      userName: `${employee.firstName} ${employee.lastName}`,
      userImage: employee.profilePictureUrl || `https://i.pravatar.cc/150?u=${employee.userId}`,
      idType: 'employee'
    });
  };
  
  const renderEmployeeCard = ({ item }: { item: Employee }) => (
    <Card style={styles.card} mode="outlined">
      <TouchableOpacity onPress={() => handleEmployeePress(item)}>
        <Card.Title
          title={`${item.firstName} ${item.lastName}`}
          subtitle={item.jobTitle || 'Job Seeker'}
          left={(props) => (
            <Avatar.Image
              {...props}
              source={{ uri: item.profilePictureUrl || `https://i.pravatar.cc/150?u=${item.userId}` }}
            />
          )}
          right={item.availableNow ? (props) => (
            <Chip mode="outlined" style={styles.availableChip}>Available Now</Chip>
          ) : undefined}
        />
        <Card.Content>
          {item.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          )}
          
          {item.experience && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>{item.experience}</Text>
            </View>
          )}
          
          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} style={styles.skillChip} textStyle={styles.skillText}>
                  {skill}
                </Chip>
              ))}
              {item.skills.length > 3 && (
                <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
              )}
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
      <Card.Actions>
        <Button mode="text" onPress={() => handleEmployeePress(item)}>View Profile</Button>
        <Button mode="contained" onPress={() => handleContactEmployee(item)}>Contact</Button>
      </Card.Actions>
    </Card>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, skills, location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchEmployees} style={styles.retryButton}>
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.emptyText}>
                No employees found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Try adjusting your search filters
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
  },
  divider: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  skillText: {
    fontSize: 12,
  },
  moreSkills: {
    fontSize: 12,
    color: '#666',
  },
  availableChip: {
    backgroundColor: '#e6f7e9',
    borderColor: '#4caf50',
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
});

export default SearchEmployeeScreen; 