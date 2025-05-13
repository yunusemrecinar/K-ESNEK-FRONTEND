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
import { useUserData } from '../../hooks/useUserData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employeeService } from '../../services/api/employee';
import { employerService } from '../../services/api/employer';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MM/dd/yyyy');
  }
};

const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<number, string>>({});
  const navigation = useNavigation<NavigationProp>();
  const { accountType, user } = useAuth();
  const { employeeData, employerData } = useUserData();

  // Log user information for debugging
  useEffect(() => {
    console.log('Current user:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not logged in');
    console.log('Account type:', accountType);
    console.log('Employee data:', employeeData);
    console.log('Employer data:', employerData);
  }, [user, accountType, employeeData, employerData]);

  // Function to get proper display name for an employee
  const getEmployeeDisplayName = async (employeeId: number) => {
    try {
      // Try to get public profile data
      const profile = await employeeService.getPublicEmployeeProfile(employeeId);
      console.log("profileEmployee", profile, employeeId);
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Employee User';
    } catch (error) {
      console.error(`Error fetching employee data for ID ${employeeId}:`, error);
      return null;
    }
  };

  // Function to get proper display name for an employer
  const getEmployerDisplayName = async (employerId: number) => {
    try {
      // Try to get employer profile data
      const profile = await employerService.getEmployerProfile(employerId);
      console.log("profileEmployer", profile, employerId);
      return profile.name || profile.email || 'Employer User';
    } catch (error) {
      console.error(`Error fetching employer data for ID ${employerId}:`, error);
      return null;
    }
  };

  // Fetch display names for users
  const fetchDisplayNames = async (conversationList: ConversationSummary[]) => {
    const names: Record<number, string> = {};
    
    // Process each conversation to get proper names
    for (const conversation of conversationList) {
      // Determine if the other user is an employee or employer based on the current user type
      const isOtherUserEmployee = accountType === 'employer';
      
      try {
        if (isOtherUserEmployee) {
          // If the current user is an employer, the other user is an employee
          const name = await getEmployeeDisplayName(conversation.otherUserId);
          if (name) names[conversation.otherUserId] = name;
        } else {
          // If the current user is an employee, the other user is an employer
          const name = await getEmployerDisplayName(conversation.otherUserId);
          if (name) names[conversation.otherUserId] = name;
        }
      } catch (err) {
        console.error('Error fetching display name:', err);
      }
    }
    
    setDisplayNames(names);
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      console.log('=============== MESSAGES SCREEN DEBUG ===============');
      console.log(`Fetching conversations as ${accountType} account`);
      
      // Determine the correct user ID based on account type
      let userId = null;
      
      if (accountType === 'employee' && employeeData) {
        userId = employeeData.id;
        console.log(`Using employee ID: ${userId} (employeeData.id)`);
        console.log('EMPLOYEE DATA:', JSON.stringify(employeeData, null, 2));
      } else if (accountType === 'employer' && employerData) {
        userId = employerData.id;
        console.log(`Using employer ID: ${userId} (employerData.id)`);
        console.log('EMPLOYER DATA:', JSON.stringify(employerData, null, 2));
      } else if (user) {
        userId = parseInt(user.id);
        console.log(`Using fallback user ID: ${userId} (user.id)`);
        console.log('USER DATA:', JSON.stringify(user, null, 2));
      }
      
      if (!userId) {
        console.error('No valid user ID found for fetching conversations');
        setIsLoading(false);
        return;
      }
      
      console.log('Before API call - userId that will be used:', userId);
      
      // Use the messaging service to get conversations
      const response = await messagingService.getAllUserMessages();
      console.log("Full API response:", JSON.stringify(response, null, 2));
      console.log(`Fetched ${response.conversations?.length || 0} conversations`);
      
      // Log all fetched conversations for debugging
      response.conversations?.forEach((conv, index) => {
        console.log(`Conversation ${index}: ID=${conv.conversationId}, otherUser=${conv.otherUserName} (${conv.otherUserId})`);
      });
      
      // Filter out conversations where the current user is both sender and receiver
      let filteredResponse = response.conversations || [];
      
      if (userId) {
        console.log(`Filtering with current user ID: ${userId}`);
        
        // Filter out conversations where otherUserId matches the current user's ID
        filteredResponse = filteredResponse.filter(conversation => {
          const isCurrentUser = conversation.otherUserId === userId;
          if (isCurrentUser) {
            console.log(`Filtered out conversation with self (ID: ${userId})`);
          }
          return !isCurrentUser;
        });
      }
      
      console.log(`Conversations after filtering: ${filteredResponse.length}`);
      if (filteredResponse.length > 0) {
        console.log('First filtered conversation:', JSON.stringify(filteredResponse[0], null, 2));
      } else {
        console.log('No conversations after filtering');
      }
      console.log('=============== END MESSAGES SCREEN DEBUG ===============');
      
      setConversations(filteredResponse);
      setFilteredConversations(filteredResponse);
      
      // Fetch proper names for the other users
      fetchDisplayNames(filteredResponse);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.log('=============== END MESSAGES SCREEN DEBUG WITH ERROR ===============');
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
        (displayNames[conversation.otherUserId] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations, displayNames]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: ConversationSummary }) => {
    // Create a consistent avatar URL
    console.log("item", item);
    const avatarUrl = `https://i.pravatar.cc/150?u=${item.otherUserId}`;
  
    console.log(`Rendering conversation with ${item.otherUserName} (ID: ${item.otherUserId})`);
    
    // Parse the conversation ID to get the correct IDs
    const [id1, id2] = item.conversationId.split('-').map(Number);
    
    // Determine if the current user is an employer or employee
    const isEmployer = accountType === 'employer';
    
    // Create a navigation parameter object with the correct context
    const chatParams = {
      userId: item.otherUserId.toString(),
      userName: displayNames[item.otherUserId] || item.otherUserName,
      userImage: avatarUrl,
      idType: isEmployer ? 'employee' as const : 'employer' as const
    };
    
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => {
          console.log(`Navigating to chat with user ${item.otherUserName} (ID: ${item.otherUserId})`);
          navigation.navigate('Chat', chatParams);
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
              {displayNames[item.otherUserId] || item.otherUserName}
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
              : accountType === 'employer'
                ? "No conversations yet. Connect with potential employees!"
                : "No conversations yet. Connect with potential employers!"}
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