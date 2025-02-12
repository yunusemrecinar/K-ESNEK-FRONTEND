import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text, Searchbar, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface ServiceProvider {
  id: string;
  name: string;
  description: string;
  rating: number;
  price: number;
  image: string;
}

interface CategoryData {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  popularProviders: ServiceProvider[];
  allProviders: ServiceProvider[];
}

type CategoryScreenProps = NativeStackScreenProps<MainStackParamList, 'Category'>;

const ServiceProviderCard: React.FC<{
  provider: ServiceProvider;
  isPopular?: boolean;
}> = ({ provider, isPopular }) => {
  const cardStyle = isPopular ? styles.popularCard : styles.regularCard;

  return (
    <Card style={[styles.card, cardStyle]} mode="elevated">
      <Card.Cover source={{ uri: provider.image }} style={styles.cardImage} />
      <Card.Content style={styles.cardContent}>
        <Text variant="titleLarge">{provider.name}</Text>
        <Text variant="bodyMedium" style={styles.description}>
          {provider.description}
        </Text>
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
          <Text variant="bodyLarge" style={styles.rating}>
            {provider.rating.toFixed(1)}
          </Text>
        </View>
        <Text variant="titleMedium" style={styles.price}>
          ${provider.price}/hour
        </Text>
      </Card.Content>
    </Card>
  );
};

const CategoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CategoryScreenProps['route']>();
  const { categoryId, title } = route.params;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredProviders, setFilteredProviders] = React.useState<ServiceProvider[]>([]);

  // This would typically come from an API or context
  // For now, we'll use mock data
  const mockCategoryData: CategoryData = {
    id: categoryId,
    title: title,
    icon: 'account-group',
    popularProviders: [
      {
        id: '1',
        name: 'Professional Service Provider',
        description: 'Reliable service tailored to your needs. Your satisfaction is our priority!',
        rating: 4.9,
        price: 25,
        image: 'https://example.com/provider1.jpg',
      },
      // Add more popular providers here
    ],
    allProviders: [
      // This would include popular providers plus additional ones
    ],
  };

  React.useEffect(() => {
    // In a real app, you would fetch the category data here
    setFilteredProviders(mockCategoryData.allProviders);
  }, [categoryId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = mockCategoryData.allProviders.filter(
      provider =>
        provider.name.toLowerCase().includes(query.toLowerCase()) ||
        provider.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProviders(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      <Searchbar
        placeholder={`Search ${title.toLowerCase()}...`}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {mockCategoryData.popularProviders.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Popular {title}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularScrollContent}
                >
                  {mockCategoryData.popularProviders.map((provider) => (
                    <ServiceProviderCard
                      key={provider.id}
                      provider={provider}
                      isPopular
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            <Text variant="titleLarge" style={styles.sectionTitle}>
              All {title}
            </Text>
          </>
        )}
        renderItem={({ item }) => <ServiceProviderCard provider={item} />}
        contentContainerStyle={styles.listContent}
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
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  searchInput: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  popularScrollContent: {
    paddingRight: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  popularCard: {
    width: width * 0.8,
    marginRight: 16,
  },
  regularCard: {
    width: CARD_WIDTH,
  },
  cardImage: {
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  description: {
    color: '#666',
    marginVertical: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  rating: {
    marginLeft: 4,
    color: '#666',
  },
  price: {
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default CategoryScreen; 