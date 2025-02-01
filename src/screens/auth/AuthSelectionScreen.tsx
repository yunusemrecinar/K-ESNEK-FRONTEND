import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const AuthSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.illustrationContainer}>
          <View style={[styles.iconBackground, { backgroundColor: '#6C63FF15' }]}>
            <MaterialCommunityIcons
              name="account-group"
              size={100}
              color="#6C63FF"
              style={styles.icon}
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome to Kariyerim Esnek
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Join our community of freelancers and clients
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={[styles.button, styles.loginButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Log in
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={[styles.button, styles.registerButton]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonLabel, styles.registerButtonLabel]}
          >
            Sign up
          </Button>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text 
            style={styles.link}
            onPress={() => navigation.navigate('TermsOfService')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text 
            style={styles.link}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            Privacy Policy
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    transform: [{ scale: 1.2 }],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  button: {
    marginVertical: 8,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#6C63FF',
  },
  registerButton: {
    borderColor: '#6C63FF',
  },
  registerButtonLabel: {
    color: '#6C63FF',
  },
  termsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  terms: {
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default AuthSelectionScreen; 