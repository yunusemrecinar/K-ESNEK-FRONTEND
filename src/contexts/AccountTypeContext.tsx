import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccountType = 'HIRING' | 'WORKING';

interface AccountTypeContextType {
  accountType: AccountType | null;
  setAccountType: (type: AccountType) => Promise<void>;
}

const AccountTypeContext = createContext<AccountTypeContextType | undefined>(undefined);

export const AccountTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accountType, setAccountTypeState] = useState<AccountType>('HIRING'); // Set default to HIRING

  useEffect(() => {
    // Load account type from storage on mount
    const loadAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('accountType');
        // If no stored type, use default 'HIRING'
        setAccountTypeState(storedType as AccountType || 'HIRING');
      } catch (error) {
        console.error('Error loading account type:', error);
        // If error loading, fallback to default 'HIRING'
        setAccountTypeState('HIRING');
      }
    };
    loadAccountType();
  }, []);

  const setAccountType = async (type: AccountType) => {
    try {
      await AsyncStorage.setItem('accountType', type);
      setAccountTypeState(type);
    } catch (error) {
      console.error('Error saving account type:', error);
    }
  };

  return (
    <AccountTypeContext.Provider value={{ accountType, setAccountType }}>
      {children}
    </AccountTypeContext.Provider>
  );
};

export const useAccountType = () => {
  const context = useContext(AccountTypeContext);
  if (context === undefined) {
    throw new Error('useAccountType must be used within an AccountTypeProvider');
  }
  return context;
}; 