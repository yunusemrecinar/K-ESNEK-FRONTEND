import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

export const UserDataExample: React.FC = () => {
  const { user } = useAuth();
  const { isEmployee, isEmployer, employeeData, employerData } = useUserData();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>You need to be logged in to view this content.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>General User Info</Text>
        <Text style={styles.label}>ID: <Text style={styles.value}>{user.id}</Text></Text>
        <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
        <Text style={styles.label}>Full Name: <Text style={styles.value}>{user.fullName}</Text></Text>
      </View>

      {isEmployee && employeeData && (
        <View style={styles.section}>
          <Text style={styles.header}>Employee Specific Data</Text>
          <Text style={styles.label}>First Name: <Text style={styles.value}>{employeeData.firstName}</Text></Text>
          <Text style={styles.label}>Last Name: <Text style={styles.value}>{employeeData.lastName}</Text></Text>
          {employeeData.phoneNumber && (
            <Text style={styles.label}>Phone: <Text style={styles.value}>{employeeData.phoneNumber}</Text></Text>
          )}
          {employeeData.location && (
            <Text style={styles.label}>Location: <Text style={styles.value}>{employeeData.location}</Text></Text>
          )}
          {employeeData.preferredJobTypes && (
            <Text style={styles.label}>Preferred Jobs: <Text style={styles.value}>{employeeData.preferredJobTypes}</Text></Text>
          )}
        </View>
      )}

      {isEmployer && employerData && (
        <View style={styles.section}>
          <Text style={styles.header}>Employer Specific Data</Text>
          <Text style={styles.label}>Company Name: <Text style={styles.value}>{employerData.name}</Text></Text>
          <Text style={styles.label}>Industry: <Text style={styles.value}>{employerData.industry}</Text></Text>
          <Text style={styles.label}>Description: <Text style={styles.value}>{employerData.description}</Text></Text>
          {employerData.size && (
            <Text style={styles.label}>Company Size: <Text style={styles.value}>{employerData.size}</Text></Text>
          )}
          {employerData.phoneNumber && (
            <Text style={styles.label}>Phone: <Text style={styles.value}>{employerData.phoneNumber}</Text></Text>
          )}
          {employerData.location && (
            <Text style={styles.label}>Location: <Text style={styles.value}>{employerData.location}</Text></Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  value: {
    fontWeight: 'normal',
    color: '#333',
  },
}); 