import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Text, Button, Avatar, Card, Chip, IconButton, Badge, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MaterialCommunityIcons as IconType } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { fileService } from '../../services/api/files';

const { width } = Dimensions.get('window');

interface Stat {
  label: string;
  value: string;
  icon: keyof typeof IconType.glyphMap;
}

interface Service {
  name: string;
  price: string;
  icon: keyof typeof IconType.glyphMap;
}

const ProfileScreen = () => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [backgroundPicture, setBackgroundPicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const employeeId = 1; // This should come from authentication context or state
  const rating = 4.9;

  const stats: Stat[] = [
    { label: 'Projects', value: '143', icon: 'briefcase-outline' },
    { label: 'Reviews', value: '98', icon: 'star-outline' },
    { label: 'Years', value: '5', icon: 'calendar-outline' },
  ];

  const services: Service[] = [
    { name: 'Pet Walking', price: '$20/hr', icon: 'dog-side' },
    { name: 'Pet Sitting', price: '$50/day', icon: 'home' },
    { name: 'Pet Training', price: '$40/hr', icon: 'school' },
    { name: 'Pet Grooming', price: '$35/session', icon: 'scissors-cutting' },
  ];

  const reviews = [
    {
      id: '1',
      author: 'Emma Thompson',
      rating: 5,
      date: '2 days ago',
      comment: 'Amazing service! Very professional and caring with my pets.',
      avatar: 'E',
    },
    {
      id: '2',
      author: 'John Miller',
      rating: 5,
      date: '1 week ago',
      comment: 'Great experience. Would definitely recommend!',
      avatar: 'J',
    },
    {
      id: '3',
      author: 'Sarah Wilson',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Very reliable and trustworthy. My dog loves her walks with Ryan.',
      avatar: 'S',
    },
  ];
  
  useEffect(() => {
    // In a real app, you would fetch the employee profile data
    // and check for profilePictureId and backgroundPictureId
    
    // For demo purposes, if these IDs exist, generate URLs
    const mockProfilePictureId = null; // In real app: fetch from API
    const mockBackgroundPictureId = null; // In real app: fetch from API
    
    if (mockProfilePictureId) {
      setProfilePicture(fileService.getFileUrl(mockProfilePictureId));
    }
    
    if (mockBackgroundPictureId) {
      setBackgroundPicture(fileService.getFileUrl(mockBackgroundPictureId));
    }
  }, []);

  const handleProfilePictureUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        
        // Get the URI from the first selected asset
        const uri = result.assets[0].uri;
        
        // Create a file from the URI
        const fileInfo = await fetch(uri);
        const blob = await fileInfo.blob();
        const filename = uri.split('/').pop() || 'profile.jpg';
        const file = new File([blob], filename, { type: 'image/jpeg' });
        
        // Upload the file
        const fileId = await fileService.uploadEmployeeProfilePicture(employeeId, file);
        
        // Set the profile picture URL
        setProfilePicture(fileService.getFileUrl(fileId));
        
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Alert.alert('Upload Error', 'Could not upload profile picture');
      setIsUploading(false);
    }
  };
  
  const handleBackgroundPictureUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        
        // Get the URI from the first selected asset
        const uri = result.assets[0].uri;
        
        // Create a file from the URI
        const fileInfo = await fetch(uri);
        const blob = await fileInfo.blob();
        const filename = uri.split('/').pop() || 'background.jpg';
        const file = new File([blob], filename, { type: 'image/jpeg' });
        
        // Upload the file
        const fileId = await fileService.uploadEmployeeBackgroundPicture(employeeId, file);
        
        // Set the background picture URL
        setBackgroundPicture(fileService.getFileUrl(fileId));
        
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error uploading background picture:", error);
      Alert.alert('Upload Error', 'Could not upload background picture');
      setIsUploading(false);
    }
  };
  
  const handleCVUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        
        const asset = result.assets[0];
        
        // Create a file from the URI
        const fileInfo = await fetch(asset.uri);
        const blob = await fileInfo.blob();
        const file = new File([blob], asset.name || 'cv.pdf', { type: asset.mimeType || 'application/pdf' });
        
        // Upload the CV
        const fileId = await fileService.uploadEmployeeCV(employeeId, file);
        
        setIsUploading(false);
        Alert.alert('Success', 'CV uploaded successfully');
      }
    } catch (error) {
      console.error("Error uploading CV:", error);
      Alert.alert('Upload Error', 'Could not upload CV');
      setIsUploading(false);
    }
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          {backgroundPicture ? (
            <Image source={{ uri: backgroundPicture }} style={styles.coverImage} />
          ) : (
            <MaterialCommunityIcons name="image" size={32} color="#666" style={styles.placeholderIcon} />
          )}
          <TouchableOpacity style={styles.editCoverButton} onPress={handleBackgroundPictureUpload} disabled={isUploading}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            {profilePicture ? (
              <Avatar.Image 
                size={100} 
                source={{ uri: profilePicture }}
                style={styles.profilePicture}
              />
            ) : (
              <Avatar.Icon 
                size={100} 
                icon="account"
                style={styles.profilePicture}
                color="#fff"
              />
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleProfilePictureUpload} disabled={isUploading}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text variant="headlineMedium" style={styles.name}>
                Ryan Evans
              </Text>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFC107" />
              <Text variant="titleLarge" style={styles.rating}>
                {rating}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.location}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              {' San Francisco, CA'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              style={styles.messageButton}
              labelStyle={styles.messageButtonLabel}
              onPress={handleCVUpload}
              icon="file-upload-outline"
              loading={isUploading}
              disabled={isUploading}
            >
              Upload CV
            </Button>
            <IconButton
              icon="share-variant"
              mode="outlined"
              size={24}
              style={styles.shareButton}
              onPress={() => {/* Handle share */}}
            />
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <TouchableOpacity key={stat.label} style={styles.statItem}>
                <MaterialCommunityIcons name={stat.icon} size={24} color="#6C63FF" style={styles.statIcon} />
                <Text variant="headlineSmall" style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  {stat.label}
                </Text>
                {index < stats.length - 1 && <View style={styles.statDivider} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Bio Section */}
          <Card style={styles.bioCard}>
            <Card.Content>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="account-details" size={24} color="#333" />
                <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
              </View>
              <Text variant="bodyMedium" style={styles.bioText}>
                Professional pet sitter with over 5 years of experience. Specialized in dog walking, pet sitting, and basic training. Certified in pet first aid and CPR.
              </Text>
              <View style={styles.certificatesContainer}>
                <Chip icon="certificate" style={styles.certificateChip}>Pet First Aid</Chip>
                <Chip icon="certificate" style={styles.certificateChip}>CPR Certified</Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="briefcase-outline" size={24} color="#333" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Services</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesScrollContent}
            >
              {services.map((service) => (
                <Card key={service.name} style={styles.serviceCard}>
                  <Card.Content style={styles.serviceCardContent}>
                    <MaterialCommunityIcons name={service.icon} size={32} color="#6C63FF" />
                    <Text variant="titleMedium" style={styles.serviceTitle}>
                      {service.name}
                    </Text>
                    <Text variant="bodyLarge" style={styles.servicePrice}>
                      {service.price}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="star-outline" size={24} color="#333" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Recent Reviews</Text>
              <Text variant="bodyMedium" style={styles.reviewCount}>({reviews.length})</Text>
            </View>
            {displayedReviews.map((review) => (
              <Card key={review.id} style={styles.reviewCard}>
                <Card.Content>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthorContainer}>
                      <Avatar.Text size={36} label={review.avatar} style={styles.reviewAvatar} />
                      <View>
                        <Text variant="titleSmall" style={styles.reviewAuthor}>
                          {review.author}
                        </Text>
                        <Text variant="bodySmall" style={styles.reviewDate}>
                          {review.date}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                      <Text variant="bodyMedium">{review.rating}</Text>
                    </View>
                  </View>
                  <Text variant="bodyMedium" style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                </Card.Content>
              </Card>
            ))}
            {reviews.length > 2 && (
              <Button
                mode="text"
                onPress={() => setShowAllReviews(!showAllReviews)}
                style={styles.showMoreButton}
              >
                {showAllReviews ? 'Show Less' : 'Show All Reviews'}
              </Button>
            )}
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  coverImageContainer: {
    width: width,
    height: 200,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  editCoverButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  profilePictureContainer: {
    position: 'absolute',
    top: -50,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#6C63FF',
  },
  profilePicture: {
    backgroundColor: '#6C63FF',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '600',
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  location: {
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  messageButton: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
  },
  messageButtonLabel: {
    fontSize: 16,
  },
  shareButton: {
    borderColor: '#6C63FF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
    color: '#6C63FF',
  },
  statLabel: {
    color: '#666',
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '10%',
    height: '80%',
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  bioCard: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  certificatesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  certificateChip: {
    backgroundColor: '#F0EFFF',
  },
  servicesSection: {
    width: '100%',
    marginBottom: 24,
  },
  servicesScrollContent: {
    paddingRight: 20,
  },
  serviceCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  serviceCardContent: {
    alignItems: 'center',
    gap: 8,
  },
  serviceTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  servicePrice: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  reviewsSection: {
    width: '100%',
    marginBottom: 24,
  },
  reviewCount: {
    color: '#666',
    marginLeft: 4,
  },
  reviewCard: {
    marginBottom: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    backgroundColor: '#6C63FF',
  },
  reviewAuthor: {
    fontWeight: '600',
  },
  reviewDate: {
    color: '#666',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewComment: {
    color: '#333',
    lineHeight: 20,
  },
  showMoreButton: {
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  bioText: {
    lineHeight: 20,
    color: '#666',
  },
});

export default ProfileScreen; 