import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Message, messagingService } from '../../services/api/messagingService';
import { apiClient } from '../../services/api/client';
import { format } from 'date-fns';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Chat'>;

const ChatScreen = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const flatListRef = useRef<FlatList>(null);

  const { userId, userName, userImage } = route.params;
  
  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      // Check if userId is valid
      if (!userId || isNaN(Number(userId))) {
        console.error('Invalid user ID:', userId);
        setMessages([]);
        return;
      }
      
      const response = await messagingService.getConversation(Number(userId));
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show an error for non-existent conversations, just set empty messages
      setMessages([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      // Check auth token
      const token = await apiClient.getStoredToken();
      setDebugInfo(prev => prev + `\nAuth token: ${token ? 'Available' : 'NOT FOUND'}`);
      
      const result = await messagingService.testConnection();
      setDebugInfo(prev => prev + `\nAPI test: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      setDebugInfo(prev => prev + `\nAPI test error: ${error}`);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    // Get API base URL for debugging
    setApiBaseUrl(apiClient.instance.defaults.baseURL || 'Not set');
    
    // Test API connection
    testApiConnection();
    
    fetchMessages();
    
    // Refresh messages every 10 seconds
    const interval = setInterval(() => {
      if (!isSending) {
        fetchMessages();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchMessages, isSending, testApiConnection]);
  
  // Handle sending a message
  const handleSend = async () => {
    if (inputMessage.trim().length === 0) return;
    
    try {
      setIsSending(true);
      
      // Create message payload
      const messageRequest = {
        receiverId: Number(userId),
        content: inputMessage.trim()
      };
      
      // Add the message locally first for immediate feedback
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID that will be overwritten
        content: inputMessage.trim(),
        senderId: -1, // Will be set by backend
        senderName: 'You', // Placeholder
        receiverId: Number(userId),
        receiverName: userName,
        conversationId: '', // Will be set by backend
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      // Update UI immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Clear input and dismiss keyboard
      setInputMessage('');
      Keyboard.dismiss();
      
      // Send message to API
      await messagingService.sendMessage(messageRequest);
      
      // Refresh messages to get the actual message from the server
      await fetchMessages();
      
      // Scroll to bottom
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  // Format timestamp for display
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Render a message
  const renderMessage = ({ item }: { item: Message }) => {
    // Determine if current user is the sender
    const isCurrentUser = item.senderId.toString() !== userId;

    return (
      <View style={[
        styles.messageContainer, 
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble, 
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText, 
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>{formatMessageTime(item.createdAt)}</Text>
            {isCurrentUser && (
              <MaterialCommunityIcons
                name={item.isRead ? 'check-all' : 'check'}
                size={16}
                color={item.isRead ? '#6C63FF' : '#666'}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#6C63FF" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Avatar.Image size={40} source={{ uri: userImage }} />
          <View style={styles.userTextInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {userName}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
          
          {/* Debug info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>User ID: {userId}</Text>
            <Text style={styles.debugText}>API URL: {apiBaseUrl}</Text>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={64} color="#6C63FF" opacity={0.5} />
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          )}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton, 
              (inputMessage.trim().length === 0 || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={inputMessage.trim().length === 0 || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#6C63FF" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={24}
                color={inputMessage.trim().length === 0 ? '#666' : '#6C63FF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextInfo: {
    marginLeft: 12,
  },
  userName: {
    fontWeight: '600',
  },
  moreButton: {
    marginLeft: 12,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#6C63FF',
    borderTopRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 12,
    paddingTop: 12,
    maxHeight: 120,
    color: '#333',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
    padding: 40,
    height: 300,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '80%',
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
  },
});

export default ChatScreen; 