import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      email: string;
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
  const inputRefs = useRef<RNTextInput[]>([]);

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

  const handleVerify = () => {
    const verificationCode = code.join('');
    // Here you would typically verify the code with your API
    if (verificationCode.length === VERIFICATION_CODE_LENGTH) {
      navigation.navigate('AccountType');
    }
  };

  const handleResend = () => {
    // Here you would typically call your API to resend the code
  };

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
          disabled={code.some((digit) => !digit)}
        >
          Continue
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
});

export default EmailVerificationScreen; 