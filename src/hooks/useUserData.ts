import { useAuth } from './useAuth';
import { EmployeeData, EmployerData } from '../services/api/auth';

// Hook to provide typed access to the correct user data based on account type
export const useUserData = () => {
  const { accountType, employeeData, employerData } = useAuth();
  
  const isEmployee = accountType === 'employee';
  const isEmployer = accountType === 'employer';
  
  // Get the appropriate user data based on account type
  const userData = isEmployee ? employeeData : isEmployer ? employerData : null;
  
  return {
    isEmployee,
    isEmployer,
    employeeData,
    employerData,
    userData
  };
}; 