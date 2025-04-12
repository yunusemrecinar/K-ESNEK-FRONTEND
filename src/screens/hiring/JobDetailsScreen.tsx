import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Button, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/client';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

// Job interface based on backend JobDto
interface JobRequirement {
  requirement: string;
}

interface JobResponsibility {
  responsibility: string;
}

interface JobBenefit {
  benefit: string;
}

interface JobSkill {
  skill: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  employerId: number;
  categoryId: number;
  jobLocationType?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  minSalary: number;
  maxSalary: number;
  employmentType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  jobStatus?: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  applications?: Array<{id: number}>;
  jobRequirements?: JobRequirement[];
  jobResponsibilities?: JobResponsibility[];
  jobBenefits?: JobBenefit[];
  jobSkills?: JobSkill[];
}

// Define route params type
type JobDetailsRouteProp = RouteProp<{
  JobDetails: { jobId: number };
}, 'JobDetails'>;

const JobDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<JobDetailsRouteProp>();
  const { jobId } = route.params;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.instance.get(`/jobs/${jobId}`);
      
      if (response.data && response.data.success) {
        setJob(response.data.data);
      } else if (response.data) {
        setJob(response.data);
      } else {
        setError('Failed to fetch job details');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleEditJob = () => {
    // Navigate to job edit screen 
    // navigation.navigate('EditJob', { jobId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || 'Job not found'}</Text>
          <Button mode="contained" onPress={fetchJobDetails} style={styles.retryButton}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.goBackButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <Button 
            icon="arrow-left" 
            mode="text" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back to Jobs
          </Button>
        </View>

        {/* Job Status */}
        <Chip 
          style={[
            styles.statusChip, 
            { backgroundColor: job.jobStatus?.toLowerCase() === 'active' ? theme.colors.primary : theme.colors.error }
          ]}
          textStyle={{ color: '#fff' }}
        >
          {job.jobStatus?.toUpperCase() || 'DRAFT'}
        </Chip>

        {/* Job Title */}
        <Text variant="headlineMedium" style={styles.title}>
          {job.title}
        </Text>

        {/* Basic Details */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>Posted:</Text>
                <Text>{new Date(job.createdAt).toLocaleDateString()}</Text>
              </View>
              
              {job.applicationDeadline && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Deadline:</Text>
                  <Text>{new Date(job.applicationDeadline).toLocaleDateString()}</Text>
                </View>
              )}
              
              {job.jobLocationType && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Location Type:</Text>
                  <Text>{job.jobLocationType}</Text>
                </View>
              )}
              
              {job.city && job.country && (
                <View style={styles.detailRow}>
                  <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text>{job.city}, {job.country}</Text>
                </View>
              )}
              
              {job.employmentType && (
                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Employment Type:</Text>
                  <Text>{job.employmentType}</Text>
                </View>
              )}
              
              {job.experienceLevel && (
                <View style={styles.detailRow}>
                  <Ionicons name="trending-up-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Experience Level:</Text>
                  <Text>{job.experienceLevel}</Text>
                </View>
              )}
              
              {job.educationLevel && (
                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>Education Level:</Text>
                  <Text>{job.educationLevel}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>Salary Range:</Text>
                <Text>
                  {job.currency || '$'} {job.minSalary} - {job.maxSalary}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>Applicants:</Text>
                <Text>{job.applications?.length || 0}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Job Description */}
        <Card style={styles.card}>
          <Card.Title title="Job Description" />
          <Card.Content>
            <Text style={styles.description}>{job.description}</Text>
          </Card.Content>
        </Card>

        {/* Job Requirements */}
        {job.jobRequirements && job.jobRequirements.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Requirements" />
            <Card.Content>
              <View style={styles.listContainer}>
                {job.jobRequirements.map((req, index) => (
                  <View key={`req-${index}`} style={styles.listItem}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.listText}>{req.requirement}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Job Responsibilities */}
        {job.jobResponsibilities && job.jobResponsibilities.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Responsibilities" />
            <Card.Content>
              <View style={styles.listContainer}>
                {job.jobResponsibilities.map((resp, index) => (
                  <View key={`resp-${index}`} style={styles.listItem}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.listText}>{resp.responsibility}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Job Skills */}
        {job.jobSkills && job.jobSkills.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Skills" />
            <Card.Content>
              <View style={styles.chipsContainer}>
                {job.jobSkills.map((skill, index) => (
                  <Chip key={`skill-${index}`} style={styles.chip}>
                    {skill.skill}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Job Benefits */}
        {job.jobBenefits && job.jobBenefits.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Benefits" />
            <Card.Content>
              <View style={styles.listContainer}>
                {job.jobBenefits.map((benefit, index) => (
                  <View key={`benefit-${index}`} style={styles.listItem}>
                    <Ionicons name="gift-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.listText}>{benefit.benefit}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button 
            mode="outlined" 
            icon="pencil" 
            onPress={handleEditJob}
            style={styles.actionButton}
          >
            Edit Job
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
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginLeft: -8,
  },
  title: {
    fontWeight: 'bold',
    marginVertical: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  detailSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  description: {
    lineHeight: 22,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listText: {
    flex: 1,
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  retryButton: {
    marginVertical: 8,
  },
  goBackButton: {
    marginTop: 8,
  },
});

export default JobDetailsScreen; 