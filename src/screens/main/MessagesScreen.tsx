import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Text, Searchbar, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();

  const messages: Message[] = [
    {
      id: '1',
      user: {
        id: 'u1',
        name: 'Sarah Johnson',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isOnline: true,
      },
      lastMessage: 'I can help you with your project. When would you like to start?',
      timestamp: '2 min ago',
      unreadCount: 2,
    },
    {
      id: '2',
      user: {
        id: 'u2',
        name: 'Michael Chen',
        avatar: 'https://i.pravatar.cc/150?img=2',
        isOnline: false,
      },
      lastMessage: 'The design looks great! I\'ll review it in detail.',
      timestamp: '1 hour ago',
      unreadCount: 0,
    },
    {
      id: '3',
      user: {
        id: 'u3',
        name: 'Emma Wilson',
        avatar: 'https://i.pravatar.cc/150?img=3',
        isOnline: true,
      },
      lastMessage: 'Perfect! Looking forward to our collaboration.',
      timestamp: '3 hours ago',
      unreadCount: 1,
    },
  ];

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', { 
        userId: item.user.id,
        userName: item.user.name,
        userImage: item.user.avatar
      })}
    >
      <View style={styles.avatarContainer}>
        <Avatar.Image size={60} source={{ uri: item.user.avatar }} />
        {item.user.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text variant="titleMedium" style={styles.userName}>
            {item.user.name}
          </Text>
          <Text variant="bodySmall" style={styles.timestamp}>
            {item.timestamp}
          </Text>
        </View>
        
        <View style={styles.messageFooter}>
          <Text
            variant="bodyMedium"
            style={styles.lastMessage}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Messages
        </Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <Searchbar
        placeholder="Search messages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        icon={() => <MaterialCommunityIcons name="magnify" size={24} color="#666" />}
      />

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '600',
    color: '#6C63FF',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    padding: 16,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MessagesScreen; 