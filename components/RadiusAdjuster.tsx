import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface RadiusAdjusterProps {
  currentRadius: number; // in kilometers
  onRadiusChange: (radius: number) => void;
  maxRadius?: number;
  minRadius?: number;
  stepSize?: number;
  disabled?: boolean;
}

export const RadiusAdjuster: React.FC<RadiusAdjusterProps> = ({
  currentRadius,
  onRadiusChange,
  maxRadius = 100,
  minRadius = 1,
  stepSize = 1,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customRadius, setCustomRadius] = useState(currentRadius.toString());
  const [isValidInput, setIsValidInput] = useState(true);

  // Predefined radius options
  const predefinedRadii = [1, 2, 5, 10, 25, 50, 100];

  useEffect(() => {
    setCustomRadius(currentRadius.toString());
  }, [currentRadius]);

  const validateInput = (input: string): boolean => {
    const num = parseFloat(input);
    return !isNaN(num) && num >= minRadius && num <= maxRadius;
  };

  const handleCustomRadiusChange = (text: string) => {
    setCustomRadius(text);
    setIsValidInput(validateInput(text));
  };

  const handleCustomRadiusSubmit = () => {
    const radius = parseFloat(customRadius);
    if (validateInput(customRadius)) {
      onRadiusChange(radius);
      setIsModalVisible(false);
    } else {
      Alert.alert(
        'Invalid Radius',
        `Please enter a radius between ${minRadius} and ${maxRadius} kilometers.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleIncrementalChange = (increment: number) => {
    const newRadius = Math.max(minRadius, Math.min(maxRadius, currentRadius + increment));
    onRadiusChange(newRadius);
  };

  const formatRadius = (radius: number): string => {
    if (radius < 1) {
      return `${Math.round(radius * 1000)}m`;
    }
    return `${radius}km`;
  };

  const getRadiusDescription = (radius: number): string => {
    if (radius <= 1) return 'Very Close';
    if (radius <= 5) return 'Nearby';
    if (radius <= 25) return 'Local Area';
    if (radius <= 50) return 'Wide Area';
    return 'Extended Area';
  };

  return (
    <View style={styles.container}>
      {/* Current radius display */}
      <View style={styles.currentRadiusContainer}>
        <MaterialIcons name="my-location" size={20} color={colors.accent} />
        <View style={styles.radiusInfo}>
          <Text style={styles.radiusValue}>
            {formatRadius(currentRadius)}
          </Text>
          <Text style={styles.radiusDescription}>
            {getRadiusDescription(currentRadius)}
          </Text>
        </View>
      </View>

      {/* Incremental controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={() => handleIncrementalChange(-stepSize)}
          disabled={disabled || currentRadius <= minRadius}
          style={[styles.controlButton, currentRadius <= minRadius && styles.disabledButton]}
        >
          <MaterialIcons name="remove" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          disabled={disabled}
          style={styles.customButton}
        >
          <Text style={styles.customButtonText}>
            Custom
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIncrementalChange(stepSize)}
          disabled={disabled || currentRadius >= maxRadius}
          style={[styles.controlButton, currentRadius >= maxRadius && styles.disabledButton]}
        >
          <MaterialIcons name="add" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Predefined radius buttons */}
      <View style={styles.predefinedContainer}>
        <Text style={styles.predefinedLabel}>
          Quick Select:
        </Text>
        <View style={styles.predefinedButtons}>
          {predefinedRadii.map((radius) => (
            <TouchableOpacity
              key={radius}
              onPress={() => onRadiusChange(radius)}
              disabled={disabled}
              style={[
                styles.predefinedButton,
                currentRadius === radius && styles.selectedPredefinedButton,
              ]}
            >
              <Text
                style={[
                  styles.predefinedButtonText,
                  currentRadius === radius && styles.selectedPredefinedButtonText,
                ]}
              >
                {formatRadius(radius)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom radius modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set Custom Radius
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Radius (kilometers):
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  !isValidInput && styles.invalidInput,
                ]}
                value={customRadius}
                onChangeText={handleCustomRadiusChange}
                keyboardType="numeric"
                placeholder={`${minRadius}-${maxRadius}`}
                placeholderTextColor={colors.text.muted}
              />
              {!isValidInput && (
                <Text style={styles.errorText}>
                  Please enter a value between {minRadius} and {maxRadius}
                </Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCustomRadiusSubmit}
                disabled={!isValidInput}
                style={[styles.applyButton, !isValidInput && styles.disabledButton]}
              >
                <Text style={styles.applyButtonText}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  currentRadiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  radiusDescription: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  customButton: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  customButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  predefinedContainer: {
    marginTop: 8,
  },
  predefinedLabel: {
    color: colors.text.secondary,
    marginBottom: 8,
  },
  predefinedButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  predefinedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.text.muted,
  },
  selectedPredefinedButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  predefinedButtonText: {
    color: colors.text.primary,
    fontSize: 12,
  },
  selectedPredefinedButtonText: {
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7.84,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.text.primary,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.text.muted,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.primary,
  },
  invalidInput: {
    borderColor: colors.status.error,
  },
  errorText: {
    color: colors.status.error,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default RadiusAdjuster; 