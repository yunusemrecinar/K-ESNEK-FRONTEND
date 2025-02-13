import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

type CategoryCardProps = {
  title: string;
  services: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  onPress: () => void;
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

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigation = useNavigation();

  const popularCategories: Array<{
    id: string;
    title: string;
    services: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    backgroundColor: string;
  }> = [
    {
      id: '1',
      title: 'Pet sitter',
      services: 32,
      icon: 'dog',
      backgroundColor: '#FFE8E8', // Light red
    },
    {
      id: '2',
      title: 'Photographer',
      services: 28,
      icon: 'camera',
      backgroundColor: '#E8F4FF', // Light blue
    },
    {
      id: '3',
      title: 'Designer',
      services: 45,
      icon: 'palette',
      backgroundColor: '#F0E8FF', // Light purple
    },
    {
      id: '4',
      title: 'Developer',
      services: 52,
      icon: 'laptop',
      backgroundColor: '#E8FFE8', // Light green
    },
    {
      id: '5',
      title: 'Writer',
      services: 38,
      icon: 'pencil',
      backgroundColor: '#FFF3E8', // Light orange
    },
    {
      id: '6',
      title: 'Translator',
      services: 24,
      icon: 'translate',
      backgroundColor: '#E8FFF4', // Light mint
    },
  ];

  const handleCategoryPress = (categoryId: string, title: string) => {
    navigation.navigate('Category', {
      categoryId,
      title,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <Searchbar
          placeholder="Find service..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon={() => <MaterialCommunityIcons name="magnify" size={24} color="#666" />}
          right={() => (
            <MaterialCommunityIcons name="tune-variant" size={24} color="#666" />
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
            <TouchableOpacity>
              <Text variant="bodyMedium" style={styles.seeAll}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {popularCategories.map((category) => (
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
});

export default HomeScreen; 