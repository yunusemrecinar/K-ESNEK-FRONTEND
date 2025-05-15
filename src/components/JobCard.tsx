import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, Chip, Badge, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EnhancedJobResponse } from '../utils/jobSearchUtils';
import { LinearGradient } from 'expo-linear-gradient';

interface JobCardProps {
  job: EnhancedJobResponse;
  onPress: (job: EnhancedJobResponse) => void;
  isRecommendation?: boolean;
  recommendationScore?: number;
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onPress, 
  isRecommendation = false,
  recommendationScore 
}) => {
  const theme = useTheme();
  
  // Format salary range
  const formatSalary = (min: number, max: number, currency: string = '$') => {
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  };

  // Format description to limit length
  const formatDescription = (description: string) => {
    return description.length > 100 
      ? `${description.substring(0, 100)}...` 
      : description;
  };
  
  // Format match score as percentage
  const formatMatchScore = (score?: number) => {
    if (!score) return "0%";
    return `${Math.round(score * 100)}%`;
  };

  // Get company display name
  const companyName = job.companyName || 'Company';
  
  // Generate match score display
  const matchScore = recommendationScore ? formatMatchScore(recommendationScore) : null;

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardContainer}>
        <Card 
          style={[
            styles.card,
            isRecommendation && styles.recommendedCard
          ]} 
          onPress={() => onPress(job)}
          mode="elevated"
        >
          {isRecommendation && (
            <View style={styles.gradientContainer}>
              <LinearGradient
                colors={['rgba(108, 99, 255, 0.08)', 'rgba(108, 99, 255, 0.01)']}
                style={styles.recommendedCardGradient}
              />
            </View>
          )}
          
          <Card.Content style={styles.cardContent}>
            {/* Company logo placeholder */}
            <View style={styles.logoContainer}>
              <Surface style={[
                styles.logoPlaceholder,
                isRecommendation && styles.recommendedLogoPlaceholder
              ]}>
                <Text style={styles.logoText}>{companyName.charAt(0).toUpperCase()}</Text>
              </Surface>
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.title}>{job.title}</Text>
                
                {isRecommendation && (
                  <View style={styles.recommendationContainer}>
                    <LinearGradient
                      colors={['#6C63FF', '#5A52D5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.recommendedBadgeContainer}
                    >
                      <Text style={styles.recommendedBadgeText}>Recommended</Text>
                    </LinearGradient>
                    
                    {matchScore && (
                      <LinearGradient
                        colors={['#FFECB3', '#FFE082']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.matchScoreContainer}
                      >
                        <MaterialCommunityIcons name="star" size={14} color="#FF8F00" />
                        <Text style={styles.matchScoreText}>{matchScore}</Text>
                      </LinearGradient>
                    )}
                  </View>
                )}
              </View>
              
              <Text variant="bodySmall" style={styles.companyName}>
                {companyName}
              </Text>
              
              {isRecommendation && (
                <Text variant="bodySmall" style={styles.matchText}>
                  Company: {job.companyName || `Generated Employer ${job.employerId || ""}`} | Match Score: {matchScore}
                </Text>
              )}
              
              <Text variant="bodyMedium" style={styles.description}>
                {formatDescription(job.description)}
              </Text>
              
              <View style={styles.detailsContainer}>
                {job.minSalary > 0 && job.maxSalary > 0 && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {formatSalary(job.minSalary, job.maxSalary, job.currency || '$')}
                    </Text>
                  </View>
                )}
                
                {job.city && job.country && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.detailText}>
                      {`${job.city}, ${job.country}`}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.tagsContainer}>
                {job.employmentType && (
                  <Chip
                    style={styles.tag}
                    textStyle={styles.tagText}
                    icon={() => <MaterialCommunityIcons name="briefcase-outline" size={16} color={theme.colors.primary} />}
                    elevation={1}
                  >
                    {job.employmentType}
                  </Chip>
                )}
                
                {job.experienceLevel && (
                  <Chip
                    style={styles.tag}
                    textStyle={styles.tagText}
                    icon={() => <MaterialCommunityIcons name="account-tie" size={16} color={theme.colors.primary} />}
                    elevation={1}
                  >
                    {job.experienceLevel}
                  </Chip>
                )}
              </View>
              
              {job.jobSkills && job.jobSkills.length > 0 && (
                <View style={styles.skillsContainer}>
                  {job.jobSkills.slice(0, 3).map((skill, index) => (
                    <Chip
                      key={index}
                      style={styles.skillChip}
                      textStyle={styles.skillText}
                      elevation={1}
                    >
                      {skill.skill}
                    </Chip>
                  ))}
                  {job.jobSkills.length > 3 && (
                    <Chip style={styles.moreSkillsChip} elevation={1}>
                      +{job.jobSkills.length - 3}
                    </Chip>
                  )}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  recommendedCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#6C63FF',
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  logoContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E8E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    fontSize: 18,
  },
  recommendationContainer: {
    alignItems: 'flex-end',
  },
  recommendedBadgeContainer: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  recommendedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchScoreContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  matchScoreText: {
    color: '#FF8F00',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  companyName: {
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  matchText: {
    color: '#555',
    marginBottom: 8,
    fontSize: 12,
  },
  description: {
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    color: '#444',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderWidth: 0.5,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 0.5,
  },
  skillText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  moreSkillsChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#EEEEEE',
  },
  recommendedCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  recommendedLogoPlaceholder: {
    backgroundColor: '#E6E4FF',
    borderColor: '#D1CFFF',
    borderWidth: 1,
  },
});

export default JobCard; 