import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const PrivacyPolicyScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Privacy Policy
        </Text>
        <View style={{ width: 48 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          1. Information We Collect
        </Text>
        <Text style={styles.paragraph}>
          1.1. Personal Information:{'\n'}
          • Name and contact information{'\n'}
          • Profile information{'\n'}
          • Payment information{'\n'}
          • Communication data
        </Text>
        <Text style={styles.paragraph}>
          1.2. Usage Information:{'\n'}
          • Device information{'\n'}
          • Log data{'\n'}
          • Location data{'\n'}
          • Cookies and similar technologies
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          2. How We Use Your Information
        </Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n'}
          • Provide and improve our services{'\n'}
          • Process payments{'\n'}
          • Communicate with you{'\n'}
          • Ensure platform security{'\n'}
          • Comply with legal obligations
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          3. Information Sharing
        </Text>
        <Text style={styles.paragraph}>
          We may share your information with:{'\n'}
          • Other users (as necessary for service delivery){'\n'}
          • Service providers{'\n'}
          • Legal authorities (when required by law)
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          4. Data Security
        </Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          5. Your Rights
        </Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Request data deletion{'\n'}
          • Object to data processing{'\n'}
          • Data portability
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          6. Data Retention
        </Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          7. Children's Privacy
        </Text>
        <Text style={styles.paragraph}>
          Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          8. Changes to Privacy Policy
        </Text>
        <Text style={styles.paragraph}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </Text>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          9. Contact Us
        </Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at privacy@kariyerimesnek.com
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
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

export default PrivacyPolicyScreen; 