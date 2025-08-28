import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import ConsentFlowScreen from '../components/legal/ConsentFlowScreen';
import PrivacyPolicyScreen from '../components/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../components/legal/TermsOfServiceScreen';

interface OnboardingScreenProps {
  onComplete: () => void;
}

type ModalType = 'privacy' | 'terms' | null;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <View style={styles.container}>
      <ConsentFlowScreen
        onComplete={onComplete}
        onPrivacyPolicyPress={() => setActiveModal('privacy')}
        onTermsPress={() => setActiveModal('terms')}
      />

      <Modal
        visible={activeModal === 'privacy'}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PrivacyPolicyScreen onClose={closeModal} />
      </Modal>

      <Modal
        visible={activeModal === 'terms'}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <TermsOfServiceScreen onClose={closeModal} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
