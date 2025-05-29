import React, { createContext, useState, useCallback, useEffect } from 'react';
import { 
  authApi, 
  LoginResponse, 
  User,
  RegisterEmployeeRequest,
  RegisterEmployerRequest,
  EmployeeData,
  EmployerData
} from '../services/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApiClient } from '../services/api/client';
import { tokenUtils } from '../services/api/tokenUtils';
import { savedJobsApi, clearSavedJobsStorage } from '../services/api/savedJobs';
import { apiClient } from '../services/api/client';

export type AccountType = 'employee' | 'employer';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  accountType: AccountType | null;
  employeeData: EmployeeData | null;
  employerData: EmployerData | null;
  login: (email: string, password: string, accountType: AccountType) => Promise<boolean>;
  registerEmployee: (data: RegisterEmployeeRequest) => Promise<boolean>;
  registerEmployer: (data: RegisterEmployerRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [employerData, setEmployerData] = useState<EmployerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string, type: AccountType): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const loginFn = type === 'employee' ? authApi.loginEmployee : authApi.loginEmployer;
      const response = await loginFn(email, password);
      
      if (!response.flag) {
        setError(response.message || 'Login failed');
        return false;
      }
      
      if (!response.user) {
        response.user = {
          id: 'temp-id',
          email,
          fullName: email.split('@')[0]
        };
      }
      
      setUser(response.user);
      setToken(response.token);
      setAccountType(type);
      
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('accountType', type);
      
      // Handle employee-specific data
      if (type === 'employee' && response.employeeData) {
        setEmployeeData(response.employeeData);
        await AsyncStorage.setItem('employeeData', JSON.stringify(response.employeeData));
        
        try {
          await savedJobsApi.syncWithBackend();
        } catch (syncError) {
          console.error('Error syncing saved jobs after login:', syncError);
          // Continue even if sync fails - user will still be logged in
        }
      }
      
      // Handle employer-specific data
      if (type === 'employer' && response.employerData) {
        setEmployerData(response.employerData);
        await AsyncStorage.setItem('employerData', JSON.stringify(response.employerData));
      }
      
      return true;
    } catch (error) {
      setError('Login failed. Please check your credentials and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerEmployee = useCallback(async (data: RegisterEmployeeRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.registerEmployee(data);
      
      if (!response.flag) {
        setError(response.message || 'Registration failed');
        return false;
      }
      
      if (!response.user) {
        response.user = {
          id: 'temp-id',
          email: data.email,
          fullName: `${data.firstName} ${data.lastName}`.trim()
        };
      }
      
      setUser(response.user);
      setToken(response.token);
      setAccountType('employee');
      
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('accountType', 'employee');
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Try to get more specific error details
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        setError(error.response.data?.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerEmployer = useCallback(async (data: RegisterEmployerRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.registerEmployer(data);
      
      if (!response.flag) {
        setError(response.message || 'Registration failed');
        return false;
      }
      
      if (!response.user) {
        response.user = {
          id: 'temp-id',
          email: data.email,
          fullName: data.name
        };
      }
      
      setUser(response.user);
      setToken(response.token);
      setAccountType('employer');
      
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('accountType', 'employer');
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear all auth-related storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accountType');
      await AsyncStorage.removeItem('employeeData');
      await AsyncStorage.removeItem('employerData');
      
      // Clear saved jobs for the user
      await clearSavedJobsStorage();
      
      // Clear token from API client
      apiClient.clearAuthToken();
      
      // Reset state
      setUser(null);
      setToken(null);
      setAccountType(null);
      setEmployeeData(null);
      setEmployerData(null);
      setError(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedUser, storedToken, storedAccountType, storedEmployeeData, storedEmployerData] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('accountType'),
          AsyncStorage.getItem('employeeData'),
          AsyncStorage.getItem('employerData'),
        ]);

        if (storedUser && storedToken && storedAccountType) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setAccountType(storedAccountType as AccountType);
          
          // Load specific data based on account type
          if (storedAccountType === 'employee' && storedEmployeeData) {
            setEmployeeData(JSON.parse(storedEmployeeData));

            console.log("employeeData", employeeData);
            
            try {
              await savedJobsApi.syncWithBackend();
            } catch (syncError) {
              console.error('Error syncing saved jobs on app start:', syncError);
            }
          }
          
          if (storedAccountType === 'employer' && storedEmployerData) {
            setEmployerData(JSON.parse(storedEmployerData));
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };

    const handleAuthFailure = () => {
      logout();
    };

    tokenUtils.initialize(handleAuthFailure);
    
    initializeApiClient().then(() => {
      loadStoredData();
    });
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      accountType,
      employeeData,
      employerData,
      login, 
      registerEmployee,
      registerEmployer,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 