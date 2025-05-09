import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccountType } from '../../contexts/AccountTypeContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      email: string;
      isEmployer?: boolean;
    };
  };
};

const VERIFICATION_CODE_LENGTH = 6;

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

const EmailVerificationScreen = ({ navigation, route }: Props) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const inputRefs = useRef<RNTextInput[]>([]);
  const { login } = useAuth();
  const { setAccountType } = useAccountType();

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move to next input if there's a value
    if (text.length === 1 && index < VERIFICATION_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const verificationCode = code.join('');
      // In a real app, you would send the verification code to your backend
      // For now, we're simulating success with a short delay
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network request
      
      setIsVerified(true);
      
      // Store email for login process regardless of account type
      if (route.params.isEmployer) {
        await AsyncStorage.setItem('pendingEmployerEmail', route.params.email);
      } else {
        await AsyncStorage.setItem('pendingEmployeeEmail', route.params.email);
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Handle verification error
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Get the password from storage or use fallback
      const password = await getRegistrationPassword();
      let loginSuccess = false;
      
      if (route.params.isEmployer) {
        // Attempt to login with the email and password as employer
        loginSuccess = await login(route.params.email, password, 'employer');
        
        // Clean up sensitive data
        await AsyncStorage.removeItem('pendingEmployerEmail');
        
        if (loginSuccess) {
          // Set account type for the main app
          await setAccountType('HIRING');
          
          // Navigate to the Main stack
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          setLoginError('Employer login failed. Please try again or proceed to the next step.');
        }
      } else {
        // Attempt to login with the email and password as employee
        loginSuccess = await login(route.params.email, password, 'employee');
        
        // Clean up sensitive data
        await AsyncStorage.removeItem('pendingEmployeeEmail');
        
        if (loginSuccess) {
          // Set account type for the main app
          await setAccountType('WORKING');
          
          // Navigate to the Main stack
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          setLoginError('Employee login failed. Please try again or proceed to the next step.');
        }
      }
      
      // Clean up password regardless of account type and login success
      await AsyncStorage.removeItem('tempRegistrationPassword');
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    // Here you would typically call your API to resend the code
  };

  const getRegistrationPassword = async (): Promise<string> => {
    try {
      // In a real app, you'd have a more secure mechanism to handle this
      // This is just for demonstration purposes
      const storedPassword = await AsyncStorage.getItem('tempRegistrationPassword');
      return storedPassword || 'password'; // Fallback for demo
    } catch (error) {
      console.error('Error retrieving password:', error);
      return 'password'; // Fallback for demo
    }
  };

  if (isVerified) {
    return (
      <SafeAreaView style={styles.container}>
        <ProgressDots currentStep={1} />
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Verify your email
          </Text>
          <View style={styles.successContainer}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text variant="bodyLarge" style={styles.successText}>
              Your email address was successfully verified.
              {route.params.isEmployer 
                ? ' You can now continue as an employer.' 
                : ' You can now continue as an employee.'}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleContinue}
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size={20} />
            ) : (
              'Continue'
            )}
          </Button>
          
          {loginError && (
            <>
              <Text style={styles.errorText}>{loginError}</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('AccountType')}
                style={styles.secondaryButton}
              >
                {route.params.isEmployer ? 'Continue as Employer' : 'Continue as Employee'}
              </Button>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProgressDots currentStep={1} />
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Verify your email
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          We've sent the verification code to {route.params.email}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleVerify}
          style={styles.button}
          disabled={code.some((digit) => !digit) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size={20} />
          ) : (
            'Verify'
          )}
        </Button>

        <Button
          mode="text"
          onPress={handleResend}
          style={styles.resendButton}
          labelStyle={styles.resendButtonLabel}
        >
          Resend verification code
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 5,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    marginBottom: 20,
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonLabel: {
    color: '#6C63FF',
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
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkmark: {
    color: '#fff',
    fontSize: 40,
  },
  successText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    marginTop: 10,
  },
});

export default EmailVerificationScreen; 