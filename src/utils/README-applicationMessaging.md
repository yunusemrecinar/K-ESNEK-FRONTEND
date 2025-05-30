# Application Messaging Utility

This utility provides functions for sending automatic messages when application statuses change.

## Overview

When an employer accepts or rejects an applicant in the `ApplicationDetailsScreen`, the system automatically sends a personalized message to the employee using their respective IDs from the `EmployeeUsers` and `EmployerUsers` tables.

## Key Features

- **Automatic Status Messages**: Sends congratulatory messages for accepted applications and polite rejection messages for rejected applications
- **Proper ID Mapping**: Uses `EmployeeUsers.Id` and `EmployerUsers.Id` for messaging (not `AspNetUsers.Id`)
- **Error Handling**: Robust error handling that doesn't break the application status update process
- **Reusable Functions**: Utility functions that can be used across different parts of the application

## How It Works

### Database Schema

The Messages table stores:
- `SenderId`: EmployerUsers table ID
- `ReceiverId`: EmployeeUsers table ID
- `Content`: The message text
- `ConversationId`: Generated based on sender and receiver IDs
- `Sender`: "EmployerUser" 
- `Receiver`: "EmployeeUser"

### ID Relationships

```
JobApplication.userId → EmployeeUsers.Id → Message.ReceiverId
AsyncStorage.employerData.id → EmployerUsers.Id → Message.SenderId
```

### Message Flow

1. Employer clicks "Accept Applicant" or "Reject Applicant" button
2. Application status is updated in database
3. System retrieves:
   - `EmployerUsers.Id` from AsyncStorage (`employerData.id`)
   - `EmployeeUsers.Id` from application data (`application.userId`)
   - Applicant name and job title for personalization
4. Appropriate message is generated based on status
5. Message is sent via the messaging service
6. Employee receives the message in their Messages/Chat screen

## Usage

### Import the utility:
```typescript
import { sendApplicationStatusMessage } from '../utils/applicationMessaging';
```

### Send an automatic status message:
```typescript
const success = await sendApplicationStatusMessage('Accepted', {
  employeeId: application.userId,
  applicantName: 'John Doe',
  jobTitle: 'Software Developer'
});
```

### Send a custom message:
```typescript
const success = await sendCustomApplicationMessage(
  employeeId,
  'We would like to schedule an interview for next week.'
);
```

## Message Templates

### Acceptance Message:
```
🎉 Congratulations [Name]! We are pleased to inform you that your application for "[Job Title]" has been accepted. We look forward to working with you. Please check your email for further details and next steps.
```

### Rejection Message:
```
Hello [Name], thank you for your interest in "[Job Title]". After careful consideration, we have decided to move forward with other candidates. We appreciate the time you invested in the application process and encourage you to apply for future opportunities that match your skills.
```

## Error Handling

- If employer data is not found in AsyncStorage, the function logs an error and returns `false`
- If employee ID is invalid, the function logs an error and returns `false`
- If message sending fails, the error is logged but doesn't throw to avoid breaking the status update
- All errors are logged with detailed context for debugging

## Technical Notes

- The Messages table foreign key constraints to `AspNetUsers` were removed to allow storing `EmployeeUsers`/`EmployerUsers` IDs
- The backend `SendMessageCommandHandler` handles the conversion from `EmployeeUsers`/`EmployerUsers` IDs to actual `User` entities for display names
- Conversation IDs are generated consistently using the lower ID first: `${minId}-${maxId}`

## Files Modified

- `K-Esnek-Frontend-5/src/screens/hiring/ApplicationDetailsScreen.tsx`: Added automatic messaging on status change
- `K-Esnek-Frontend-5/src/utils/applicationMessaging.ts`: Created utility functions
- Backend already supports this functionality via the existing messaging API 