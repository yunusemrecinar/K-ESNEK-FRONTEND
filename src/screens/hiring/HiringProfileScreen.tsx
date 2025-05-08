import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, Image } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, TextInput, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { fileService } from '../../services/api/files';
import { employerService } from '../../services/api/employer';
import { AuthContext } from '../../contexts/AuthContext';
import { EmployerProfile } from '../../types/profile';

interface CompanyProfile {
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  email: string;
  phone: string;
  notificationsEnabled: boolean;
  profilePictureId?: number;
  profilePictureUrl?: string;
}

const HiringProfileScreen = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaLibraryAssets, setMediaLibraryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'profile'>('profile');
  
  // Store the profile data
  const [profile, setProfile] = useState<CompanyProfile>({
    name: 'Acme Corporation',
    description: 'Leading technology company specializing in innovative solutions',
    website: 'www.acmecorp.com',
    location: 'San Francisco, CA',
    industry: 'Technology',
    size: '50-200 employees',
    email: 'hr@acmecorp.com',
    phone: '+1 (555) 123-4567',
    notificationsEnabled: true,
  });
  
  const userId = user?.id || '0';

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId || userId === '0') return;
    
    try {
      setIsLoading(true);
      const profileData = await employerService.getEmployerProfile(userId);
      
      console.log('Fetched employer profile data:', profileData);
      
      // Transform the API data to match our local profile structure
      setProfile({
        name: profileData.name || 'Company Name',
        description: profileData.description || 'Company Description',
        website: profileData.website || '',
        location: profileData.location || '',
        industry: profileData.industry || '',
        size: profileData.size || '',
        email: profileData.email || '',
        phone: profileData.phoneNumber || '',
        notificationsEnabled: true, // Default value since this might not be part of the API
        profilePictureId: profileData.profilePictureId,
        profilePictureUrl: profileData.profilePictureUrl
      });
      
      // Helper function to ensure URLs are accessible from mobile
      const makeUrlAccessible = (url: string | null | undefined): string | null => {
        if (!url) return null;
        
        // Replace localhost URLs with ngrok URL
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          return url.replace(/(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://1bc9-176-233-31-141.ngrok-free.app');
        }
        
        return url;
      };
      
      // Set profile picture URL if available
      if (profileData.profilePictureUrl) {
        const accessibleUrl = makeUrlAccessible(profileData.profilePictureUrl);
        console.log('Setting profile picture URL:', accessibleUrl);
        setProfilePicture(accessibleUrl);
      } else if (profileData.profilePictureId) {
        // If we have an ID but no URL, construct the URL directly
        const directUrl = `https://1bc9-176-233-31-141.ngrok-free.app/api/files/download/${profileData.profilePictureId}`;
        console.log('Constructing profile picture URL from ID:', directUrl);
        setProfilePicture(directUrl);
      } else {
        console.log('No profile picture URL or ID available');
        setProfilePicture(null);
      }
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || userId === '0') {
      Alert.alert('Error', 'User ID not found');
      return;
    }
    
    try {
      // Transform local profile structure to API structure
      const apiProfile = {
        EmployerId: parseInt(userId),
        firstName: user?.fullName?.split(' ')[0] || 'First',
        lastName: user?.fullName?.split(' ')[1] || 'Last',
        phoneNumber: profile.phone,
        location: profile.location,
        name: profile.name,
        description: profile.description,
        industry: profile.industry,
        size: profile.size,
        website: profile.website,
        email: profile.email,
      };
      
      // Save profile changes to the backend
      await employerService.updateEmployerProfile(userId, apiProfile);
      
      // Refresh profile data to ensure we have the latest
      await fetchProfileData();
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Failed to update profile');
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
      
      // Upload the profile picture
      const fileId = await fileService.uploadEmployerProfilePicture(parseInt(userId), formData);
      
      // Refresh profile data to ensure we have the latest file IDs
      await fetchProfileData();
      
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert('Upload Error', 'Could not upload image');
      setIsUploading(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    await loadMediaLibraryAssets();
  };
  
  const renderImagePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showImagePicker}
      onRequestClose={() => setShowImagePicker(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text variant="headlineSmall">Select a Photo</Text>
          <Button onPress={() => setShowImagePicker(false)}>Close</Button>
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

  const stats = [
    { label: 'Active Jobs', value: '12' },
    { label: 'Total Applications', value: '145' },
    { label: 'Hired', value: '8' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {renderImagePickerModal()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleProfilePictureUpload}>
              {isLoading ? (
                <Avatar.Icon 
                  size={100} 
                  icon="refresh"
                  color="#fff"
                  style={{backgroundColor: '#6C63FF'}}
                />
              ) : profilePicture ? (
                <>
                  <Avatar.Image
                    size={100}
                    source={{ uri: profilePicture }}
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
                        const freshUrl = `https://1bc9-176-233-31-141.ngrok-free.app/api/files/download/${profile.profilePictureId}`;
                        console.log('Retrying with URL:', freshUrl);
                        setProfilePicture(freshUrl);
                      } else if (profilePicture?.includes('/api/files/download/')) {
                        // Try to extract ID from the URL and retry with fresh URL
                        const idMatch = profilePicture.match(/\/api\/files\/download\/(\d+)/);
                        if (idMatch && idMatch[1]) {
                          const freshUrl = `https://1bc9-176-233-31-141.ngrok-free.app/api/files/download/${idMatch[1]}`;
                          console.log('Retrying with extracted ID URL:', freshUrl);
                          setProfilePicture(freshUrl);
                        }
                      }
                    }}
                    onLoadEnd={() => console.log('Finished loading profile picture attempt')}
                  />
                </>
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={profile.name.substring(0, 2).toUpperCase()}
                  style={{backgroundColor: '#6C63FF'}}
                />
              )}
              <View style={styles.profileImageOverlay}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>
            {!isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text variant="headlineMedium" style={styles.companyName}>
            {profile.name}
          </Text>
          <Text variant="bodyLarge" style={styles.location}>
            {profile.location}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stat.value}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Company Information
            </Text>
            {isEditing ? (
              <>
                <TextInput
                  label="Company Name"
                  value={profile.name}
                  onChangeText={(text) => setProfile({ ...profile, name: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Description"
                  value={profile.description}
                  onChangeText={(text) =>
                    setProfile({ ...profile, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Website"
                  value={profile.website}
                  onChangeText={(text) => setProfile({ ...profile, website: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Industry"
                  value={profile.industry}
                  onChangeText={(text) =>
                    setProfile({ ...profile, industry: text })
                  }
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Company Size"
                  value={profile.size}
                  onChangeText={(text) => setProfile({ ...profile, size: text })}
                  style={styles.input}
                  mode="outlined"
                />
              </>
            ) : (
              <>
                <Text style={styles.description}>{profile.description}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{profile.website}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{profile.industry}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="people-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{profile.size}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>
            {isEditing ? (
              <>
                <TextInput
                  label="Email"
                  value={profile.email}
                  onChangeText={(text) => setProfile({ ...profile, email: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Phone"
                  value={profile.phone}
                  onChangeText={(text) => setProfile({ ...profile, phone: text })}
                  style={styles.input}
                  mode="outlined"
                />
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{profile.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{profile.phone}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.settingRow}>
              <Text variant="titleMedium">Push Notifications</Text>
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(value) =>
                  setProfile({ ...profile, notificationsEnabled: value })
                }
              />
            </View>
          </Card.Content>
        </Card>

        {isEditing && (
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => setIsEditing(false)}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              Save Changes
            </Button>
          </View>
        )}
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  companyName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
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
    borderBottomColor: '#eee',
  },
  imageItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 2,
  },
  thumbnailImage: {
    flex: 1,
    borderRadius: 4,
  },
});

export default HiringProfileScreen; 