import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, findNodeHandle, Dimensions } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons, Chip, ActivityIndicator, HelperText, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { jobsApi, CreateJobRequest, JobCategory, JobRequirement, JobResponsibility, JobBenefit, JobSkill, categoriesApi } from '../../services/api/jobs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

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

const PostJobScreen = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [locationTypeMenuVisible, setLocationTypeMenuVisible] = useState(false);
  const [employmentTypeMenuVisible, setEmploymentTypeMenuVisible] = useState(false);
  const [experienceLevelMenuVisible, setExperienceLevelMenuVisible] = useState(false);
  const [educationLevelMenuVisible, setEducationLevelMenuVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [jobPost, setJobPost] = useState<Partial<CreateJobRequest>>({
    employerId: parseInt(user?.id || '0'),
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
    
    if (!jobPost.title) {
      newErrors.title = 'Job title is required';
    }
    
    if (!jobPost.description) {
      newErrors.description = 'Job description is required';
    }
    
    if (!jobPost.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (jobPost.minSalary === undefined || jobPost.minSalary < 0) {
      newErrors.minSalary = 'Minimum salary must be a positive number';
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
      return;
    }

    setLoading(true);
    try {
      const response = await jobsApi.createJob(jobPost as CreateJobRequest);
      setLoading(false);
      
      if (response.isSuccess) {
        Alert.alert('Success', 'Job posted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to post job');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error posting job:', error);
      Alert.alert('Error', 'Failed to post job. Please try again.');
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
        const windowWidth = Dimensions.get('window').width;
        
        setMenuPosition({ 
          x: x, 
          y: y + height 
        });
        setMenuVisible(true);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Post a New Job
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
        />
        {errors.description && <HelperText type="error">{errors.description}</HelperText>}

        {/* Category Selector */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Category
        </Text>
        <View style={styles.dropdownContainer}>
          <Button 
            ref={categoryButtonRef}
            mode="outlined" 
            onPress={() => showMenu(categoryButtonRef, setCategoryMenuVisible, setCategoryMenuPosition)}
            style={[styles.dropdown, errors.categoryId ? styles.errorBorder : undefined]} 
          >
            {selectedCategory?.name || 'Select Category'}
          </Button>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={categoryMenuPosition}
            style={styles.menu}
          >
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
          </Menu>
        </View>
        {errors.categoryId && <HelperText type="error">{errors.categoryId}</HelperText>}

        {/* Location Type Selector */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Location Type
        </Text>
        <View style={styles.dropdownContainer}>
          <Button 
            ref={locationButtonRef}
            mode="outlined" 
            onPress={() => showMenu(locationButtonRef, setLocationTypeMenuVisible, setLocationMenuPosition)}
            style={styles.dropdown} 
          >
            {jobPost.jobLocationType || 'Select Location Type'}
          </Button>
          <Menu
            visible={locationTypeMenuVisible}
            onDismiss={() => setLocationTypeMenuVisible(false)}
            anchor={locationMenuPosition}
            style={styles.menu}
          >
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
          </Menu>
        </View>

        {/* Location fields */}
        {(jobPost.jobLocationType === 'On-site' || jobPost.jobLocationType === 'Hybrid') && (
          <>
            <TextInput
              label="Address"
              value={jobPost.address}
              onChangeText={(text) => setJobPost({ ...jobPost, address: text })}
              style={styles.input}
              mode="outlined"
            />
            <View style={styles.rowContainer}>
              <TextInput
                label="City"
                value={jobPost.city}
                onChangeText={(text) => setJobPost({ ...jobPost, city: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
              />
              <TextInput
                label="Country"
                value={jobPost.country}
                onChangeText={(text) => setJobPost({ ...jobPost, country: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
              />
            </View>
          </>
        )}

        {/* Salary */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
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
          />
        </View>
        {errors.minSalary && <HelperText type="error">{errors.minSalary}</HelperText>}
        {errors.maxSalary && <HelperText type="error">{errors.maxSalary}</HelperText>}

        {/* Employment type */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Employment Type
        </Text>
        <View style={styles.dropdownContainer}>
          <Button 
            ref={employmentButtonRef}
            mode="outlined" 
            onPress={() => showMenu(employmentButtonRef, setEmploymentTypeMenuVisible, setEmploymentMenuPosition)}
            style={styles.dropdown} 
          >
            {employmentTypes.find(t => t.value === jobPost.employmentType)?.label || 'Select Employment Type'}
          </Button>
          <Menu
            visible={employmentTypeMenuVisible}
            onDismiss={() => setEmploymentTypeMenuVisible(false)}
            anchor={employmentMenuPosition}
            style={styles.menu}
          >
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
          </Menu>
        </View>

        {/* Experience and Education */}
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Experience Level
            </Text>
            <View style={styles.dropdownContainer}>
              <Button 
                ref={experienceButtonRef}
                mode="outlined" 
                onPress={() => showMenu(experienceButtonRef, setExperienceLevelMenuVisible, setExperienceMenuPosition)}
                style={styles.dropdown} 
              >
                {experienceLevels.find(e => e.value === jobPost.experienceLevel)?.label || 'Select'}
              </Button>
              <Menu
                visible={experienceLevelMenuVisible}
                onDismiss={() => setExperienceLevelMenuVisible(false)}
                anchor={experienceMenuPosition}
                style={styles.menu}
              >
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
              </Menu>
            </View>
          </View>
          
          <View style={styles.halfInput}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Education Level
            </Text>
            <View style={styles.dropdownContainer}>
              <Button 
                ref={educationButtonRef}
                mode="outlined" 
                onPress={() => showMenu(educationButtonRef, setEducationLevelMenuVisible, setEducationMenuPosition)}
                style={styles.dropdown} 
              >
                {educationLevels.find(e => e.value === jobPost.educationLevel)?.label || 'Select'}
              </Button>
              <Menu
                visible={educationLevelMenuVisible}
                onDismiss={() => setEducationLevelMenuVisible(false)}
                anchor={educationMenuPosition}
                style={styles.menu}
              >
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
              </Menu>
            </View>
          </View>
        </View>

        {/* Application Deadline */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Application Deadline
        </Text>
        <Button 
          mode="outlined" 
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
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

        {/* Requirements */}
        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Requirements
        </Text>
        <View style={styles.chipsContainer}>
          {jobPost.jobRequirements?.map((req, index) => (
            <Chip
              key={`req-${index}`}
              onClose={() => handleRemoveRequirement(index)}
              style={styles.chip}
            >
              {req.requirement}
            </Chip>
          ))}
        </View>
        <View style={styles.addItemContainer}>
          <TextInput
            label="Add Requirement"
            value={newRequirement}
            onChangeText={setNewRequirement}
            style={styles.itemInput}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleAddRequirement} style={styles.addButton}>
            Add
          </Button>
        </View>

        {/* Responsibilities */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Responsibilities
        </Text>
        <View style={styles.chipsContainer}>
          {jobPost.jobResponsibilities?.map((resp, index) => (
            <Chip
              key={`resp-${index}`}
              onClose={() => handleRemoveResponsibility(index)}
              style={styles.chip}
            >
              {resp.responsibility}
            </Chip>
          ))}
        </View>
        <View style={styles.addItemContainer}>
          <TextInput
            label="Add Responsibility"
            value={newResponsibility}
            onChangeText={setNewResponsibility}
            style={styles.itemInput}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleAddResponsibility} style={styles.addButton}>
            Add
          </Button>
        </View>

        {/* Benefits */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Benefits
        </Text>
        <View style={styles.chipsContainer}>
          {jobPost.jobBenefits?.map((ben, index) => (
            <Chip
              key={`ben-${index}`}
              onClose={() => handleRemoveBenefit(index)}
              style={styles.chip}
            >
              {ben.benefit}
            </Chip>
          ))}
        </View>
        <View style={styles.addItemContainer}>
          <TextInput
            label="Add Benefit"
            value={newBenefit}
            onChangeText={setNewBenefit}
            style={styles.itemInput}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleAddBenefit} style={styles.addButton}>
            Add
          </Button>
        </View>

        {/* Skills */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Required Skills
        </Text>
        <View style={styles.chipsContainer}>
          {jobPost.jobSkills?.map((sk, index) => (
            <Chip
              key={`skill-${index}`}
              onClose={() => handleRemoveSkill(index)}
              style={styles.chip}
            >
              {sk.skill}
            </Chip>
          ))}
        </View>
        <View style={styles.addItemContainer}>
          <TextInput
            label="Add Skill"
            value={newSkill}
            onChangeText={setNewSkill}
            style={styles.itemInput}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleAddSkill} style={styles.addButton}>
            Add
          </Button>
        </View>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : 'Post Job'}
        </Button>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfInput: {
    width: '48%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  itemInput: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'center',
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    width: '100%',
  },
  menu: {
    minWidth: 200,
  },
  dateButton: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  errorBorder: {
    borderColor: 'red',
    borderWidth: 1,
  },
});

export default PostJobScreen; 