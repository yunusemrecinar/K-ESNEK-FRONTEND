import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, TextInput, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
}

const HiringProfileScreen = () => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
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

  const handleSave = () => {
    // Save profile changes
    setIsEditing(false);
  };

  const stats = [
    { label: 'Active Jobs', value: '12' },
    { label: 'Total Applications', value: '145' },
    { label: 'Hired', value: '8' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={{ uri: 'https://via.placeholder.com/100' }}
            />
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
});

export default HiringProfileScreen; 