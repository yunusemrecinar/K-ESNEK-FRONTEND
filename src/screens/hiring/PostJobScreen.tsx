import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, findNodeHandle, Dimensions, StatusBar, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons, Chip, ActivityIndicator, HelperText, Menu, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { jobsApi, CreateJobRequest, JobCategory, JobRequirement, JobResponsibility, JobBenefit, JobSkill, categoriesApi } from '../../services/api/jobs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const locationTypes = [
  { label: 'Remote', value: 'Remote' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'On-site', value: 'On-site' },
];

const employmentTypes = [
  { label: 'Full Time', value: 'FullTime' },
  { label: 'Part Time', value: 'PartTime' },
  { label: 'Contract', value: 'Contract' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Internship', value: 'Internship' },
];

const experienceLevels = [
  { label: 'Entry Level', value: 'EntryLevel' },
  { label: 'Mid Level', value: 'MidLevel' },
  { label: 'Senior Level', value: 'SeniorLevel' },
  { label: 'Executive', value: 'Executive' },
];

const educationLevels = [
  { label: 'High School', value: 'HighSchool' },
  { label: 'Associate', value: 'Associate' },
  { label: 'Bachelor', value: 'Bachelor' },
  { label: 'Master', value: 'Master' },
  { label: 'Doctorate', value: 'Doctorate' },
  { label: 'No Requirement', value: 'None' },
];

interface FormErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  minSalary?: string;
  maxSalary?: string;
}

// Define menu position type
interface MenuPosition {
  x: number;
  y: number;
}

// Define route params type
type PostJobRouteProp = RouteProp<{
  PostJob: { 
    jobId?: number;
    isEditing?: boolean;
    jobData?: any;
  };
}, 'PostJob'>;

