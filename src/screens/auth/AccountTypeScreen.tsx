import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccountType, AccountType as ApplicationAccountType } from '../../contexts/AccountTypeContext';
import { AccountType as AuthAccountType } from '../../contexts/AuthContext';
import { CompositeScreenParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<CompositeScreenParamList>;
  route: {
    params?: {
      flow: 'register' | 'login'
    };
  };
};

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

const AccountTypeScreen = ({ navigation, route }: Props) => {
  const { setAccountType } = useAccountType();
  const [selectedType, setSelectedType] = useState<ApplicationAccountType>('HIRING');
  const flow = route.params?.flow || 'register';

  const handleSelection = (type: ApplicationAccountType) => {
    setSelectedType(type);
  };
  
  const handleContinue = async () => {
    await setAccountType(selectedType);
    
    // Map application account type to auth account type
    const authAccountType: AuthAccountType = selectedType === 'HIRING' ? 'employer' : 'employee';
    
    // Navigate based on flow parameter
    if (flow === 'register') {
      navigation.navigate('Register', { accountType: authAccountType });
    } else {
      navigation.navigate('Login', { accountType: authAccountType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressDots currentStep={0} />
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Choose your account type
        </Text>

        <TouchableOpacity
          style={[
            styles.option,
            selectedType === 'HIRING' && styles.selectedOption,
          ]}
          onPress={() => handleSelection('HIRING')}
        >
          <View style={[
            styles.iconContainer,
            selectedType === 'HIRING' && styles.selectedIconContainer,
          ]}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={40}
              color={selectedType === 'HIRING' ? '#fff' : '#6C63FF'}
            />
          </View>
          <Text variant="titleLarge" style={[
            styles.optionTitle,
            selectedType === 'HIRING' && styles.selectedText,
          ]}>
            I want to hire
          </Text>
          <Text variant="bodyMedium" style={[
            styles.optionDescription,
            selectedType === 'HIRING' && styles.selectedText,
          ]}>
            Post jobs and hire talented professionals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedType === 'WORKING' && styles.selectedOption,
          ]}
          onPress={() => handleSelection('WORKING')}
        >
          <View style={[
            styles.iconContainer,
            selectedType === 'WORKING' && styles.selectedIconContainer,
          ]}>
            <MaterialCommunityIcons
              name="account-tie-outline"
              size={40}
              color={selectedType === 'WORKING' ? '#fff' : '#6C63FF'}
            />
          </View>
          <Text variant="titleLarge" style={[
            styles.optionTitle,
            selectedType === 'WORKING' && styles.selectedText,
          ]}>
            I want to work
          </Text>
          <Text variant="bodyMedium" style={[
            styles.optionDescription,
            selectedType === 'WORKING' && styles.selectedText,
          ]}>
            Find work and grow your career
          </Text>
        </TouchableOpacity>
        
        <Button 
          mode="contained"
          style={styles.continueButton}
          onPress={handleContinue}
        >
          Continue
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
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  option: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#6C63FF',
    borderColor: '#5952CC',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedIconContainer: {
    backgroundColor: '#5952CC',
  },
  optionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  optionDescription: {
    textAlign: 'center',
    color: '#666',
  },
  selectedText: {
    color: '#fff',
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
  continueButton: {
    marginTop: 20,
    backgroundColor: '#6C63FF',
  },
});

export default AccountTypeScreen; 