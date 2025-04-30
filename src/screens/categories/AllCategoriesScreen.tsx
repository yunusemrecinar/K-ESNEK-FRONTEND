import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Text, Searchbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { JobCategory, categoriesApi } from '../../services/api/jobs';
import { useFocusEffect } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Map backend category to UI category with additional fields
type UICategory = {
  id: string;
  title: string;
  services: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
};

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

const AllCategoriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await categoriesApi.getAllCategories();
          
          if (response.isSuccess && response.data) {
            // Transform backend categories to UI categories
            const uiCategories = response.data.map((category, index) => ({
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

  const renderCategoryCard = ({ item }: { item: UICategory }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: item.backgroundColor }]}
      onPress={() => handleCategoryPress(item.id, item.title)}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.cardImageContainer, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
          <MaterialCommunityIcons name={item.icon} size={40} color="#6C63FF" />
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardContentInner}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text variant="bodySmall" style={styles.cardServices}>
            {item.services} Services
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredCategories = categories.filter(category => 
    category.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.title}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <Searchbar
        placeholder="Search categories..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    color: '#6C63FF',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  searchInput: {
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
});

export default AllCategoriesScreen; 