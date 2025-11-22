import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function TermsAndConditionsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and conditions</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.textContainer}>
          <Text style={styles.paragraph}>
            Please read these terms and conditions carefully before using Our Service.
          </Text>
          
          <Text style={styles.sectionTitle}>Interpretation and Definitions</Text>
          <Text style={styles.paragraph}>
            The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </Text>

          <Text style={styles.sectionTitle}>Definitions</Text>
          <Text style={styles.paragraph}>
            For the purposes of these Terms and Conditions:
          </Text>
          <Text style={styles.paragraph}>
            • Application means the software program provided by the Company downloaded by You on any electronic device, named ApexTrade
          </Text>
          <Text style={styles.paragraph}>
            • Company (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to ApexTrade.
          </Text>
          <Text style={styles.paragraph}>
            • Device means any device that can access the Service such as a computer, a cellphone or a digital tablet.
          </Text>
          <Text style={styles.paragraph}>
            • Service refers to the Application.
          </Text>
          <Text style={styles.paragraph}>
            • You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
          </Text>

          <Text style={styles.sectionTitle}>Acknowledgment</Text>
          <Text style={styles.paragraph}>
            These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
          </Text>
          <Text style={styles.paragraph}>
            Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
          </Text>
          <Text style={styles.paragraph}>
            By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  textContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
});
