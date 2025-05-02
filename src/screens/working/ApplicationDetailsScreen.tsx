import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

// Define the types
type RootStackParamList = {
  ApplicationDetails: { applicationId: string };
  Chat: { userId: string; userName: string; userImage: string };
};

type ApplicationDetailsRouteProp = RouteProp<RootStackParamList, 'ApplicationDetails'>;
type ApplicationDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedDate: Date;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  contactEmail?: string;
  contactPhone?: string;
}

const ApplicationDetailsScreen = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const route = useRoute<ApplicationDetailsRouteProp>();
  const navigation = useNavigation<ApplicationDetailsNavigationProp>();
  const { applicationId } = route.params;

  // Fetch application details
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        // TODO: Replace with actual API call
        // Simulating API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for the application details
        const mockApplication: Application = {
          id: applicationId,
          jobTitle: 'Software Developer',
          companyName: 'Tech Corp',
          status: 'pending',
          appliedDate: new Date(),
          location: 'Istanbul, Turkey',
          salary: '$50,000 - $70,000',
          description: 'We are looking for a passionate Software Developer to design, develop and implement software solutions. The ideal candidate will have a strong background in web development, be proficient with JavaScript/TypeScript, and have experience with React and React Native.',
          requirements: [
            'Bachelor\'s degree in Computer Science or related field',
            '2+ years of experience with React/React Native',
            'Proficiency in TypeScript',
            'Experience with RESTful APIs',
            'Knowledge of mobile app development processes'
          ],
          responsibilities: [
            'Develop mobile applications using React Native',
            'Collaborate with cross-functional teams',
            'Participate in code reviews',
            'Troubleshoot and debug applications',
            'Implement responsive design'
          ],
          contactEmail: 'hr@techcorp.com',
          contactPhone: '+90 212 555 1234'
        };
        
        setApplication(mockApplication);
      } catch (error) {
        console.error('Error fetching application details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  // Status chip color mapping
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending': return theme.colors.primary;
      case 'accepted': return '#4CAF50';
      case 'rejected': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };

  // Handle opening email
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Handle opening phone
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.error} />
        <Text variant="headlineSmall" style={styles.errorTitle}>Application Not Found</Text>
        <Text variant="bodyMedium" style={styles.errorDescription}>
          The application details could not be loaded. Please try again later.
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          mode="text" 
          onPress={() => navigation.goBack()}
          contentStyle={styles.backButtonContent}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>Application Details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="titleLarge" style={styles.jobTitle}>{application.jobTitle}</Text>
                <Text variant="titleMedium" style={styles.companyName}>{application.companyName}</Text>
              </View>
              <Chip
                mode="flat"
                textStyle={{ color: '#fff' }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(application.status) }]}
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Chip>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.detailText}>{application.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.detailText}>
                  Applied {format(application.appliedDate, 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="currency-usd" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.detailText}>{application.salary}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Job Description</Text>
            <Text variant="bodyMedium" style={styles.descriptionText}>{application.description}</Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
            {application.requirements.map((requirement, index) => (
              <View key={`req-${index}`} style={styles.listItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.listItemText}>{requirement}</Text>
              </View>
            ))}

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Responsibilities</Text>
            {application.responsibilities.map((responsibility, index) => (
              <View key={`resp-${index}`} style={styles.listItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.listItemText}>{responsibility}</Text>
              </View>
            ))}

            {(application.contactEmail || application.contactPhone) && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Contact Information</Text>
                
                {application.contactEmail && (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => handleEmailPress(application.contactEmail || '')}
                  >
                    <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>{application.contactEmail}</Text>
                  </TouchableOpacity>
                )}
                
                {application.contactPhone && (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => handlePhonePress(application.contactPhone || '')}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={[styles.contactText, styles.contactLink]}>{application.contactPhone}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            icon="chat" 
            style={[styles.actionButton, styles.primaryButton]} 
            buttonColor="#4A87C9"
            onPress={() => {
              // Navigate to Chat screen with the employer information
              navigation.navigate('Chat', {
                userId: application.id.toString(),
                userName: application.companyName || 'Employer',
                userImage: `https://i.pravatar.cc/150?u=${application.id}` // Generate avatar based on ID
              });
            }}
          >
            Contact Employer
          </Button>
          <Button 
            mode="outlined" 
            icon="close" 
            style={styles.actionButton} 
            textColor={theme.colors.error}
            onPress={() => {
              // TODO: Implement withdraw application
              console.log('Withdraw application');
            }}
          >
            Withdraw Application
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 50, // To balance the back button on the left
  },
  backButtonContent: {
    flexDirection: 'row-reverse',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    opacity: 0.7,
  },
  statusChip: {
    borderRadius: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  listItemText: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactText: {
    opacity: 0.7,
  },
  contactLink: {
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  primaryButton: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ApplicationDetailsScreen; 