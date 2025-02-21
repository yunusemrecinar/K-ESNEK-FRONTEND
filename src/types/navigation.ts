import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: {
    email: string;
  };
  AccountType: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

export type MainStackParamList = {
  Home: undefined;
}; 