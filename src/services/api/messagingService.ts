import { apiClient } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from '../../hooks/useUserData';

// Message types matching the backend DTOs
export interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageListResponse {
  messages: Record<number, Message[]>;
  totalCount: number;
  hasMoreMessages: boolean;
}

export interface ApiConversationResponse {
  success: boolean;
  data: {
    messages: Record<string, Message[]>;
    totalCount: number;
    hasMoreMessages: boolean;
  };
  message: string | null;
  errorCode: string | null;
  errors: any | null;
}

export interface ConversationSummary {
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  lastMessageContent: string;
  lastMessageDate: string;
  unreadCount: number;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

export interface CreateMessageRequest {
  receiverId: number;
  content: string;
  senderId?: number; // Optional senderId to override the ID from the token
}

export interface MessagesByUser {
  [userId: string]: Message[];
}

export interface EmployerMessageListResponse {
  messages: Record<string, Message[]>;
  totalCount: number;
  hasMoreMessages: boolean;
}

class MessagingService {
  // Test connection to the API
  async testConnection(): Promise<boolean> {
    try {
      // Try to access a simple endpoint that doesn't require authentication
      const response = await apiClient.instance.get('/');
      console.log('API connection test success:', response.status);
      return true;
    } catch (error: any) {
      console.error('API connection test failed:', error.message);
      // Log the actual error response if available
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return false;
    }
  }

  // Send a message to another user
  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    try {
      console.log('Sending message to user:', request.receiverId);
      
      // If a senderId is provided, include it as a custom header
      const headers: Record<string, string> = {};
      if (request.senderId) {
        headers['X-Employee-Id'] = request.senderId.toString();
        console.log('Using custom sender ID:', request.senderId);
      }
      
      const response = await apiClient.instance.post('/messages', request, { headers });
      return response.data.data; // Access the data inside the ApiResponse wrapper
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle the case where the error has a response
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', JSON.stringify(error.response.data));
        
        // If the error has a specific message from the server, use it
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw error;
    }
  }

