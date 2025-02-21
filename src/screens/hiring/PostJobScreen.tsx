import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface JobPost {
  title: string;
  description: string;
  type: 'full-time' | 'part-time' | 'contract';
  location: string;
  salary: string;
  skills: string[];
}

const PostJobScreen = () => {
  const theme = useTheme();
  const [jobPost, setJobPost] = useState<JobPost>({
    title: '',
    description: '',
    type: 'full-time',
    location: '',
    salary: '',
    skills: [],
  });
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !jobPost.skills.includes(newSkill.trim())) {
      setJobPost({
        ...jobPost,
        skills: [...jobPost.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setJobPost({
      ...jobPost,
      skills: jobPost.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = () => {
    // Handle job post submission
    console.log('Job Post:', jobPost);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Post a New Job
        </Text>

        <TextInput
          label="Job Title"
          value={jobPost.title}
          onChangeText={(text) => setJobPost({ ...jobPost, title: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Job Description"
          value={jobPost.description}
          onChangeText={(text) => setJobPost({ ...jobPost, description: text })}
          style={styles.input}
          multiline
          numberOfLines={4}
          mode="outlined"
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Job Type
        </Text>
        <SegmentedButtons
          value={jobPost.type}
          onValueChange={(value) =>
            setJobPost({ ...jobPost, type: value as JobPost['type'] })
          }
          buttons={[
            { value: 'full-time', label: 'Full Time' },
            { value: 'part-time', label: 'Part Time' },
            { value: 'contract', label: 'Contract' },
          ]}
          style={styles.segmentedButton}
        />

        <TextInput
          label="Location"
          value={jobPost.location}
          onChangeText={(text) => setJobPost({ ...jobPost, location: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Salary Range"
          value={jobPost.salary}
          onChangeText={(text) => setJobPost({ ...jobPost, salary: text })}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., $50,000 - $70,000"
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Required Skills
        </Text>
        <View style={styles.skillsContainer}>
          {jobPost.skills.map((skill) => (
            <Chip
              key={skill}
              onClose={() => handleRemoveSkill(skill)}
              style={styles.chip}
            >
              {skill}
            </Chip>
          ))}
        </View>
        <View style={styles.addSkillContainer}>
          <TextInput
            label="Add Skill"
            value={newSkill}
            onChangeText={setNewSkill}
            style={styles.skillInput}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleAddSkill} style={styles.addButton}>
            Add
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Post Job
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
  segmentedButton: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  addSkillContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  skillInput: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default PostJobScreen; 