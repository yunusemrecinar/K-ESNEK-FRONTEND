import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TermsOfServiceScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>
          Terms of Service
        </Text>
        <View style={{ width: 48 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          1. Acceptance of Terms
        </Text>
        <Text style={styles.paragraph}>
          By accessing and using Kariyerim Esnek, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </Text>

        <Text style={styles.sectionTitle}>
          2. User Accounts
        </Text>
        <Text style={styles.paragraph}>
          2.1. You must be at least 18 years old to create an account.{'\n'}
          2.2. You are responsible for maintaining the confidentiality of your account credentials.{'\n'}
          2.3. You agree to provide accurate and complete information during registration.
        </Text>

        <Text style={styles.sectionTitle}>
          3. Service Rules
        </Text>
        <Text style={styles.paragraph}>
          3.1. Users must not engage in any fraudulent or deceptive practices.{'\n'}
          3.2. Users must respect intellectual property rights.{'\n'}
          3.3. Users must not harass or abuse other users.{'\n'}
          3.4. Users must not use the platform for illegal activities.
        </Text>

        <Text style={styles.sectionTitle}>
          4. Payments and Fees
        </Text>
        <Text style={styles.paragraph}>
          4.1. We may charge fees for certain services.{'\n'}
          4.2. All payments are processed securely through our platform.{'\n'}
          4.3. Users agree to pay all applicable fees and taxes.
        </Text>

        <Text style={styles.sectionTitle}>
          5. Content
        </Text>
        <Text style={styles.paragraph}>
          5.1. Users retain ownership of their content.{'\n'}
          5.2. Users grant us a license to use and display their content.{'\n'}
          5.3. Users must not post inappropriate or illegal content.
        </Text>

        <Text style={styles.sectionTitle}>
          6. Termination
        </Text>
        <Text style={styles.paragraph}>
          We reserve the right to terminate or suspend accounts that violate these terms or for any other reason at our discretion.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Changes to Terms
        </Text>
        <Text style={styles.paragraph}>
          We may modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.
        </Text>

        <Text style={[styles.paragraph, styles.lastUpdated]}>
          Last updated: February 2024
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18, 
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 20,
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 16,
  },
  lastUpdated: {
    marginTop: 32,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TermsOfServiceScreen;
