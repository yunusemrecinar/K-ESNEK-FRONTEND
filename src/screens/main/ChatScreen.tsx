import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Chat: { userId: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  status: 'sent' | 'delivered' | 'read';
}

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

const ChatScreen = () => {
  const [inputMessage, setInputMessage] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const flatListRef = useRef<FlatList>(null);

  // Mock current user ID
  const currentUserId = 'current_user';

  // Mock user data (in a real app, this would come from a backend)
  const chatUser: User = {
    id: route.params.userId,
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOnline: true,
  };

  // Mock messages (in a real app, this would come from a backend)
  const messages: Message[] = [
    {
      id: '1',
      text: 'Hi! I saw your profile and I think you would be perfect for my project.',
      timestamp: '10:00 AM',
      senderId: route.params.userId,
      status: 'read',
    },
    {
      id: '2',
      text: 'Thanks! I\'d love to hear more about it.',
      timestamp: '10:02 AM',
      senderId: currentUserId,
      status: 'read',
    },
    {
      id: '3',
      text: 'I need help designing a mobile app for my startup. Are you available for a 3-month contract?',
      timestamp: '10:03 AM',
      senderId: route.params.userId,
      status: 'read',
    },
    {
      id: '4',
      text: 'Yes, that sounds interesting! When would you like to start?',
      timestamp: '10:05 AM',
      senderId: currentUserId,
      status: 'delivered',
    },
  ];

  const handleSend = () => {
    if (inputMessage.trim().length === 0) return;
    
    // In a real app, this would send the message to a backend
    console.log('Sending message:', inputMessage);
    setInputMessage('');
    Keyboard.dismiss();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUserId;

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            {isCurrentUser && (
              <MaterialCommunityIcons
                name={item.status === 'read' ? 'check-all' : 'check'}
                size={16}
                color={item.status === 'read' ? '#6C63FF' : '#666'}
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
          <Avatar.Image size={40} source={{ uri: chatUser.avatar }} />
          <View style={styles.userTextInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {chatUser.name}
            </Text>
            <Text variant="bodySmall" style={styles.userStatus}>
              {chatUser.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialCommunityIcons name="paperclip" size={24} color="#666" />
          </TouchableOpacity>
          
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
            style={[styles.sendButton, inputMessage.trim().length === 0 && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={inputMessage.trim().length === 0}
          >
            <MaterialCommunityIcons
              name="send"
              size={24}
              color={inputMessage.trim().length === 0 ? '#666' : '#6C63FF'}
            />
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
  userStatus: {
    color: '#666',
  },
  moreButton: {
    marginLeft: 12,
  },
  messagesList: {
    padding: 16,
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
    borderTopRightRadius: 4,
  },
  currentUserBubble: {
    backgroundColor: '#6C63FF',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F8F9FF',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
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
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    padding: 8,
    backgroundColor: '#F8F9FF',
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen; 