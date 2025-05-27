import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, Image, Linking } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, TextInput, Switch, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { fileService } from '../../services/api/files';
import { employerService } from '../../services/api/employer';
import { AuthContext } from '../../contexts/AuthContext';
import { EmployerProfile } from '../../types/profile';
import { useAuth } from '../../hooks/useAuth';
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeScreenParamList } from '../../types/navigation';

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

type Props = {
  navigation: NativeStackNavigationProp<CompositeScreenParamList>;
};

const HiringProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaLibraryAssets, setMediaLibraryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'profile'>('profile');
  
  console.log("Current user in AuthContext:", user);
  
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
      console.log("profileData", profileData, "userId", userId); 
      console.log("Website from API:", profileData.website);
      
      // Transform the API data to match our local profile structure
      setProfile({
        name: profileData.name || 'Company Name',
        description: profileData.description || 'Company Description',
        website: profileData.website || '',
        location: profileData.location || '',
        industry: profileData.industry || '',
        size: profileData.size || '',
        email: profileData.email || user?.email || '', // Fallback to user email if profile email is null
        phone: profileData.phoneNumber || '',
        notificationsEnabled: true, // Default value since this might not be part of the API
        profilePictureId: profileData.profilePictureId,
        profilePictureUrl: profileData.profilePictureUrl
      });

      console.log("Local profile after setting:", profile.website);
      
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
      } else if (profileData.profilePictureId) {
        // If we have an ID but no URL, construct the URL directly
        const directUrl = `http://165.22.90.212:8080/api/files/download/${profileData.profilePictureId}`;
        setProfilePicture(directUrl);
      } else {
        setProfilePicture(null);
      }
      
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (error.response) {
        console.error("Error response data:", JSON.stringify(error.response.data));
        console.error("Error response status:", error.response.status);
      }
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
    
    // Validate required fields
    if (!profile.name || !profile.description || !profile.industry || !profile.size) {
      Alert.alert('Missing Information', 'Please fill in all required company information fields.');
      return;
    }
    
    try {
      // Transform local profile structure to API structure
      const apiProfile = {
        EmployerId: parseInt(userId),
        FirstName: user?.fullName?.split(' ')[0] || 'First',
        LastName: user?.fullName?.split(' ')[1] || 'Last',
        PhoneNumber: profile.phone,
        Location: profile.location,
        Name: profile.name,
        Description: profile.description,
        Industry: profile.industry,
        Size: profile.size,
        Website: profile.website,
        // Email is not included as users shouldn't be able to change it
      };
      
      console.log('Saving profile with data:', JSON.stringify(apiProfile));
      console.log('Website being sent to API:', profile.website);
      
      // Save profile changes to the backend
      const updatedProfile = await employerService.updateEmployerProfile(userId, apiProfile);
      console.log('Profile update response:', JSON.stringify(updatedProfile));
      
      // Refresh profile data to ensure we have the latest
      await fetchProfileData();
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.response) {
        console.error("Error response data:", JSON.stringify(error.response.data));
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", JSON.stringify(error.response.headers));
      } else if (error.request) {
        console.error("Error request:", JSON.stringify(error.request));
      } else {
        console.error("Error message:", error.message);
      }
      Alert.alert('Error', `Failed to update profile: ${error.message || 'Unknown error'}`);
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
      {renderImagePickerModal()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
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
                          const freshUrl = `http://165.22.90.212:8080/api/files/download/${profile.profilePictureId}`;
                          setProfilePicture(freshUrl);
                        } else if (profilePicture?.includes('/api/files/download/')) {
                          // Try to extract ID from the URL and retry with fresh URL
                          const idMatch = profilePicture.match(/\/api\/files\/download\/(\d+)/);
                          if (idMatch && idMatch[1]) {
                            const freshUrl = `http://165.22.90.212:8080/api/files/download/${idMatch[1]}`;
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
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={24} color="#F44336" />
            </TouchableOpacity>
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
          <View style={styles.cardContainer}>
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
                    placeholder="www.yourcompany.com"
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
                    <TouchableOpacity 
                      onPress={() => {
                        if (profile.website) {
                          // Add https:// if not present
                          let url = profile.website;
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                          }
                          Linking.canOpenURL(url)
                            .then(supported => {
                              if (supported) {
                                return Linking.openURL(url);
                              }
                              Alert.alert('Error', 'Cannot open this URL');
                            })
                            .catch(err => {
                              console.error('Error opening URL:', err);
                              Alert.alert('Error', 'Cannot open this URL');
                            });
                        }
                      }}
                      disabled={!profile.website}
                    >
                      <Text style={[
                        styles.infoText, 
                        profile.website ? styles.linkText : null
                      ]}>
                        {profile.website || 'No website provided'}
                      </Text>
                    </TouchableOpacity>
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
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardContainer}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Contact Information
              </Text>
              {isEditing ? (
                <>
                  <TextInput
                    label="Email"
                    value={profile.email}
                    style={styles.input}
                    mode="outlined"
                    disabled={true}
                    right={<TextInput.Icon icon="lock" />}
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
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardContainer}>
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
          </View>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
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
  logoutButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
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
  cardContainer: {
    overflow: 'hidden',
    borderRadius: 8,
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
  linkText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
});

export default HiringProfileScreen; 