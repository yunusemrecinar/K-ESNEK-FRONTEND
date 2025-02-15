import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const popularSearches = [
  'Web Developer',
  'Graphic Designer',
  'Content Writer',
  'Virtual Assistant',
  'Video Editor',
];

const recentSearches = [
  'Mobile App Developer',
  'UI/UX Designer',
  'Logo Designer',
  'Social Media Manager',
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const navigation = useNavigation();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search logic here
    // For now, we'll just filter popular searches as an example
    if (query.trim()) {
      const results = popularSearches.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const renderSearchSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSearchQuery(item);
        // TODO: Navigate to search results
      }}
    >
      <MaterialCommunityIcons name="magnify" size={20} color="#666" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search for services..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon={() => <MaterialCommunityIcons name="magnify" size={24} color="#666" />}
          right={() => (
            <MaterialCommunityIcons name="tune-variant" size={24} color="#666" style={styles.filterIcon} />
          )}
          autoFocus
        />
      </View>

      <ScrollView style={styles.content}>
        {searchQuery ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchSuggestion}
            keyExtractor={(item) => item}
            style={styles.searchResults}
          />
        ) : (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Recent Searches
                </Text>
                <TouchableOpacity>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsContainer}>
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    style={styles.chip}
                    onPress={() => handleSearch(search)}
                    icon={() => (
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                    )}
                  >
                    {search}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Popular Searches */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Popular Searches
              </Text>
              <View style={styles.chipsContainer}>
                {popularSearches.map((search, index) => (
                  <Chip
                    key={index}
                    style={styles.chip}
                    onPress={() => handleSearch(search)}
                    icon={() => (
                      <MaterialCommunityIcons name="trending-up" size={16} color="#666" />
                    )}
                  >
                    {search}
                  </Chip>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  searchInput: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#333',
  },
  clearText: {
    color: '#6C63FF',
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  searchResults: {
    padding: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterIcon: {
    marginRight: 16,
  },
});

export default SearchScreen; 