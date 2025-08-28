import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

// Privacy policy content for DESIST! app
const privacyPolicy = `
DESIST! Privacy Policy

_Last updated: August 28, 2025_

This Privacy Policy describes how DESIST! ("we", "us", or "our") collects, uses, and protects your information when you use our mobile application (the "App"). This policy is intended for users located in the United States.

---

## 1. Information We Collect

- **Incident Reports:** Details you submit about incidents, including descriptions, attached media, and location data.
- **Device Information:** Device type, operating system, and app version.
- **Usage Data:** Log and usage analytics to improve app performance and security.
- **Permissions:** With your consent, the app may access your location, camera, and microphone for functionality.

---

## 2. How We Use Your Information

- To allow you to submit and view incident reports.
- To maintain and improve app functionality and security.
- To communicate with you regarding updates or support.
- **We do not sell your personal information.**

---

## 3. Data Sharing

- We may share incident reports (excluding personal identifiers) with relevant organizations or partners solely for public safety purposes.
- We do not share personal information except as required by law or to protect our rights and users.

---

## 4. Data Retention

- Incident reports and related data are retained as long as necessary to provide services and comply with legal obligations.
- You may request deletion of your incident reports or account at any time.

---

## 5. Your Rights

If you are a resident of California or another state with privacy laws, you have the right to:

- Request access to the personal information we hold about you.
- Request deletion of your personal information.
- Opt-out of the sale of your personal information (we do not sell information).
- Contact us at privacy@wedesist.com for any privacy-related requests.

---

## 6. Children's Privacy

Our app is not intended for children under 13. We do not knowingly collect personal information from children. If you believe we have collected such information, please contact us to request removal.

---

## 7. Data Security

We implement reasonable security measures to protect your information, including encryption and access controls. No method of transmission or storage is 100% secure, but we strive to protect your data.

---

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted in the app and on our website, with the effective date above.

---

## 9. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@wedesist.com.

---

**By using our App, you consent to this Privacy Policy.**
`;

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Privacy Policy
        </Text>
        <Text style={styles.content}>
          {privacyPolicy}
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
