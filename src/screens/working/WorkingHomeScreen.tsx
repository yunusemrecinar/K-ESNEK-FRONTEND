import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { JobCategory, categoriesApi } from '../../services/api/jobs';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

type WorkingNavigationProp = NativeStackNavigationProp<MainStackParamList>;

type CategoryCardProps = {
  title: string;
  services: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  onPress: () => void;
};

// UI representation of a category
type UICategory = {
  id: string;
  title: string;
  services: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
};

const CategoryCard = ({ title, services, icon, backgroundColor, onPress }: CategoryCardProps) => (
  <TouchableOpacity style={[styles.card, { backgroundColor }]} onPress={onPress}>
    <View style={styles.iconContainer}>
      <View style={[styles.cardImageContainer, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
        <MaterialCommunityIcons name={icon} size={40} color="#6C63FF" />
      </View>
    </View>
    <View style={styles.cardContent}>
      <View style={styles.cardContentInner}>
        <Text variant="titleMedium" style={styles.cardTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.cardServices}>
          {services} Services
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Icon and background color mapping based on category index
const getIconForCategory = (index: number): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
    'dog', 'camera', 'palette', 'laptop', 'pencil', 'translate',
    'food-variant', 'broom', 'school', 'car', 'flower', 'flash'
  ];
  return icons[index % icons.length];
};

const getBackgroundColorForCategory = (index: number): string => {
  const colors = [
    '#FFE8E8', // Light red
    '#E8F4FF', // Light blue
    '#F0E8FF', // Light purple
    '#E8FFE8', // Light green
    '#FFF3E8', // Light orange
    '#E8FFF4', // Light mint
  ];
  return colors[index % colors.length];
};

const WorkingHomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<WorkingNavigationProp>();

  // Fetch categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await categoriesApi.getAllCategories();
          
          if (response.isSuccess && response.data) {
            // Transform backend categories to UI categories and take only the first 6
            const uiCategories = response.data
              .slice(0, 6) // Only show first 6 categories as popular
              .map((category, index) => ({
                id: category.id.toString(),
                title: category.name,
                services: Math.floor(Math.random() * 50) + 10, // Placeholder for services count
                icon: getIconForCategory(index),
                backgroundColor: getBackgroundColorForCategory(index),
              }));
            setCategories(uiCategories);
          } else {
            setError(response.message || 'Failed to fetch categories');
          }
        } catch (err) {
          setError('An error occurred while fetching categories');
          console.error('Error fetching categories:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchCategories();
    }, [])
  );

  const handleCategoryPress = (categoryId: string, title: string) => {
    navigation.navigate('Category', {
      categoryId,
      title,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Applications button */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Find Jobs
          </Text>
          <TouchableOpacity 
            style={styles.applicationsButton}
            onPress={() => navigation.navigate('Applications')}
          >
            <MaterialCommunityIcons name="briefcase-outline" size={24} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Find service..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon={() => <MaterialCommunityIcons name="magnify" size={24} color="#666" />}
          right={() => (
            <MaterialCommunityIcons name="tune-variant" size={24} color="#666" style={styles.filterIcon} />
          )}
        />

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <View style={styles.featuredCard}>
            <MaterialCommunityIcons name="star" size={40} color="#FFC107" />
            <Text variant="titleLarge" style={styles.featuredTitle}>
              Find Top Rated Freelancers
            </Text>
            <Text variant="bodyMedium" style={styles.featuredDescription}>
              Browse through thousands of skilled professionals
            </Text>
          </View>
        </View>

        {/* Popular Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Popular categories
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
              <Text variant="bodyMedium" style={styles.seeAll}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  title={category.title}
                  services={category.services}
                  icon={category.icon}
                  backgroundColor={category.backgroundColor}
                  onPress={() => handleCategoryPress(category.id, category.title)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 20,
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  searchInput: {
    fontSize: 16,
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredCard: {
    backgroundColor: '#F8F9FF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  featuredTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredDescription: {
    color: '#666',
    textAlign: 'center',
  },
  categoriesSection: {
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#6C63FF',
  },
  seeAll: {
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardContentInner: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  cardServices: {
    color: '#666',
  },
  filterIcon: {
    marginRight: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#6C63FF',
  },
  applicationsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
});

export default WorkingHomeScreen; 