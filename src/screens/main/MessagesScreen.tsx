import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Searchbar, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { ConversationSummary, messagingService } from '../../services/api/messagingService';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'p'); // Shows time like "3:43 PM"
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d'); // Shows date like "Apr 3"
  }
};

const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { accountType, user } = useAuth();

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching conversations as ${accountType} account`);
      
      let response;
      
      // Use different service methods based on account type
      if (accountType === 'employer') {
        // For employers, we need to get all messages across conversations
        console.log('Using employer message fetch method');
        response = await messagingService.getAllEmployerMessages();
      } else {
        // For employees, use the existing conversations endpoint
        console.log('Using employee conversation fetch method');
        response = await messagingService.getConversations();
      }
      
      console.log(`Fetched ${response.conversations?.length || 0} conversations`);
      
      setConversations(response.conversations || []);
      setFilteredConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => 
        conversation.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: ConversationSummary }) => {
    // Create a consistent avatar URL
    const avatarUrl = `https://i.pravatar.cc/150?u=${item.otherUserId}`;
  
    console.log(`Rendering conversation with ${item.otherUserName} (ID: ${item.otherUserId})`);
  
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => {
          console.log(`Navigating to chat with user ${item.otherUserName} (ID: ${item.otherUserId})`);
          navigation.navigate('Chat', { 
            userId: item.otherUserId.toString(),
            userName: item.otherUserName,
            userImage: avatarUrl
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image 
            size={60} 
            source={{ uri: avatarUrl }} 
          />
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text variant="titleMedium" style={styles.userName}>
              {item.otherUserName}
            </Text>
            <Text variant="bodySmall" style={styles.timestamp}>
              {formatMessageDate(item.lastMessageDate)}
            </Text>
          </View>
          
          <View style={styles.messageFooter}>
            <Text
              variant="bodyMedium"
              style={styles.lastMessage}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.lastMessageContent}
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
  };

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

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-outline" size={64} color="#6C63FF" />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== '' 
              ? "No conversations match your search"
              : "No conversations yet. Start chatting with employers!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default MessagesScreen; 