import React from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { Text, Searchbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type Category = {
  id: string;
  title: string;
  services: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
};

const AllCategoriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = React.useState('');

  const allCategories: Category[] = [
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
    {
      id: '7',
      title: 'Cook',
      services: 30,
      icon: 'food-variant',
      backgroundColor: '#FFE8E8', // Light red
    },
    {
      id: '8',
      title: 'Cleaner',
      services: 40,
      icon: 'broom',
      backgroundColor: '#E8F4FF', // Light blue
    },
    {
      id: '9',
      title: 'Teacher',
      services: 35,
      icon: 'school',
      backgroundColor: '#F0E8FF', // Light purple
    },
    {
      id: '10',
      title: 'Driver',
      services: 28,
      icon: 'car',
      backgroundColor: '#E8FFE8', // Light green
    },
    {
      id: '11',
      title: 'Gardener',
      services: 22,
      icon: 'flower',
      backgroundColor: '#FFF3E8', // Light orange
    },
    {
      id: '12',
      title: 'Electrician',
      services: 32,
      icon: 'flash',
      backgroundColor: '#E8FFF4', // Light mint
    },
  ];

  const handleCategoryPress = (categoryId: string, title: string) => {
    navigation.navigate('Category', {
      categoryId,
      title,
    });
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
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

  const filteredCategories = allCategories.filter(category => 
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

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
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
});

export default AllCategoriesScreen; 