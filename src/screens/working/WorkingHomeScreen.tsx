import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { JobCategory, categoriesApi } from '../../services/api/jobs';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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
  <TouchableOpacity 
    style={[styles.card, { backgroundColor }]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>
      <View style={[styles.cardImageContainer, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
        <MaterialCommunityIcons name={icon} size={36} color="#6C63FF" />
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
    '#F5F0FF', // Light purple
    '#E8F6FF', // Light blue
    '#FFF0E8', // Light orange
    '#F0FFF0', // Light green
    '#FFF0F5', // Light pink
    '#F0FFFF', // Light cyan
  ];
  return colors[index % colors.length];
};

const WorkingHomeScreen = () => {
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Applications button */}
        <View style={styles.header}>
          <View style={{flex: 1}} />
          <TouchableOpacity 
            style={styles.applicationsButton}
            onPress={() => navigation.navigate('Applications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="briefcase-outline" size={24} color="#5D56E0" />
          </TouchableOpacity>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <LinearGradient
            colors={['#6C63FF', '#5D56E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.featuredCard}
          >
            <View style={styles.featuredIconContainer}>
              <MaterialCommunityIcons name="star" size={40} color="#FFC107" />
            </View>
            <Text variant="titleLarge" style={styles.featuredTitle}>
              Find Top Rated Freelancers
            </Text>
            <Text variant="bodyMedium" style={styles.featuredDescription}>
              Browse through thousands of skilled professionals
            </Text>
          </LinearGradient>
        </View>

        {/* Popular Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Popular categories
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AllCategories')}
              activeOpacity={0.7}
            >
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
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF6B6B" style={{ marginBottom: 8 }} />
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
    padding: 20,
    paddingBottom: 40,
  },
  featuredSection: {
    marginBottom: 32,
  },
  featuredCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  featuredIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredTitle: {
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    fontSize: 22,
  },
  featuredDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 16,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#5D56E0',
    fontSize: 20,
  },
  seeAll: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 20,
    borderRadius: 16,
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
    minHeight: 140,
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  cardContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardContentInner: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
    fontSize: 16,
  },
  cardServices: {
    color: '#666',
    fontSize: 12,
  },
  filterIcon: {
    marginRight: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#5D56E0',
  },
  applicationsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default WorkingHomeScreen; 