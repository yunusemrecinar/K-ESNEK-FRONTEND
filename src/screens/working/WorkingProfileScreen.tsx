import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Avatar, Card, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MaterialCommunityIcons as IconType } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { fileService } from '../../services/api/files';
import { employeeService, EmployeeStats } from '../../services/api/employee';
import { apiClient } from '../../services/api/client';
import { AuthContext } from '../../contexts/AuthContext';
import { EmployeeProfile, EmployeeService } from '../../types/profile';
import { useAuth } from '../../hooks/useAuth';
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeScreenParamList } from '../../types/navigation';
import { employeeReviewsService, EmployeeReviewDto } from '../../services/api/employeeReviews';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type Props = {
  navigation: NativeStackNavigationProp<CompositeScreenParamList>;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [backgroundPicture, setBackgroundPicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaLibraryAssets, setMediaLibraryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [uploadType, setUploadType] = useState<'profile' | 'background'>('profile');
  
  // Edit mode state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState<string>('');
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [editedServices, setEditedServices] = useState<EmployeeService[]>([]);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<EmployeeService | null>(null);
  const [serviceEditIndex, setServiceEditIndex] = useState<number | null>(null);
  
  const userId = user?.id || '0'; // Get user ID from AuthContext or default to 0
  const rating = profile?.averageRating || 4.9;

  console.log("stats", stats);

  const statsData: Stat[] = [
    { label: 'Projects', value: stats?.totalProjects?.toString() || profile?.totalProjects?.toString() || '0', icon: 'briefcase-outline' },
    { label: 'Reviews', value: profile?.totalReviews?.toString() || '0', icon: 'star-outline' },
    { label: 'Years', value: stats?.yearsOfExperience?.toString() || profile?.yearsOfExperience?.toString() || '0', icon: 'calendar-outline' },
  ];

  console.log("stats", stats);

  // Initialize default services
  const defaultServices: EmployeeService[] = [
    { name: 'Pet Walking', icon: 'dog-side' },
    { name: 'Pet Sitting', icon: 'home' },
    { name: 'Pet Training', icon: 'school' },
    { name: 'Pet Grooming', icon: 'scissors-cutting' },
  ];

  // Ensure services is an array by handling when it might be a string
  const services = Array.isArray(profile?.services) 
    ? profile.services 
    : defaultServices;

  const [reviews, setReviews] = useState<EmployeeReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  useEffect(() => {
    if (profile?.id && profile.id > 0) {
      fetchReviews();
    }
  }, [profile?.id]);

  

  const fetchReviews = async () => {
    if (!profile?.id || profile.id <= 0) return;
    
    try {
      setReviewsLoading(true);
      const reviewData = await employeeReviewsService.getEmployeeReviews(profile.id, false, 10); // Limit to 10 reviews
      setReviews(reviewData.recentReviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Don't show alert for reviews as it's not critical
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatReviewDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const fetchProfileData = async () => {
    if (!userId || userId === '0') return;
    
    try {
      setIsLoading(true);
      
      // Fetch profile data
      const profileData = await employeeService.getEmployeeProfile(userId);
      
      // If services data is provided as JSON string, parse it
      if (profileData.services && typeof profileData.services === 'string') {
        try {
          profileData.services = JSON.parse(profileData.services) as EmployeeService[];
        } catch (error) {
          console.error('Error parsing services JSON:', error);
          profileData.services = []; // Set default empty array if parsing fails
        }
      }
      
      setProfile(profileData);
      
      // Fetch stats data
      try {
        const statsData = await employeeService.getEmployeeStats(userId);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep stats as null if fetch fails, will fall back to profile data
      }
      
      // Helper function to ensure URLs are accessible from mobile
      const makeUrlAccessible = (url: string | null | undefined): string | null => {
        if (!url) return null;
        
        // Replace localhost URLs with ngrok URL
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          return url.replace(/(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'http://165.22.90.212:8080');
        }
        
        return url;
      };
      
      // Set profile picture URL if available
      if (profileData.profilePictureUrl) {
        const accessibleUrl = makeUrlAccessible(profileData.profilePictureUrl);
        setProfilePicture(accessibleUrl);
      } else {
        setProfilePicture(null);
      }
      
      // Set background picture URL if available
      if (profileData.backgroundPictureUrl) {
        const accessibleUrl = makeUrlAccessible(profileData.backgroundPictureUrl);
        setBackgroundPicture(accessibleUrl);
      } else {
        setBackgroundPicture(null);
      }
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMediaLibraryAssets = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }
      
      // Get assets
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 20, // Fetch the 20 most recent photos
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      
      setMediaLibraryAssets(media.assets);
      setShowImagePicker(true);
    } catch (error) {
      console.error("Error loading media library assets:", error);
      Alert.alert('Error', 'Could not load images from your media library');
    }
  };

  const selectAndProcessImage = async (asset: MediaLibrary.Asset) => {
    try {
      // Get asset info
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(assetInfo.localUri || asset.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist');
        return null;
      }
      
      const uri = assetInfo.localUri || asset.uri;
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = 
        fileExtension === 'png' ? 'image/png' : 
        fileExtension === 'gif' ? 'image/gif' : 
        'image/jpeg';
      
      return {
        uri,
        name: `image-${Date.now()}.${fileExtension}`,
        type: mimeType,
        size: fileInfo.size,
      };
    } catch (error) {
      console.error("Error processing selected image:", error);
      Alert.alert('Error', 'Could not process the selected image');
      return null;
    }
  };

  const handleAssetSelected = async (asset: MediaLibrary.Asset) => {
    try {
      setShowImagePicker(false);
      setIsUploading(true);
      
      // Validate userId
      if (!userId || userId === '0') {
        console.error('Invalid userId for upload:', userId);
        Alert.alert('Error', 'Invalid user ID. Please login again.');
        setIsUploading(false);
        return;
      }
      
      const imageFile = await selectAndProcessImage(asset);
      
      if (!imageFile) {
        setIsUploading(false);
        return;
      }
      
      // Create a FormData object
      const formData = new FormData();
      // Append the file to the FormData with the right format for React Native
      formData.append('file', {
        uri: imageFile.uri,
        name: imageFile.name,
        type: imageFile.type,
      } as any);
      
      let fileId: number;
      
      // Handle different upload types
      try {
        if (uploadType === 'profile') {
          // Ensure userId is a number
          const userIdNum = parseInt(userId);
          if (isNaN(userIdNum)) {
            throw new Error(`Invalid userId format: ${userId}`);
          }
          fileId = await fileService.uploadEmployeeProfilePicture(userIdNum, formData);
        } else {
          // Ensure userId is a number
          const userIdNum = parseInt(userId);
          if (isNaN(userIdNum)) {
            throw new Error(`Invalid userId format: ${userId}`);
          }
          fileId = await fileService.uploadEmployeeBackgroundPicture(userIdNum, formData);
        }
        
        // Short delay before fetching updated profile data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh profile data to ensure we have the latest file IDs
        await fetchProfileData();
        
        setIsUploading(false);
        
        // Make sure the image is displayed even if fetchProfileData didn't update it
        if (uploadType === 'profile' && fileId) {
          const directUrl = fileService.getFileUrl(fileId);
          setProfilePicture(directUrl);
        } else if (fileId) {
          const directUrl = fileService.getFileUrl(fileId);
          setBackgroundPicture(directUrl);
        }
      } catch (uploadError: any) {
        console.error("Error in file upload request:", uploadError);
        
        if (uploadError.response) {
          console.error('Response error data:', uploadError.response.data);
          console.error('Response status:', uploadError.response.status);
        }
        
        Alert.alert('Upload Error', 'Could not upload image. Please try again.');
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error in image selection/processing:", error);
      Alert.alert('Upload Error', 'Could not process or upload image');
      setIsUploading(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    setUploadType('profile');
    await loadMediaLibraryAssets();
  };
  
  const handleBackgroundPictureUpload = async () => {
    setUploadType('background');
    await loadMediaLibraryAssets();
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
        
        // Create a FormData object
        const formData = new FormData();
        // Append the file to the FormData with the right format for React Native
        formData.append('file', {
          uri: asset.uri,
          name: asset.name || 'cv.pdf',
          type: asset.mimeType || 'application/pdf',
        } as any);
        
        try {
          // Ensure userId is a number
          const userIdNum = parseInt(userId);
          if (isNaN(userIdNum)) {
            throw new Error(`Invalid userId format: ${userId}`);
          }
          // Upload the CV
          const fileId = await fileService.uploadEmployeeCV(userIdNum, formData);
          
          // Short delay before fetching updated profile data
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh profile data
          await fetchProfileData();
          
          setIsUploading(false);
          Alert.alert('Success', 'CV uploaded successfully');
        } catch (uploadError: any) {
          console.error("Error in CV upload request:", uploadError);
          
          if (uploadError.response) {
            console.error('Response error data:', uploadError.response.data);
            console.error('Response status:', uploadError.response.status);
          }
          
          Alert.alert('Upload Error', 'Could not upload CV. Please try again.');
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error("Error selecting or processing CV:", error);
      Alert.alert('Upload Error', 'Could not process or upload CV');
      setIsUploading(false);
    }
  };

  const renderImagePickerModal = () => {
    return (
      <Modal
        visible={showImagePicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowImagePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">Select an Image</Text>
            <IconButton
              icon="close"
              onPress={() => setShowImagePicker(false)}
            />
          </View>
          
          <FlatList
            data={mediaLibraryAssets}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.imageItem}
                onPress={() => handleAssetSelected(item)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbnailImage}
                />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  // Handle bio update
  const handleBioEdit = () => {
    setEditedBio(profile?.bio || 'Professional pet sitter with over 5 years of experience. Specialized in dog walking, pet sitting, and basic training. Certified in pet first aid and CPR.');
    setIsEditingBio(true);
  };
  
  const handleBioSave = async () => {
    if (!profile || !userId) return;
    
    try {
      setIsSaving(true);
      
      // Update the profile with the new bio
      await employeeService.updateEmployeeProfile(userId, {
        bio: editedBio
      });
      
      // Update the local profile data
      setProfile({
        ...profile,
        bio: editedBio
      });
      
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBioCancel = () => {
    setIsEditingBio(false);
  };

  // Service editing functions
  const handleServicesEdit = () => {
    setEditedServices(JSON.parse(JSON.stringify(services)));
    setIsEditingServices(true);
  };

  const handleServicesSave = async () => {
    if (!profile || !userId) return;
    
    try {
      setIsSaving(true);
      
      // Stringify services for API
      const servicesJson = JSON.stringify(editedServices);
      
      // Update the profile with the new services
      await employeeService.updateEmployeeProfile(userId, {
        services: servicesJson
      });
      
      // Update the local profile data with the edited services array (not the JSON string)
      setProfile({
        ...profile,
        services: editedServices
      });
      
      setIsEditingServices(false);
    } catch (error) {
      console.error('Error updating services:', error);
      Alert.alert('Error', 'Failed to update services');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleServicesCancel = () => {
    setIsEditingServices(false);
  };
  
  const addService = () => {
    setCurrentService({ name: '', icon: 'briefcase-outline' });
    setServiceEditIndex(null);
    setServiceModalVisible(true);
  };
  
  const editService = (index: number) => {
    setCurrentService(editedServices[index]);
    setServiceEditIndex(index);
    setServiceModalVisible(true);
  };
  
  const deleteService = (index: number) => {
    const updatedServices = [...editedServices];
    updatedServices.splice(index, 1);
    setEditedServices(updatedServices);
  };
  
  const saveService = () => {
    if (!currentService) return;
    
    const updatedServices = [...editedServices];
    
    if (serviceEditIndex !== null) {
      // Edit existing service
      updatedServices[serviceEditIndex] = currentService;
    } else {
      // Add new service
      updatedServices.push(currentService);
    }
    
    setEditedServices(updatedServices);
    setServiceModalVisible(false);
  };

  const renderServiceModal = () => {
    return (
      <Modal
        visible={serviceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {serviceEditIndex !== null ? 'Edit Service' : 'Add Service'}
              </Text>
              <IconButton
                icon="close"
                onPress={() => setServiceModalVisible(false)}
              />
            </View>
            
            <View style={styles.serviceForm}>
              <Text variant="labelLarge" style={styles.formLabel}>Service Name</Text>
              <TextInput
                style={styles.serviceInput}
                value={currentService?.name}
                onChangeText={(text) => setCurrentService({ ...currentService!, name: text })}
                placeholder="e.g. Dog Walking"
                placeholderTextColor="#999"
              />
              
              <Text variant="labelLarge" style={styles.formLabel}>Select an Icon</Text>
              <View style={styles.iconSelector}>
                {['dog-side', 'home', 'school', 'scissors-cutting', 'paw', 'bowl', 'cat', 'bird', 'walk', 'car', 'human-handsup', 'toy-brick'].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconItem,
                      currentService?.icon === icon && styles.selectedIconItem
                    ]}
                    onPress={() => setCurrentService({ ...currentService!, icon })}
                  >
                    <MaterialCommunityIcons 
                      name={icon as any} 
                      size={24} 
                      color={currentService?.icon === icon ? '#fff' : '#555'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setServiceModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={saveService}
                style={styles.modalButtonPrimary}
                disabled={!currentService?.name || !currentService?.icon}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to Auth stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading background...</Text>
            </View>
          ) : backgroundPicture ? (
            <>
              <Image 
                source={{ uri: backgroundPicture }} 
                style={styles.coverImage} 
                onLoad={() => console.log('Background image loaded successfully')}
                onError={(error) => {
                  console.error('Failed to load background image:', error.nativeEvent.error);
                  // Retry with fresh URL after error
                  if (profile?.backgroundPictureId) {
                    const freshUrl = fileService.getFileUrl(profile.backgroundPictureId);
                    setBackgroundPicture(freshUrl);
                  }
                }}
              />
            </>
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
            {isLoading ? (
              <Avatar.Icon 
                size={100} 
                icon="refresh"
                style={styles.profilePicture}
                color="#fff"
              />
            ) : profilePicture ? (
              <>
                <View>
                  <Avatar.Image 
                    size={100} 
                    source={{ uri: profilePicture }}
                    style={styles.profilePicture}
                  />
                  {/* Use a regular Image component as a "probe" to detect loading errors */}
                  <Image 
                    source={{ uri: profilePicture }}
                    style={{ width: 1, height: 1, opacity: 0 }}
                    onLoadStart={() => console.log('Starting to load profile picture')}
                    onError={() => {
                      console.error('Failed to load profile picture');
                      // Retry with fresh URL after error
                      if (profile?.profilePictureId) {
                        const freshUrl = fileService.getFileUrl(profile.profilePictureId);
                        setProfilePicture(freshUrl);
                      }
                    }}
                    onLoadEnd={() => console.log('Finished loading profile picture attempt')}
                  />
                </View>
              </>
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
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
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
              {profile?.location ? ` ${profile.location}` : ' Location not set'}
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
            <IconButton
              icon="logout"
              mode="outlined"
              size={24}
              style={styles.logoutButton}
              onPress={handleLogout}
            />
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <TouchableOpacity key={stat.label} style={styles.statItem}>
                <MaterialCommunityIcons name={stat.icon} size={24} color="#6C63FF" style={styles.statIcon} />
                <Text variant="headlineSmall" style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  {stat.label}
                </Text>
                {index < statsData.length - 1 && <View style={styles.statDivider} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Bio Section */}
          <Card style={styles.bioCard}>
            <View style={styles.bioCardContainer}>
              <Card.Content>
                <View style={styles.sectionTitleContainer}>
                  <MaterialCommunityIcons name="account-details" size={24} color="#333" />
                  <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
                  <View style={{ flex: 1 }} />
                  <IconButton
                    icon={isEditingBio ? "check" : "pencil"}
                    size={20}
                    onPress={isEditingBio ? handleBioSave : handleBioEdit}
                    loading={isSaving && isEditingBio}
                    disabled={isSaving}
                  />
                  {isEditingBio && (
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={handleBioCancel}
                      disabled={isSaving}
                    />
                  )}
                </View>
                
                {isEditingBio ? (
                  <TextInput
                    multiline
                    numberOfLines={4}
                    style={styles.bioTextInput}
                    value={editedBio}
                    onChangeText={setEditedBio}
                    placeholder="Describe yourself and your professional experience..."
                  />
                ) : (
                  <Text variant="bodyMedium" style={styles.bioText}>
                    {profile?.bio || 'Professional pet sitter with over 5 years of experience. Specialized in dog walking, pet sitting, and basic training. Certified in pet first aid and CPR.'}
                  </Text>
                )}
                
                <View style={styles.certificatesContainer}>
                </View>
              </Card.Content>
            </View>
          </Card>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="briefcase-outline" size={24} color="#333" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Services</Text>
              <View style={{ flex: 1 }} />
              
              {isEditingServices ? (
                <>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={addService}
                    disabled={isSaving}
                  />
                  <IconButton
                    icon="check"
                    size={20}
                    onPress={handleServicesSave}
                    loading={isSaving && isEditingServices}
                    disabled={isSaving}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={handleServicesCancel}
                    disabled={isSaving}
                  />
                </>
              ) : (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={handleServicesEdit}
                />
              )}
            </View>
            
            {isEditingServices ? (
              <View style={styles.editServicesContainer}>
                {editedServices.map((service, index) => (
                  <Card key={index} style={styles.serviceCardEditing}>
                    <View style={styles.serviceEditContainer}>
                      <Card.Content>
                        <View style={styles.serviceEditHeader}>
                          <View style={styles.serviceIconContainer}>
                            <MaterialCommunityIcons name={service.icon as any} size={24} color="#fff" />
                          </View>
                          <View style={styles.serviceEditInfo}>
                            <Text variant="titleSmall" style={styles.serviceEditName}>{service.name}</Text>
                          </View>
                          <View style={styles.serviceEditActions}>
                            <IconButton
                              icon="pencil"
                              size={16}
                              mode="contained-tonal"
                              containerColor="rgba(108, 99, 255, 0.1)"
                              iconColor="#6C63FF"
                              onPress={() => editService(index)}
                            />
                            <IconButton
                              icon="delete"
                              size={16}
                              mode="contained-tonal"
                              containerColor="rgba(244, 67, 54, 0.1)"
                              iconColor="#F44336"
                              onPress={() => deleteService(index)}
                            />
                          </View>
                        </View>
                      </Card.Content>
                    </View>
                  </Card>
                ))}
                {editedServices.length === 0 && (
                  <View style={styles.emptyServicesContainer}>
                    <MaterialCommunityIcons name="briefcase-outline" size={48} color="#CCCCCC" />
                    <Text variant="bodyLarge" style={styles.emptyServicesText}>No services yet</Text>
                    <Text variant="bodySmall" style={styles.emptyServicesSubtext}>Tap + to add your first service</Text>
                  </View>
                )}
              </View>
            ) : (
              services.length === 0 ? (
                <View style={styles.emptyServicesContainer}>
                  <MaterialCommunityIcons name="briefcase-outline" size={48} color="#CCCCCC" />
                  <Text variant="bodyLarge" style={styles.emptyServicesText}>No services yet</Text>
                  <Text variant="bodySmall" style={styles.emptyServicesSubtext}>Tap + to add your first service</Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.servicesScrollContent}
                >
                  {services.map((service, index) => (
                    <Card key={index} style={styles.serviceCardNew}>
                      <View style={styles.serviceCardContainer}>
                        <View style={styles.serviceCardContent}>
                          <View style={styles.serviceIconBadge}>
                            <MaterialCommunityIcons name={service.icon as any} size={24} color="#fff" />
                          </View>
                          <Text variant="titleMedium" style={styles.serviceTitle}>
                            {service.name}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </ScrollView>
              )
            )}
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="star-outline" size={24} color="#333" />
              <Text variant="titleMedium" style={styles.sectionTitle}>Recent Reviews</Text>
              <Text variant="bodyMedium" style={styles.reviewCount}>({reviews.length})</Text>
            </View>
            
            {reviewsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6C63FF" />
                <Text variant="bodyMedium" style={{ marginTop: 8, color: '#666' }}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsContainer}>
                <MaterialCommunityIcons name="star-outline" size={48} color="#CCCCCC" />
                <Text variant="bodyLarge" style={styles.emptyReviewsText}>No reviews yet</Text>
                <Text variant="bodySmall" style={styles.emptyReviewsSubtext}>Reviews from employers will appear here</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.reviewsScrollContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {reviews.map((review) => (
                  <Card key={review.id} style={styles.reviewCard}>
                    <View style={styles.cardContainer}>
                      <Card.Content>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewAuthorContainer}>
                            <Avatar.Text 
                              size={36} 
                              label={getInitials(review.employerName)} 
                              style={styles.reviewAvatar} 
                            />
                            <View>
                              <Text variant="titleSmall" style={styles.reviewAuthor}>
                                {review.employerName}
                              </Text>
                              <Text variant="bodySmall" style={styles.reviewDate}>
                                {formatReviewDate(review.reviewDate)}
                              </Text>
                              {review.projectTitle && (
                                <Text variant="bodySmall" style={styles.projectTitle}>
                                  Project: {review.projectTitle}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.reviewRating}>
                            <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                            <Text variant="bodyMedium">{review.rating}</Text>
                          </View>
                        </View>
                        {review.comment && (
                          <Text variant="bodyMedium" style={styles.reviewComment}>
                            {review.comment}
                          </Text>
                        )}
                      </Card.Content>
                    </View>
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      {renderImagePickerModal()}
      
      {/* Service Edit Modal */}
      {renderServiceModal()}
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
  logoutButton: {
    borderColor: '#F44336',
    marginLeft: 8,
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
  bioCardContainer: {
    overflow: 'hidden',
    borderRadius: 12,
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
    padding: 16,
    paddingBottom: 24,
    borderRadius: 16,
  },
  servicesScrollContent: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  serviceCardNew: {
    width: 200,
    height: 190,
    marginRight: 16,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#F7F7FF',
    ...Platform.select({
      ios: {
        shadowColor: '#5D5FEF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  serviceCardContainer: {
    overflow: 'hidden',
    borderRadius: 20,
    height: '100%',
  },
  serviceCardContent: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'flex-start',
    height: '100%',
    position: 'relative',
  },
  serviceIconBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 48,
    width: 48,
    borderBottomLeftRadius: 16,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    fontWeight: '600',
    marginTop: 50,
    marginBottom: 8,
    color: '#333',
    fontSize: 18,
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
    paddingBottom: 4,
  },
  currencySymbol: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 2,
  },
  servicePrice: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 18,
  },
  editServicesContainer: {
    width: '100%',
    marginBottom: 16,
  },
  serviceCardEditing: {
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
        elevation: 2,
      },
    }),
  },
  serviceEditContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  serviceEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEditInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceEditName: {
    fontWeight: '600',
    color: '#333',
  },
  serviceEditPrice: {
    color: '#6C63FF',
    marginTop: 2,
  },
  serviceEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyServicesContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
  },
  emptyServicesText: {
    color: '#888',
    marginTop: 12,
  },
  emptyServicesSubtext: {
    color: '#AAA',
    marginTop: 4,
  },
  modalTitle: {
    fontWeight: '600',
  },
  formLabel: {
    color: '#333',
    marginBottom: 8,
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  iconItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  selectedIconItem: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  modalButtonPrimary: {
    minWidth: 100,
    backgroundColor: '#6C63FF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  imageItem: {
    width: width / 3 - 8,
    height: width / 3 - 8,
    margin: 4,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceModalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  serviceForm: {
    marginVertical: 16,
  },
  serviceInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bioTextInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
    marginBottom: 12,
    color: '#666',
    backgroundColor: '#F8F9FF',
  },
  bioText: {
    lineHeight: 20,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  reviewCount: {
    color: '#666',
    marginLeft: 4,
  },
  reviewsScrollContainer: {
    maxHeight: 220,
    marginBottom: 8,
  },
  reviewCard: {
    marginTop: 4,
    marginBottom: 16,
    marginHorizontal: 4,
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
  cardContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    padding: 8,
    paddingTop: 16,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 80,
  },
  reviewsSection: {
    width: '100%',
    marginBottom: 24,
  },
  emptyReviewsContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
  },
  emptyReviewsText: {
    color: '#888',
    marginTop: 12,
  },
  emptyReviewsSubtext: {
    color: '#AAA',
    marginTop: 4,
  },
  projectTitle: {
    color: '#666',
    marginTop: 4,
  },
});

export default ProfileScreen; 