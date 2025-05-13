import React, { useState } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text, Button, Modal, Portal, TextInput, useTheme, HelperText } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { applicationsApi } from '../../services/api/applications';

interface JobApplicationModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  jobId: number;
  jobTitle: string;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
  jobId,
  jobTitle,
}) => {
  const theme = useTheme();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick resume file
  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedAsset = result.assets[0];
      setResumeFile(selectedAsset);
      setError(null);
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to select resume file');
    }
  };

  // Submit job application
  const handleSubmit = async () => {
    if (!resumeFile) {
      setError('Please select a resume file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Log file details for debugging
      console.log('Selected file:', {
        name: resumeFile.name,
        type: resumeFile.mimeType,
        uri: resumeFile.uri.substring(0, 50) + '...' // Truncate for log
      });
      
      // Append file to FormData using the exact property name 'File' expected by the backend
      // The property name must exactly match the C# model property (case-sensitive)
      formData.append('File', {
        uri: resumeFile.uri,
        type: resumeFile.mimeType || 'application/pdf',
        name: resumeFile.name || 'resume.pdf',
      } as any);
      
      // Upload the resume and apply for job
      const response = await applicationsApi.uploadResumeAndApply(
        jobId,
        formData,
        coverLetter.trim() || undefined
      );

      if (response.isSuccess) {
        onSuccess();
        onDismiss();
      } else {
        setError(response.message || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset the form when modal is dismissed
  const handleDismiss = () => {
    setCoverLetter('');
    setResumeFile(null);
    setError(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>
              Apply for Job
            </Text>
            <Text variant="titleMedium" style={styles.jobTitle}>
              {jobTitle}
            </Text>

            <View style={styles.resumeSection}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Resume/CV
              </Text>
              <View style={styles.resumePickerContainer}>
                <Button
                  mode="outlined"
                  icon="file-upload"
                  onPress={pickResume}
                  style={styles.resumePickerButton}
                >
                  {resumeFile ? 'Change Resume' : 'Upload Resume'}
                </Button>
                {resumeFile && (
                  <View style={styles.fileInfoContainer}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text variant="bodyMedium" style={styles.fileName} numberOfLines={1}>
                      {resumeFile.name}
                    </Text>
                  </View>
                )}
              </View>
              <HelperText type="info" visible={true}>
                Accepted formats: PDF, DOC, DOCX
              </HelperText>
            </View>

            <View style={styles.coverLetterSection}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Cover Letter (Optional)
              </Text>
              <TextInput
                mode="outlined"
                defaultValue={coverLetter}
                onChangeText={(text) => setCoverLetter(text)}
                multiline
                numberOfLines={6}
                placeholder="Tell the employer why you're a good fit for this position..."
                style={styles.coverLetterInput}
              />
            </View>

            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleDismiss}
                style={styles.button}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading || !resumeFile}
              >
                Submit Application
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  content: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobTitle: {
    opacity: 0.7,
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  resumeSection: {
    marginBottom: 16,
  },
  resumePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resumePickerButton: {
    marginRight: 12,
  },
  fileInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 8,
    flex: 1,
  },
  coverLetterSection: {
    marginBottom: 20,
  },
  coverLetterInput: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default JobApplicationModal; 