  // Get conversation messages with a specific user
  async getConversation(userId: number, senderId?: number): Promise<MessageListResponse> {
    try {
      console.log(`Attempting to get conversation with user ID: ${userId}`);
      console.log(`API Base URL: ${apiClient.instance.defaults.baseURL}`);
      
      // Construct the full URL for debugging
      const fullUrl = `${apiClient.instance.defaults.baseURL}/messages/conversation/${userId}`;
      console.log(`Full request URL: ${fullUrl}`);
      
      // Check if token is set
      const token = await apiClient.getStoredToken();
      console.log(`Auth token available: ${!!token}`);
      
      // If a senderId is provided, include it as a custom header
      const headers: Record<string, string> = {};
      if (senderId) {
        headers['X-Employee-Id'] = senderId.toString();
        console.log('Using custom sender ID for conversation:', senderId);
      }
      
      const response = await apiClient.instance.get<ApiConversationResponse>(
        `/messages/conversation/${userId}`,
        { headers }
      );
      
      console.log('API Response Status:', response.status);
      
      // Access the data inside the ApiResponse wrapper
      const responseData = response.data.data;
      
      // Convert string keys to number keys for compatibility with existing code
      const messagesWithNumberKeys: Record<number, Message[]> = {};
      
      // Process the messages by sender ID
      if (responseData && responseData.messages) {
        Object.entries(responseData.messages).forEach(([senderId, messages]) => {
          // Convert string sender ID to number
          messagesWithNumberKeys[parseInt(senderId)] = messages;
        });
      }
      
      return {
        messages: messagesWithNumberKeys,
        totalCount: responseData.totalCount,
        hasMoreMessages: responseData.hasMoreMessages
      };
    } catch (error: any) {
      console.error('Error getting conversation:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', JSON.stringify(error.response.data));
        console.error('Error Headers:', JSON.stringify(error.response.headers));
        
        // If it's a 404, we can assume this is a new conversation
        if (error.response.status === 404) {
          console.log('New conversation - no messages yet');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      console.error('Error Config:', JSON.stringify(error.config));
      
      // For any error including 404, 401, 500, etc., return empty messages
      // This ensures the UI always gets a valid response structure
      return {
        messages: {},
        totalCount: 0,
        hasMoreMessages: false
      };
    }
  }

  // Get all conversations for the current user
  async getConversations(): Promise<ConversationListResponse> {
    try {
      const response = await apiClient.instance.get('/messages/conversations');
      return response.data.data; // Access the data inside the ApiResponse wrapper
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      
      // If we have a response with error details
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
      
      // Return empty conversations array to prevent UI errors
      return {
        conversations: []
      };
    }
  }

  // Mark a message as read
  async markMessageAsRead(messageId: number): Promise<void> {
    try {
      await apiClient.instance.put(`/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await apiClient.instance.delete(`/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadMessageCount(): Promise<number> {
    try {
      const response = await apiClient.instance.get('/messages/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  }

  // Get all messages for the user (across all conversations) based on account type
  public async getAllUserMessages(): Promise<ConversationListResponse> {
    // Get user data
    const accountType = await AsyncStorage.getItem('accountType');
    
    // Add debug logging
    console.log('============= MESSAGING DEBUG =============');
    console.log(`Starting getAllUserMessages for account type: ${accountType}`);
    
    // Determine which ID to use based on account type
    let userId: number | undefined;
    
    console.log("accountType", accountType);
    if (accountType === 'employer') {
      // Get employer data
      const employerDataString = await AsyncStorage.getItem('employerData');
      if (employerDataString) {
        try {
          const employerData = JSON.parse(employerDataString);
          userId = employerData.id;
          console.log(`Using employer ID from employerData: ${userId}`);
          
          // Log full employer data for debugging
          console.log('FULL EMPLOYER DATA:', JSON.stringify(employerData, null, 2));
        } catch (e) {
          console.error('Error parsing employerData:', e);
        }
      }
    } else if (accountType === 'employee') {
      console.log("employee"); 
      // Get employee data
      const employeeDataString = await AsyncStorage.getItem('employeeData');
      if (employeeDataString) {
        try {
          const employeeData = JSON.parse(employeeDataString);
          userId = employeeData.id;
          console.log(`Using employee ID from employeeData: ${userId}`);
          
          // Log full employee data for debugging
          console.log('FULL EMPLOYEE DATA:', JSON.stringify(employeeData, null, 2));
        } catch (e) {
          console.error('Error parsing employeeData:', e);
        }
      }
    }

    // Fallback to user ID if specific role data is not available
    if (!userId) {
      // Get general user ID as fallback
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          userId = parseInt(userData.id);
          console.log(`Falling back to general user ID: ${userId}`);
          
          // Log full user data for debugging
          console.log('FULL USER DATA:', JSON.stringify(userData, null, 2));
        } catch (e) {
          console.error('Error parsing userData:', e);
        }
      }
    }

    if (!userId) {
      console.error('No valid user ID found for fetching messages');
      return { conversations: [] };
    }

    return this.getConversationsForUserId(userId);
  }
  
  // Helper method to get conversations for a specific user ID
  private async getConversationsForUserId(userId: number): Promise<ConversationListResponse> {
    try {
      console.log(`Fetching messages for user with ID: ${userId}`);
      
      // Instead of using the conversations endpoint, we'll use a more direct approach
      // Get all messages where this user is either sender or receiver
      const fullUrl = `${apiClient.instance.defaults.baseURL}/messages`;
      console.log(`Full request URL: ${fullUrl}`);
      
      // Check if token is set
      const token = await apiClient.getStoredToken();
      console.log(`Auth token available: ${!!token}`);
      
      // Include the userId as the X-Employee-Id header for proper ID mapping
      const headers: Record<string, string> = {
        'X-Employee-Id': userId.toString()
      };
      
      console.log(`Setting X-Employee-Id header to: ${userId}`);
      
      // First try the conversations endpoint as it should be more efficient
      try {
        console.log(`Making API call to /messages/conversations with X-Employee-Id: ${userId}`);
        const response = await apiClient.instance.get(`/messages/conversations`, { headers });
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', JSON.stringify(response.headers, null, 2));
        
        // Log full response for debugging
        console.log('FULL API RESPONSE:', JSON.stringify(response.data, null, 2));
        
        const data = response.data.data;
        
        if (data && data.conversations && data.conversations.length > 0) {
          console.log(`Received ${data.conversations.length} conversations from API`);
          console.log('First conversation sample:', JSON.stringify(data.conversations[0], null, 2));
          return data;
        }
        console.log('No conversations found in response, trying alternative approach');
      } catch (err: any) {
        console.log('Error fetching from /conversations endpoint, trying alternative approach', err);
        if (err.response) {
          console.log('Error response status:', err.response.status);
          console.log('Error response data:', JSON.stringify(err.response.data, null, 2));
        }
      }
      
      // If conversations endpoint returns empty or fails, try the messages endpoint
      console.log(`Making API call to /messages with X-Employee-Id: ${userId}`);
      const response = await apiClient.instance.get(`/messages`, { headers });
      console.log('API Response Status from messages endpoint:', response.status);
      console.log('API Response Headers from messages endpoint:', JSON.stringify(response.headers, null, 2));
      
      // Log full response for debugging
      console.log('FULL API RESPONSE from messages endpoint:', JSON.stringify(response.data, null, 2));
      
      // Process raw messages into conversations
      const messagesData = response.data.data;
      
      if (!messagesData || !messagesData.messages || messagesData.messages.length === 0) {
        console.log('No messages found for this user');
        return { conversations: [] };
      }
      
      console.log(`Found ${messagesData.messages.length} messages, transforming to conversations`);
      
      // Group messages by conversationId
      const messagesByConversation: Record<string, Message[]> = {};
      
      messagesData.messages.forEach((message: Message) => {
        if (!messagesByConversation[message.conversationId]) {
          messagesByConversation[message.conversationId] = [];
        }
        messagesByConversation[message.conversationId].push(message);
      });
      
      // Transform message groups into conversations
      const conversations: ConversationSummary[] = [];
      
      Object.entries(messagesByConversation).forEach(([conversationId, messages]) => {
        // Sort messages by date (newest first) for each conversation
        messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const latestMessage = messages[0];
        
        // Determine the other user ID (not the current user)
        const otherUserId = latestMessage.senderId === userId ? 
          latestMessage.receiverId : latestMessage.senderId;
          
        // Get the other user's name
        const otherUserName = latestMessage.senderId === userId ? 
          latestMessage.receiverName : latestMessage.senderName;
        
        // Count unread messages (those sent to the current user that are not read)
        const unreadCount = messages.filter(m => 
          !m.isRead && m.receiverId === userId
        ).length;
        
        conversations.push({
          conversationId,
          otherUserId,
          otherUserName,
          lastMessageContent: latestMessage.content,
          lastMessageDate: latestMessage.createdAt,
          unreadCount
        });
      });
      
      console.log(`Transformed into ${conversations.length} conversations`);
      console.log('First conversation sample after transformation:', 
        conversations.length > 0 ? JSON.stringify(conversations[0], null, 2) : 'No conversations');
      console.log('=============== END DEBUG ===============');
      return { conversations };
    } catch (error: any) {
      console.error('Error getting conversations for user ID:', userId, error);
      
      // If we have a response with error details
      if (error.response && error.response.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.log('=============== END DEBUG WITH ERROR ===============');
      // Return empty conversations array to prevent UI errors
      return {
        conversations: []
      };
    }
  }
}

export const messagingService = new MessagingService(); 