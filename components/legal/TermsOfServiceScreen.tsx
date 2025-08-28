import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

// Terms of Service content for DESIST! app
const termsOfService = `
DESIST! Terms of Service

_Last updated: August 28, 2025_

These Terms of Service ("Terms") govern your use of the DESIST! mobile application ("App") operated by DESIST! ("we", "us", or "our"). By downloading, accessing, or using our App, you agree to be bound by these Terms.

---

## 1. Acceptance of Terms

By using DESIST!, you confirm that you:
- Are at least 13 years of age
- Have the legal capacity to enter into these Terms
- Agree to comply with all applicable laws and regulations

---

## 2. App Purpose and Usage

DESIST! is designed to:
- Allow users to report and document incidents
- Enhance community safety and awareness
- Provide security features and threat detection

**Permitted Uses:**
- Submit legitimate incident reports
- Use security features as intended
- Share information for safety purposes

**Prohibited Uses:**
- Submit false, misleading, or malicious reports
- Use the App for illegal activities
- Attempt to compromise App security
- Harass, threaten, or harm other users

---

## 3. User Content and Responsibilities

**Your Content:**
- You retain ownership of content you submit
- You grant us license to use your content for App functionality
- You are responsible for the accuracy of your submissions

**Content Standards:**
- Must be truthful and accurate
- Must not violate others' rights
- Must comply with applicable laws
- Must not contain harmful or offensive material

---

## 4. Privacy and Data Protection

Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference.

---

## 5. Security Features

DESIST! includes advanced security features:
- Rate limiting to prevent abuse
- CAPTCHA verification for human authentication
- Encryption for data protection
- Threat detection and monitoring

**Security Compliance:**
- You agree not to circumvent security measures
- You will report security vulnerabilities responsibly
- You understand that security features may limit usage

---

## 6. Incident Reporting

**Reporting Guidelines:**
- Reports should be factual and objective
- Include relevant details and evidence when possible
- Respect privacy of individuals involved
- Do not submit duplicate reports

**Report Processing:**
- We may review, moderate, or remove reports
- Reports may be shared with relevant authorities
- We are not responsible for actions taken based on reports

---

## 7. Disclaimers and Limitations

**Service Availability:**
- App may be unavailable due to maintenance or technical issues
- We do not guarantee continuous, uninterrupted service
- Features may be modified or discontinued

**Content Accuracy:**
- We do not verify the accuracy of user-submitted content
- Reports represent the views of individual users
- We are not responsible for decisions made based on App content

**Limitation of Liability:**
To the maximum extent permitted by law, DESIST! shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.

---

## 8. Intellectual Property

**Our Rights:**
- DESIST! and related trademarks are our property
- App design, features, and technology are protected by copyright
- You may not copy, modify, or distribute our intellectual property

**Your Rights:**
- You retain rights to your original content
- You may use the App according to these Terms
- Fair use of App content for safety purposes is permitted

---

## 9. Account Termination

We may suspend or terminate your access if you:
- Violate these Terms or our policies
- Engage in harmful or illegal activities
- Abuse App features or security measures
- Submit false or malicious reports

---

## 10. Updates and Changes

**App Updates:**
- We may update the App to improve functionality and security
- Updates may include new features or modifications
- Continued use constitutes acceptance of updates

**Terms Changes:**
- We may modify these Terms from time to time
- Changes will be posted in the App
- Significant changes will be notified to users

---

## 11. Governing Law and Disputes

These Terms are governed by the laws of the United States and the state where DESIST! is headquartered. Any disputes will be resolved through binding arbitration or in appropriate courts.

---

## 12. Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

---

## 13. Contact Information

For questions about these Terms of Service, please contact us at:
- Email: legal@wedesist.com
- Privacy questions: privacy@wedesist.com
- Security issues: security@wedesist.com

---

**By using DESIST!, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**
`;

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Terms of Service
        </Text>
        <Text style={styles.content}>
          {termsOfService}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 24,
  },
});
