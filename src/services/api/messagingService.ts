import { apiClient } from './client';

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
  messages: Message[];
  totalCount: number;
  hasMoreMessages: boolean;
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
      const response = await apiClient.instance.post('/messages', request);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get conversation messages with a specific user
  async getConversation(userId: number): Promise<MessageListResponse> {
    try {
      console.log(`Attempting to get conversation with user ID: ${userId}`);
      console.log(`API Base URL: ${apiClient.instance.defaults.baseURL}`);
      
      // Construct the full URL for debugging
      const fullUrl = `${apiClient.instance.defaults.baseURL}/messages/conversation/${userId}`;
      console.log(`Full request URL: ${fullUrl}`);
      
      // Check if token is set
      const token = await apiClient.getStoredToken();
      console.log(`Auth token available: ${!!token}`);
      
      const response = await apiClient.instance.get(`/messages/conversation/${userId}`);
      console.log('API Response Status:', response.status);
      return response.data;
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
        messages: [],
        totalCount: 0,
        hasMoreMessages: false
      };
    }
  }

  // Get all conversations for the current user
  async getConversations(): Promise<ConversationListResponse> {
    try {
      const response = await apiClient.instance.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
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
}

export const messagingService = new MessagingService(); 