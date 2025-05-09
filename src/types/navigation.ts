import { NavigatorScreenParams } from '@react-navigation/native';
import { AccountType } from '../contexts/AuthContext';

// Main app navigation structure (top level)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth flow screens
export type AuthStackParamList = {
  Opening: undefined;
  Onboarding: undefined;
  AuthSelection: undefined;
  Login: {
    accountType?: AccountType;
  } | undefined;
  Register: {
    accountType?: AccountType;
  } | undefined;
  ForgotPassword: undefined;
  EmailVerification: {
    email: string;
    isEmployer?: boolean;
  };
  AccountType: {
    flow: 'login' | 'register';
  } | undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

// Main app screens after auth
export type MainStackParamList = {
  Home: undefined;
  HiringFlow: undefined;
  WorkingFlow: undefined;
};

// Composite type that includes all screens for easier type checking
export type CompositeScreenParamList = 
  RootStackParamList & 
  AuthStackParamList & 
  MainStackParamList; 