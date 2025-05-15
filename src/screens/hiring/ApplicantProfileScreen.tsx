import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Divider, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { employeeService } from '../../services/api/employee';
import { EmployeeProfile } from '../../types/profile';

// Define navigation types
type RootStackParamList = {
  ApplicantProfile: { userId: number };
  Chat: { 
    userId: string; 
    userName: string; 
    userImage: string;
    idType?: 'employee' | 'employer';
  };
};

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'ApplicantProfile'>;

const ApplicantProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employee profile
  useEffect(() => {
    const fetchEmployeeProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the public endpoint as we're accessing this as an employer
        const employeeProfile = await employeeService.getPublicEmployeeProfile(userId);
        setProfile(employeeProfile);
      } catch (err) {
        console.error('Error fetching employee profile:', err);
        setError('Failed to load employee profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeProfile();
  }, [userId]);

  const handleContactPress = () => {
    if (!profile) return;
    
    navigation.navigate('Chat', {
      userId: userId.toString(),
      userName: `${profile.firstName} ${profile.lastName}`,
      userImage: profile.profilePictureUrl || `https://i.pravatar.cc/150?u=${userId}`,
      idType: 'employee'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge">Applicant Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge">Applicant Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Parse services if it's a string
  const services = typeof profile.services === 'string' && profile.services 
    ? JSON.parse(profile.services) 
    : Array.isArray(profile.services) 
      ? profile.services 
      : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge">Applicant Profile</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.profileHeader}>
            <Avatar.Image
              size={100}
              source={{ uri: profile.profilePictureUrl || `https://i.pravatar.cc/150?u=${userId}` }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {`${profile.firstName} ${profile.lastName}`}
              </Text>
              <Text variant="titleMedium" style={styles.jobTitle}>
                Professional
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text variant="labelLarge">{profile.yearsOfExperience}</Text>
                  <Text variant="bodySmall">Years Exp.</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="labelLarge">{profile.totalProjects}</Text>
                  <Text variant="bodySmall">Projects</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="labelLarge">{profile.totalReviews}</Text>
                  <Text variant="bodySmall">Reviews</Text>
                </View>
              </View>
            </View>
          </View>
          
          <Button 
            mode="contained" 
            icon="chat"
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            Contact Applicant
          </Button>
        </Card>
        
        {/* Contact Info */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Contact Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.infoText}>Email placeholder</Text>
            </View>
            {profile.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.infoText}>{profile.phoneNumber}</Text>
              </View>
            )}
            {profile.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.infoText}>{profile.location}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Bio Section */}
        {profile.bio && (
          <Card style={styles.sectionCard}>
            <Card.Title title="About" />
            <Card.Content>
              <Text>{profile.bio}</Text>
            </Card.Content>
          </Card>
        )}
        
        {/* Skills and Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title title="Skills & Certifications" />
            <Card.Content>
              <View style={styles.skillsContainer}>
                {profile.certifications.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip} mode="outlined">
                    {skill}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Services */}
        {services && services.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title title="Services Offered" />
            <Card.Content>
              {services.map((service: { name: string; price: string }, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceRow}>
                    <Text variant="titleMedium">{service.name}</Text>
                    <Text variant="titleMedium" style={styles.servicePrice}>{service.price}</Text>
                  </View>
                  <Divider style={styles.serviceDivider} />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        
        {/* Resume View Button */}
        {profile.cvUrl && (
          <Card style={styles.sectionCard}>
            <Card.Title title="Resume / CV" />
            <Card.Content>
              <Button 
                mode="outlined" 
                icon="file-document-outline"
                onPress={() => Linking.openURL(profile.cvUrl!)}
              >
                View Resume
              </Button>
            </Card.Content>
          </Card>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  jobTitle: {
    opacity: 0.7,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  contactButton: {
    marginTop: 16,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: 4,
  },
  serviceItem: {
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontWeight: 'bold',
  },
  serviceDivider: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginVertical: 16,
    textAlign: 'center',
    color: 'red',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ApplicantProfileScreen; 