const PostJobScreen = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const route = useRoute<PostJobRouteProp>();
  
  // Check if we're in edit mode
  const [isEditing, setIsEditing] = useState(route.params?.isEditing || false);
  const [editJobId, setEditJobId] = useState(route.params?.jobId);
  const [initialJobData, setInitialJobData] = useState(route.params?.jobData);
  
  // This effect will run when the screen comes into focus with new params
  useFocusEffect(
    React.useCallback(() => {
      // Update state when new params are passed
      if (route.params?.isEditing) {
        setIsEditing(route.params.isEditing);
        setEditJobId(route.params.jobId);
        setInitialJobData(route.params.jobData);
        
        // Reset the form if we're coming from an edit operation
        if (route.params.jobData) {
          initializeFormWithData(route.params.jobData);
        }
        
        // Clear params after processing to avoid unwanted re-renders
        // We need to do this in a setTimeout to avoid the infinite loop
        const timer = setTimeout(() => {
          // @ts-ignore - TypeScript is being strict about param types
          navigation.setParams({
            isEditing: undefined,
            jobId: undefined,
            jobData: undefined
          });
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [route.params?.jobId]) // Only re-run if the jobId changes
  );
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [locationTypeMenuVisible, setLocationTypeMenuVisible] = useState(false);
  const [employmentTypeMenuVisible, setEmploymentTypeMenuVisible] = useState(false);
  const [experienceLevelMenuVisible, setExperienceLevelMenuVisible] = useState(false);
  const [educationLevelMenuVisible, setEducationLevelMenuVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize form state with default values
  const [jobPost, setJobPost] = useState<Partial<CreateJobRequest>>({
    title: '',
    description: '',
    categoryId: 0,
    jobLocationType: 'Remote',
    address: '',
    city: '',
    country: '',
    currency: 'USD',
    minSalary: 0,
    maxSalary: 0,
    jobRequirements: [],
    jobResponsibilities: [],
    jobBenefits: [],
    jobSkills: [],
    employmentType: 'FullTime',
    experienceLevel: 'EntryLevel',
    educationLevel: 'Bachelor',
    jobStatus: 'Active',
    applicationDeadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });
  
  // Function to initialize the form with job data - make it stable with useCallback
  const initializeFormWithData = React.useCallback((data: any) => {
    if (!data) return;
    
    // Convert date string to Date object if needed
    const applicationDeadline = data.applicationDeadline 
      ? new Date(data.applicationDeadline) 
      : new Date(new Date().setMonth(new Date().getMonth() + 1));
      
    setJobPost({
      title: data.title || '',
      description: data.description || '',
      categoryId: data.categoryId || 0,
      jobLocationType: data.jobLocationType || 'Remote',
      address: data.address || '',
      city: data.city || '',
      country: data.country || '',
      currency: data.currency || 'USD',
      minSalary: data.minSalary || 0,
      maxSalary: data.maxSalary || 0,
      jobRequirements: data.jobRequirements || [],
      jobResponsibilities: data.jobResponsibilities || [],
      jobBenefits: data.jobBenefits || [],
      jobSkills: data.jobSkills || [],
      employmentType: data.employmentType || 'FullTime',
      experienceLevel: data.experienceLevel || 'EntryLevel',
      educationLevel: data.educationLevel || 'Bachelor',
      jobStatus: data.jobStatus || 'Active',
      applicationDeadline,
    });
  }, []);
  
  // Initialize form if in edit mode with initial data
  useEffect(() => {
    if (isEditing && initialJobData) {
      initializeFormWithData(initialJobData);
    }
  }, []);

  // Input states for array fields
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Refs for dropdown buttons
  const categoryButtonRef = useRef(null);
  const locationButtonRef = useRef(null);
  const employmentButtonRef = useRef(null);
  const experienceButtonRef = useRef(null);
  const educationButtonRef = useRef(null);
  
  // Menu position states
  const [categoryMenuPosition, setCategoryMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [locationMenuPosition, setLocationMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [employmentMenuPosition, setEmploymentMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [experienceMenuPosition, setExperienceMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [educationMenuPosition, setEducationMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAllCategories();
        if (response.isSuccess) {
          setCategories(response.data);
          if (response.data.length > 0) {
            setJobPost(prev => ({ ...prev, categoryId: response.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        Alert.alert('Error', 'Failed to load job categories');
      }
    };

    fetchCategories();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!jobPost.title?.trim()) {
      newErrors.title = 'Job title is required';
    } else if (jobPost.title.length < 2) {
      newErrors.title = 'Job title must be at least 2 characters long';
    }
    
    if (!jobPost.description?.trim()) {
      newErrors.description = 'Job description is required';
    } else if (jobPost.description.length < 10) {
      newErrors.description = 'Job description must be at least 10 characters long';
    }
    
    if (!jobPost.categoryId || jobPost.categoryId <= 0) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (jobPost.minSalary === undefined || jobPost.minSalary <= 0) {
      newErrors.minSalary = 'Minimum salary must be greater than zero';
    }
    
    if (jobPost.maxSalary === undefined || jobPost.maxSalary <= 0) {
      newErrors.maxSalary = 'Maximum salary must be greater than zero';
    } else if (jobPost.minSalary !== undefined && jobPost.maxSalary < jobPost.minSalary) {
      newErrors.maxSalary = 'Maximum salary must be greater than minimum salary';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle array field additions
  const handleAddRequirement = () => {
    if (newRequirement.trim() && 
        !jobPost.jobRequirements?.some(r => r.requirement === newRequirement.trim())) {
      setJobPost({
        ...jobPost,
        jobRequirements: [...(jobPost.jobRequirements || []), { requirement: newRequirement.trim() }],
      });
      setNewRequirement('');
    }
  };

  const handleAddResponsibility = () => {
    if (newResponsibility.trim() && 
        !jobPost.jobResponsibilities?.some(r => r.responsibility === newResponsibility.trim())) {
      setJobPost({
        ...jobPost,
        jobResponsibilities: [...(jobPost.jobResponsibilities || []), { responsibility: newResponsibility.trim() }],
      });
      setNewResponsibility('');
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && 
        !jobPost.jobBenefits?.some(b => b.benefit === newBenefit.trim())) {
      setJobPost({
        ...jobPost,
        jobBenefits: [...(jobPost.jobBenefits || []), { benefit: newBenefit.trim() }],
      });
      setNewBenefit('');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && 
        !jobPost.jobSkills?.some(s => s.skill === newSkill.trim())) {
      setJobPost({
        ...jobPost,
        jobSkills: [...(jobPost.jobSkills || []), { skill: newSkill.trim() }],
      });
      setNewSkill('');
    }
  };

  // Handle removals
  const handleRemoveRequirement = (index: number) => {
    setJobPost({
      ...jobPost,
      jobRequirements: jobPost.jobRequirements?.filter((_, i) => i !== index),
    });
  };

  const handleRemoveResponsibility = (index: number) => {
    setJobPost({
      ...jobPost,
      jobResponsibilities: jobPost.jobResponsibilities?.filter((_, i) => i !== index),
    });
  };

  const handleRemoveBenefit = (index: number) => {
    setJobPost({
      ...jobPost,
      jobBenefits: jobPost.jobBenefits?.filter((_, i) => i !== index),
    });
  };

  const handleRemoveSkill = (index: number) => {
    setJobPost({
      ...jobPost,
      jobSkills: jobPost.jobSkills?.filter((_, i) => i !== index),
    });
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || jobPost.applicationDeadline;
    setShowDatePicker(Platform.OS === 'ios');
    setJobPost({ ...jobPost, applicationDeadline: currentDate });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Ensure all required properties are properly formatted for the backend
      const jobRequest: Partial<CreateJobRequest> = {
        title: jobPost.title,
        description: jobPost.description,
        categoryId: jobPost.categoryId,
        jobLocationType: jobPost.jobLocationType,
        address: jobPost.address,
        city: jobPost.city,
        country: jobPost.country,
        currency: jobPost.currency,
        minSalary: jobPost.minSalary || 0,
        maxSalary: jobPost.maxSalary || 0,
        jobRequirements: jobPost.jobRequirements || [],
        jobResponsibilities: jobPost.jobResponsibilities || [],
        jobBenefits: jobPost.jobBenefits || [],
        jobSkills: jobPost.jobSkills || [],
        employmentType: jobPost.employmentType,
        experienceLevel: jobPost.experienceLevel,
        educationLevel: jobPost.educationLevel,
        jobStatus: jobPost.jobStatus,
        applicationDeadline: jobPost.applicationDeadline
      };

      let response;
      
      if (isEditing && editJobId) {
        // Update existing job
        response = await jobsApi.updateJob(editJobId, jobRequest);
        
        if (response.isSuccess) {
          Alert.alert('Success', 'Job updated successfully');
          navigation.goBack();
        } else {
          const errorMessage = response.message 
            ? `Error: ${response.message}` 
            : 'Failed to update job. Please check your input and try again.';
          
          Alert.alert('Error', errorMessage);
        }
      } else {
        // Create new job
        response = await jobsApi.createJob(jobRequest as CreateJobRequest);
        
        if (response.isSuccess) {
          Alert.alert('Success', 'Job posted successfully');
          navigation.goBack();
        } else {
          const errorMessage = response.message 
            ? `Error: ${response.message}` 
            : 'Failed to create job. Please check your input and try again.';
          
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} job:`, error);
      
      // Error handling
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Find selected category name
  const selectedCategory = categories.find(c => c.id === jobPost.categoryId);

  // Function to measure button position and show menu
  const showMenu = (
    ref: React.RefObject<any>,
    setMenuVisible: React.Dispatch<React.SetStateAction<boolean>>,
    setMenuPosition: React.Dispatch<React.SetStateAction<MenuPosition>>
  ) => {
    if (ref.current) {
      ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        const windowHeight = Dimensions.get('window').height;
        const windowWidth = Dimensions.get('window').width;
        
        // Calculate screen constraints
        const spaceBelow = windowHeight - (y + height);
        const menuHeight = 300; // Estimated height of the menu
        
        // If there's not enough space below, position the menu above the button
        const yPos = (spaceBelow < menuHeight) && (y > menuHeight) 
          ? y - menuHeight 
          : y + height;
        
        setMenuPosition({ 
          x: x, 
          y: yPos
        });
        setMenuVisible(true);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="headlineMedium" style={styles.title}>
              {isEditing ? 'Edit Job' : 'Post a New Job'}
            </Text>
          </View>

          {/* Form Sections */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Basic Information
            </Text>

            {/* Basic Job Information */}
            <TextInput
              label="Job Title"
              value={jobPost.title}
              onChangeText={(text) => {
                setJobPost({ ...jobPost, title: text });
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              style={styles.input}
              mode="outlined"
              error={!!errors.title}
              outlineColor="#E0E0E0"
              activeOutlineColor="#5D56E0"
              left={<TextInput.Icon icon="briefcase-outline" color="#5D56E0" />}
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}

            <TextInput
              label="Job Description"
              value={jobPost.description}
              onChangeText={(text) => {
                setJobPost({ ...jobPost, description: text });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              style={styles.input}
              multiline
              numberOfLines={4}
              mode="outlined"
              error={!!errors.description}
              outlineColor="#E0E0E0"
              activeOutlineColor="#5D56E0"
              left={<TextInput.Icon icon="text-box-outline" color="#5D56E0" />}
            />
            {errors.description && <HelperText type="error">{errors.description}</HelperText>}
          </View>

          {/* Category Selector */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Job Category
            </Text>
            <View style={styles.dropdownContainer}>
              <Button 
                ref={categoryButtonRef}
                mode="outlined" 
                onPress={() => showMenu(categoryButtonRef, setCategoryMenuVisible, setCategoryMenuPosition)}
                style={[styles.dropdown, errors.categoryId ? styles.errorBorder : undefined]} 
                contentStyle={styles.dropdownContent}
                icon="folder-outline"
              >
                {selectedCategory?.name || 'Select Category'}
              </Button>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={{ x: categoryMenuPosition.x, y: categoryMenuPosition.y }}
                style={styles.menu}
                contentStyle={styles.menuContent}
              >
                <ScrollView style={styles.menuScrollView}>
                  {categories.map((category) => (
                    <Menu.Item
                      key={category.id}
                      onPress={() => {
                        setJobPost({ ...jobPost, categoryId: category.id });
                        setCategoryMenuVisible(false);
                        if (errors.categoryId) setErrors({ ...errors, categoryId: undefined });
                      }}
                      title={category.name}
                    />
                  ))}
                </ScrollView>
              </Menu>
            </View>
            {errors.categoryId && <HelperText type="error">{errors.categoryId}</HelperText>}
          </View>

          {/* Location Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Location Details
            </Text>
            <View style={styles.dropdownContainer}>
              <Button 
                ref={locationButtonRef}
                mode="outlined" 
                onPress={() => showMenu(locationButtonRef, setLocationTypeMenuVisible, setLocationMenuPosition)}
                style={styles.dropdown} 
                contentStyle={styles.dropdownContent}
                icon="map-marker-outline"
              >
                {jobPost.jobLocationType || 'Select Location Type'}
              </Button>
              <Menu
                visible={locationTypeMenuVisible}
                onDismiss={() => setLocationTypeMenuVisible(false)}
                anchor={{ x: locationMenuPosition.x, y: locationMenuPosition.y }}
                style={styles.menu}
                contentStyle={styles.menuContent}
              >
                <ScrollView style={styles.menuScrollView}>
                  {locationTypes.map((type) => (
                    <Menu.Item
                      key={type.value}
                      onPress={() => {
                        setJobPost({ ...jobPost, jobLocationType: type.value });
                        setLocationTypeMenuVisible(false);
                      }}
                      title={type.label}
                    />
                  ))}
                </ScrollView>
              </Menu>
            </View>

            {/* Location fields */}
            {(jobPost.jobLocationType === 'On-site' || jobPost.jobLocationType === 'Hybrid') && (
              <View style={styles.locationFields}>
                <TextInput
                  label="Address"
                  value={jobPost.address}
                  onChangeText={(text) => setJobPost({ ...jobPost, address: text })}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#5D56E0"
                  left={<TextInput.Icon icon="home-outline" color="#5D56E0" />}
                />
                <View style={styles.rowContainer}>
                  <TextInput
                    label="City"
                    value={jobPost.city}
                    onChangeText={(text) => setJobPost({ ...jobPost, city: text })}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#5D56E0"
                    left={<TextInput.Icon icon="city" color="#5D56E0" />}
                  />
                  <TextInput
                    label="Country"
                    value={jobPost.country}
                    onChangeText={(text) => setJobPost({ ...jobPost, country: text })}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#5D56E0"
                    left={<TextInput.Icon icon="flag-outline" color="#5D56E0" />}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Salary Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Salary Information
            </Text>
            <View style={styles.rowContainer}>
              <TextInput
                label="Currency"
                value={jobPost.currency}
                onChangeText={(text) => setJobPost({ ...jobPost, currency: text })}
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                mode="outlined"
                placeholder="USD"
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
                left={<TextInput.Icon icon="currency-usd" color="#5D56E0" />}
              />
              <TextInput
                label="Min Salary"
                value={jobPost.minSalary?.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setJobPost({ ...jobPost, minSalary: value });
                  if (errors.minSalary) setErrors({ ...errors, minSalary: undefined });
                }}
                style={[styles.input, { flex: 2, marginRight: 8 }]}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.minSalary}
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
              />
              <TextInput
                label="Max Salary"
                value={jobPost.maxSalary?.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setJobPost({ ...jobPost, maxSalary: value });
                  if (errors.maxSalary) setErrors({ ...errors, maxSalary: undefined });
                }}
                style={[styles.input, { flex: 2 }]}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.maxSalary}
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
              />
            </View>
            {errors.minSalary && <HelperText type="error">{errors.minSalary}</HelperText>}
            {errors.maxSalary && <HelperText type="error">{errors.maxSalary}</HelperText>}
          </View>

          {/* Job Type Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Job Type & Qualifications
            </Text>
            
            {/* Employment type */}
            <Text variant="titleMedium" style={styles.subSectionTitle}>
              Employment Type
            </Text>
            <View style={styles.dropdownContainer}>
              <Button 
                ref={employmentButtonRef}
                mode="outlined" 
                onPress={() => showMenu(employmentButtonRef, setEmploymentTypeMenuVisible, setEmploymentMenuPosition)}
                style={styles.dropdown} 
                contentStyle={styles.dropdownContent}
                icon="account-clock-outline"
              >
                {employmentTypes.find(t => t.value === jobPost.employmentType)?.label || 'Select Employment Type'}
              </Button>
              <Menu
                visible={employmentTypeMenuVisible}
                onDismiss={() => setEmploymentTypeMenuVisible(false)}
                anchor={{ x: employmentMenuPosition.x, y: employmentMenuPosition.y }}
                style={styles.menu}
                contentStyle={styles.menuContent}
              >
                <ScrollView style={styles.menuScrollView}>
                  {employmentTypes.map((type) => (
                    <Menu.Item
                      key={type.value}
                      onPress={() => {
                        setJobPost({ ...jobPost, employmentType: type.value });
                        setEmploymentTypeMenuVisible(false);
                      }}
                      title={type.label}
                    />
                  ))}
                </ScrollView>
              </Menu>
            </View>

            {/* Experience and Education */}
            <View style={styles.rowContainer}>
              <View style={styles.halfInput}>
                <Text variant="titleMedium" style={styles.subSectionTitle}>
                  Experience Level
                </Text>
                <View style={styles.dropdownContainer}>
                  <Button 
                    ref={experienceButtonRef}
                    mode="outlined" 
                    onPress={() => showMenu(experienceButtonRef, setExperienceLevelMenuVisible, setExperienceMenuPosition)}
                    style={styles.dropdown} 
                    contentStyle={styles.dropdownContent}
                    icon="medal-outline"
                  >
                    {experienceLevels.find(e => e.value === jobPost.experienceLevel)?.label || 'Select'}
                  </Button>
                  <Menu
                    visible={experienceLevelMenuVisible}
                    onDismiss={() => setExperienceLevelMenuVisible(false)}
                    anchor={{ x: experienceMenuPosition.x, y: experienceMenuPosition.y }}
                    style={styles.menu}
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScrollView}>
                      {experienceLevels.map((level) => (
                        <Menu.Item
                          key={level.value}
                          onPress={() => {
                            setJobPost({ ...jobPost, experienceLevel: level.value });
                            setExperienceLevelMenuVisible(false);
                          }}
                          title={level.label}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>
              </View>
              
              <View style={styles.halfInput}>
                <Text variant="titleMedium" style={styles.subSectionTitle}>
                  Education Level
                </Text>
                <View style={styles.dropdownContainer}>
                  <Button 
                    ref={educationButtonRef}
                    mode="outlined" 
                    onPress={() => showMenu(educationButtonRef, setEducationLevelMenuVisible, setEducationMenuPosition)}
                    style={styles.dropdown} 
                    contentStyle={styles.dropdownContent}
                    icon="school-outline"
                  >
                    {educationLevels.find(e => e.value === jobPost.educationLevel)?.label || 'Select'}
                  </Button>
                  <Menu
                    visible={educationLevelMenuVisible}
                    onDismiss={() => setEducationLevelMenuVisible(false)}
                    anchor={{ x: educationMenuPosition.x, y: educationMenuPosition.y }}
                    style={styles.menu}
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.menuScrollView}>
                      {educationLevels.map((level) => (
                        <Menu.Item
                          key={level.value}
                          onPress={() => {
                            setJobPost({ ...jobPost, educationLevel: level.value });
                            setEducationLevelMenuVisible(false);
                          }}
                          title={level.label}
                        />
                      ))}
                    </ScrollView>
                  </Menu>
                </View>
              </View>
            </View>

            {/* Application Deadline */}
            <Text variant="titleMedium" style={styles.subSectionTitle}>
              Application Deadline
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              contentStyle={styles.dropdownContent}
              icon="calendar-outline"
            >
              {jobPost.applicationDeadline ? jobPost.applicationDeadline.toLocaleDateString() : 'Select Date'}
            </Button>
            {showDatePicker && (
              <DateTimePicker
                value={jobPost.applicationDeadline || new Date()}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Requirements Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Requirements & Qualifications
            </Text>
            <View style={styles.chipsContainer}>
              {jobPost.jobRequirements?.map((req, index) => (
                <Chip
                  key={`req-${index}`}
                  onClose={() => handleRemoveRequirement(index)}
                  style={styles.chip}
                  closeIconAccessibilityLabel="Remove requirement"
                  textStyle={styles.chipText}
                  elevated
                >
                  {req.requirement}
                </Chip>
              ))}
            </View>
            <View style={styles.rowContainer}>
              <TextInput
                label="New Requirement"
                value={newRequirement}
                onChangeText={setNewRequirement}
                style={[styles.input, { flex: 3 }]}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
                left={<TextInput.Icon icon="checkbox-marked-circle-outline" color="#5D56E0" />}
              />
              <Button
                mode="contained"
                onPress={handleAddRequirement}
                style={styles.addButton}
                buttonColor="#5D56E0"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Responsibilities Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Job Responsibilities
            </Text>
            <View style={styles.chipsContainer}>
              {jobPost.jobResponsibilities?.map((resp, index) => (
                <Chip
                  key={`resp-${index}`}
                  onClose={() => handleRemoveResponsibility(index)}
                  style={styles.chip}
                  closeIconAccessibilityLabel="Remove responsibility"
                  textStyle={styles.chipText}
                  elevated
                >
                  {resp.responsibility}
                </Chip>
              ))}
            </View>
            <View style={styles.rowContainer}>
              <TextInput
                label="New Responsibility"
                value={newResponsibility}
                onChangeText={setNewResponsibility}
                style={[styles.input, { flex: 3 }]}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
                left={<TextInput.Icon icon="format-list-checks" color="#5D56E0" />}
              />
              <Button
                mode="contained"
                onPress={handleAddResponsibility}
                style={styles.addButton}
                buttonColor="#5D56E0"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Job Benefits
            </Text>
            <View style={styles.chipsContainer}>
              {jobPost.jobBenefits?.map((benefit, index) => (
                <Chip
                  key={`benefit-${index}`}
                  onClose={() => handleRemoveBenefit(index)}
                  style={styles.chip}
                  closeIconAccessibilityLabel="Remove benefit"
                  textStyle={styles.chipText}
                  elevated
                >
                  {benefit.benefit}
                </Chip>
              ))}
            </View>
            <View style={styles.rowContainer}>
              <TextInput
                label="New Benefit"
                value={newBenefit}
                onChangeText={setNewBenefit}
                style={[styles.input, { flex: 3 }]}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
                left={<TextInput.Icon icon="gift-outline" color="#5D56E0" />}
              />
              <Button
                mode="contained"
                onPress={handleAddBenefit}
                style={styles.addButton}
                buttonColor="#5D56E0"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Skills Section */}
          <View style={styles.formCard}>
            <Text variant="titleLarge" style={styles.formSectionTitle}>
              Required Skills
            </Text>
            <View style={styles.chipsContainer}>
              {jobPost.jobSkills?.map((skill, index) => (
                <Chip
                  key={`skill-${index}`}
                  onClose={() => handleRemoveSkill(index)}
                  style={styles.chip}
                  closeIconAccessibilityLabel="Remove skill"
                  textStyle={styles.chipText}
                  elevated
                >
                  {skill.skill}
                </Chip>
              ))}
            </View>
            <View style={styles.rowContainer}>
              <TextInput
                label="New Skill"
                value={newSkill}
                onChangeText={setNewSkill}
                style={[styles.input, { flex: 3 }]}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor="#5D56E0"
                left={<TextInput.Icon icon="tools" color="#5D56E0" />}
              />
              <Button
                mode="contained"
                onPress={handleAddSkill}
                style={styles.addButton}
                buttonColor="#5D56E0"
              >
                Add
              </Button>
            </View>
          </View>

          {/* Submit Button */}
          <LinearGradient
            colors={['#6C63FF', '#5D56E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonContainer}
          >
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={loading}
              buttonColor="transparent"
              contentStyle={{height: 50}}
              labelStyle={styles.submitButtonLabel}
            >
              {loading ? 
                <ActivityIndicator color="white" size="small" /> : 
                isEditing ? 'Update Job' : 'Post Job'
              }
            </Button>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    color: '#5D56E0',
    flex: 1,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formSectionTitle: {
    fontWeight: '700',
    color: '#5D56E0',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 15,
  },
  dropdown: {
    width: '100%',
    justifyContent: 'space-between',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 4,
  },
  dropdownContent: {
    height: 50,
  },
  menu: {
    width: 300,
    maxWidth: '95%',
  },
  menuContent: {
    maxHeight: 250,
    padding: 0,
  },
  menuScrollView: {
    maxHeight: 250,
  },
  errorBorder: {
    borderColor: '#FF6B6B',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  dateButton: {
    width: '100%',
    marginBottom: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 4,
  },
  locationFields: {
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F5F0FF',
  },
  chipText: {
    color: '#5D56E0',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#5D56E0',
  },
  submitButtonContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0, 
      height: 4
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButton: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
  },
  submitButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default PostJobScreen;
