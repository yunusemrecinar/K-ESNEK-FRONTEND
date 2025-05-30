import AsyncStorage from '@react-native-async-storage/async-storage';
import { messagingService } from '../services/api/messagingService';

export interface ApplicationMessageData {
  employeeId: number;
  applicantName: string;
  jobTitle: string;
}

/**
 * Sends an automatic message to an employee when their application status changes
 * @param status - The new application status ('Accepted' or 'Rejected')
 * @param data - Application and employee data
 * @returns Promise<boolean> - True if message was sent successfully, false otherwise
 */
export async function sendApplicationStatusMessage(
  status: 'Accepted' | 'Rejected',
  data: ApplicationMessageData
): Promise<boolean> {
  try {
    // Get employer data from AsyncStorage
    const employerDataString = await AsyncStorage.getItem('employerData');
    if (!employerDataString) {
      console.error('Employer data not found in AsyncStorage');
      return false;
    }

    const employerData = JSON.parse(employerDataString);
    const employerId = employerData.id; // This is the EmployerUsers table ID

    if (!employerId || !data.employeeId) {
      console.error('Missing employer or employee ID for messaging:', {
        employerId,
        employeeId: data.employeeId
      });
      return false;
    }

    // Validate IDs are positive numbers
    if (employerId <= 0 || data.employeeId <= 0) {
      console.error('Invalid employer or employee ID (must be positive):', {
        employerId,
        employeeId: data.employeeId
      });
      return false;
    }

    // Create appropriate message based on status
    let messageContent = '';

    if (status === 'Accepted') {
      messageContent = `🎉 Congratulations ${data.applicantName}! We are pleased to inform you that your application for "${data.jobTitle}" has been accepted. We look forward to working with you. Please check your email for further details and next steps.`;
    } else if (status === 'Rejected') {
      messageContent = `Hello ${data.applicantName}, thank you for your interest in "${data.jobTitle}". After careful consideration, we have decided to move forward with other candidates. We appreciate the time you invested in the application process and encourage you to apply for future opportunities that match your skills.`;
    }

    if (!messageContent) {
      console.error('No message content generated for status:', status);
      return false;
    }

    console.log('Attempting to send automatic message:', {
      status,
      employerId,
      employeeId: data.employeeId,
      messageLength: messageContent.length
    });

    // Send message using the messaging service
    const messageResult = await messagingService.sendMessage({
      receiverId: data.employeeId, // EmployeeUsers table ID
      senderId: employerId,        // EmployerUsers table ID
      content: messageContent,
      sender: 'EmployerUser',
      receiver: 'EmployeeUser'
    });

    console.log(`Automatic ${status.toLowerCase()} message sent successfully:`, {
      messageId: messageResult.id,
      employeeId: data.employeeId,
      employerId,
      status,
      conversationId: messageResult.conversationId
    });

    return true;
  } catch (error) {
    console.error('Error sending automatic message:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return false;
  }
}

/**
 * Sends a custom message from employer to employee related to an application
 * @param employeeId - The EmployeeUsers table ID
 * @param content - The message content
 * @returns Promise<boolean> - True if message was sent successfully, false otherwise
 */
export async function sendCustomApplicationMessage(
  employeeId: number,
  content: string
): Promise<boolean> {
  try {
    // Get employer data from AsyncStorage
    const employerDataString = await AsyncStorage.getItem('employerData');
    if (!employerDataString) {
      console.error('Employer data not found in AsyncStorage');
      return false;
    }

    const employerData = JSON.parse(employerDataString);
    const employerId = employerData.id;

    if (!employerId || !employeeId) {
      console.error('Missing employer or employee ID for messaging');
      return false;
    }

    if (employerId <= 0 || employeeId <= 0) {
      console.error('Invalid employer or employee ID (must be positive)');
      return false;
    }

    if (!content.trim()) {
      console.error('Message content cannot be empty');
      return false;
    }

    // Send message using the messaging service
    const messageResult = await messagingService.sendMessage({
      receiverId: employeeId,
      senderId: employerId,
      content: content.trim(),
      sender: 'EmployerUser',
      receiver: 'EmployeeUser'
    });

    console.log('Custom application message sent successfully:', {
      messageId: messageResult.id,
      employeeId,
      employerId,
      conversationId: messageResult.conversationId
    });

    return true;
  } catch (error) {
    console.error('Error sending custom application message:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
} 