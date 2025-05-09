import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAccountType } from '../contexts/AccountTypeContext';
import HiringNavigator from './HiringNavigator';
import WorkingNavigator from './WorkingNavigator';

export type MainStackParamList = {
  Category: { categoryId: string; title: string };
  Chat: { userId: string; userName: string; userImage: string };
  Applications: undefined;
  AllCategories: undefined;
  JobDetails: { jobId: number };
  SavedJobs: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  const { accountType } = useAccountType();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {accountType === 'HIRING' ? (
        <Stack.Screen name="HiringFlow" component={HiringNavigator} />
      ) : (
        <Stack.Screen name="WorkingFlow" component={WorkingNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator; 