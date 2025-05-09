import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompositeScreenParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { AccountType } from '../../contexts/AuthContext';
import { RegisterEmployeeRequest, RegisterEmployerRequest } from '../../services/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TOTAL_STEPS = 3;

const ProgressDots: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  return (
    <View style={styles.progressDotsContainer}>
      {Array(TOTAL_STEPS).fill(0).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index <= currentStep ? styles.progressDotFilled : null,
          ]}
        />
      ))}
    </View>
  );
};

type Props = {
  navigation: NativeStackNavigationProp<CompositeScreenParamList>;
  route: {
    params?: {
      accountType?: AccountType;
    };
  };
};

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  
  // Employee specific fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Employer specific fields
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { registerEmployee, registerEmployer, error: authError } = useAuth();
  
  const accountType = route.params?.accountType || 'employee';
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate common fields
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate account-specific fields
    if (accountType === 'employee' && (!firstName || !lastName)) {
      setError('Please fill in your first and last name');
      return;
    }
    
    if (accountType === 'employer' && (!companyName || !description || !industry)) {
      setError('Please fill in all company information');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (accountType === 'employee') {
        const employeeData: RegisterEmployeeRequest = {
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          location: location || undefined,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          language: 'en', // Default language
          immediate: false, // Default - not immediately available
          startDate: new Date().toISOString().split('T')[0], // Default to today's date in ISO format
          preferredJobTypes: '', // Empty string by default
          preferredLocations: location || '' // Use the location if provided
        };
        
        // The user will use email as their userName for login
        success = await registerEmployee(employeeData);
      } else {
        const employerData: RegisterEmployerRequest = {
          email,
          password,
          name: companyName,
          description,
          industry,
          size: size || undefined,
          phoneNumber: phoneNumber || undefined,
          location: location || undefined,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        };
        
        // The user will use email as their userName for login
        success = await registerEmployer(employerData);
      }
      
      if (success) {
        // Store password temporarily for verification screen login
        await AsyncStorage.setItem('tempRegistrationPassword', password);
        
        // Navigate to email verification screen
        if (accountType === 'employer') {
          navigation.navigate('EmailVerification', { email, isEmployer: true });
        } else {
          navigation.navigate('EmailVerification', { email, isEmployer: false });
        }
      } else {
        setError(authError || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Extract more specific error message if available
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response && err.response.data) {
        // Try to get the specific error message from the response
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmployeeFields = () => (
    <>
      <TextInput
        mode="outlined"
        label="First Name *"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
      />
      
      <TextInput
        mode="outlined"
        label="Last Name *"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
      />
    </>
  );
  
  const renderEmployerFields = () => (
    <>
      <TextInput
        mode="outlined"
        label="Company Name *"
        value={companyName}
        onChangeText={setCompanyName}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
      />
      
      <TextInput
        mode="outlined"
        label="Description *"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
      />
      
      <TextInput
        mode="outlined"
        label="Industry *"
        value={industry}
        onChangeText={setIndustry}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
      />
      
      <TextInput
        mode="outlined"
        label="Company Size"
        value={size}
        onChangeText={setSize}
        style={styles.input}
        outlineColor="#6C63FF"
        activeOutlineColor="#6C63FF"
        placeholder="e.g. 1-10, 11-50, 51-200, 201+"
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <ProgressDots currentStep={0} />
            
            <View style={styles.header}>
              <MaterialCommunityIcons
                name="account-plus"
                size={80}
                color="#6C63FF"
              />
              <Text variant="headlineMedium" style={styles.title}>
                Create {accountType === 'employee' ? 'Employee' : 'Employer'} Account
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Join our community today
              </Text>
            </View>

            <View style={styles.form}>
              {accountType === 'employee' ? renderEmployeeFields() : renderEmployerFields()}

              <TextInput
                mode="outlined"
                label="Email * (will be used for login)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor="#6C63FF"
                activeOutlineColor="#6C63FF"
              />
              
              <TextInput
                mode="outlined"
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                style={styles.input}
                outlineColor="#6C63FF"
                activeOutlineColor="#6C63FF"
              />
              
              <TextInput
                mode="outlined"
                label="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                outlineColor="#6C63FF"
                activeOutlineColor="#6C63FF"
                placeholder="City, Country"
              />

              <TextInput
                mode="outlined"
                label="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineColor="#6C63FF"
                activeOutlineColor="#6C63FF"
              />

              <TextInput
                mode="outlined"
                label="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                outlineColor="#6C63FF"
                activeOutlineColor="#6C63FF"
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Sign up'
                )}
              </Button>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Login', { accountType })}
          >
            Log in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  registerButton: {
    backgroundColor: '#6C63FF',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 20,
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotFilled: {
    backgroundColor: '#6C63FF',
  },
});

export default RegisterScreen; 