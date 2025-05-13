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
      
      // If a senderId is provided, include it as a custom header
      const headers: Record<string, string> = {};
      if (request.senderId) {
        headers['X-Employee-Id'] = request.senderId.toString();
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
      // Construct the full URL for debugging
      const fullUrl = `${apiClient.instance.defaults.baseURL}/messages/conversation/${userId}`;
      
      // Check if token is set
      const token = await apiClient.getStoredToken();
      
      // If a senderId is provided, include it as a custom header
      const headers: Record<string, string> = {};
      if (senderId) {
        headers['X-Employee-Id'] = senderId.toString();
      }
      
      const response = await apiClient.instance.get<ApiConversationResponse>(
        `/messages/conversation/${userId}`,
        { headers }
      );
      
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
    
    // Determine which ID to use based on account type
    let userId: number | undefined;
    
    if (accountType === 'employer') {
      // Get employer data
      const employerDataString = await AsyncStorage.getItem('employerData');
      if (employerDataString) {
        try {
          const employerData = JSON.parse(employerDataString);
          userId = employerData.id;
        } catch (e) {
          console.error('Error parsing employerData:', e);
        }
      }
    } else if (accountType === 'employee') {
      // Get employee data
      const employeeDataString = await AsyncStorage.getItem('employeeData');
      if (employeeDataString) {
        try {
          const employeeData = JSON.parse(employeeDataString);
          userId = employeeData.id;
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
      // Instead of using the conversations endpoint, we'll use a more direct approach
      // Get all messages where this user is either sender or receiver
      const fullUrl = `${apiClient.instance.defaults.baseURL}/messages`;
      
      // Check if token is set
      const token = await apiClient.getStoredToken();
      
      // Include the userId as the X-Employee-Id header for proper ID mapping
      const headers: Record<string, string> = {
        'X-Employee-Id': userId.toString()
      };
      
      // First try the conversations endpoint as it should be more efficient
      try {
        const response = await apiClient.instance.get(`/messages/conversations`, { headers });
        
        const data = response.data.data;
        
        if (data && data.conversations && data.conversations.length > 0) {
          return data;
        }
      } catch (err: any) {
        console.log('Error fetching from /conversations endpoint, trying alternative approach', err);
        if (err.response) {
          console.log('Error response status:', err.response.status);
        }
      }
      
      // If conversations endpoint returns empty or fails, try the messages endpoint
      const response = await apiClient.instance.get(`/messages`, { headers });
      
      // Process raw messages into conversations
      const messagesData = response.data.data;
      
      if (!messagesData || !messagesData.messages || messagesData.messages.length === 0) {
        return { conversations: [] };
      }
      
      
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
      
      return { conversations };
    } catch (error: any) {
      console.error('Error getting conversations for user ID:', userId, error);
      
      // If we have a response with error details
      if (error.response && error.response.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Return empty conversations array to prevent UI errors
      return {
        conversations: []
      };
    }
  }
}

export const messagingService = new MessagingService(); 