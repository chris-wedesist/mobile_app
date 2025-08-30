/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/react-in-jsx-scope */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Location from 'expo-location';
import { IncidentSeverity, IncidentSubmission, IncidentType, Location as LocationType } from '../types/incident';
import { IncidentService } from '../services/IncidentService';
import { EncryptionService } from '../encryption';
import { COLORS } from '../constants/theme';

interface IncidentSubmissionFormProps {
  onSubmissionComplete: (wasSuccessful: boolean) => void;
  encryptionService: EncryptionService;
}

const incidentTypes: { value: IncidentType; label: string }[] = [
  { value: 'theft', label: 'Theft' },
  { value: 'assault', label: 'Assault' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'traffic_incident', label: 'Traffic Incident' },
  { value: 'other', label: 'Other' }
];

const severityLevels: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: COLORS.severityLow },
  { value: 'medium', label: 'Medium', color: COLORS.severityMedium },
  { value: 'high', label: 'High', color: COLORS.severityHigh },
  { value: 'critical', label: 'Critical', color: COLORS.severityCritical }
];

const generateDeviceId = (): string => {
  const BASE = 36;
  const START_INDEX = 2;
  const LENGTH = 9;
  return `device_${Math.random().toString(BASE).substr(START_INDEX, LENGTH)}`;
};

export const IncidentSubmissionForm: React.FC<IncidentSubmissionFormProps> = ({
  onSubmissionComplete,
  encryptionService
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<IncidentType>('other');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>('medium');
  const [location, setLocation] = useState<LocationType | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const incidentService = new IncidentService(encryptionService);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async (): Promise<void> => {
    try {
      setIsGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to report incidents accurately.',
          [{ text: 'OK' }]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'Retry', onPress: getCurrentLocation }, { text: 'Cancel' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the incident.');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the incident.');
      return false;
    }

    if (!location) {
      Alert.alert('Location Required', 'Location is required to report an incident.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const submission: IncidentSubmission = {
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        severity: selectedSeverity,
        location: location!,
        anonymous: isAnonymous,
        visibility: 'public',
        tags: []
      };

      const securityContext = {
        deviceId: generateDeviceId(),
        ipAddress: '0.0.0.0',
        userAgent: 'DesistMobile/1.0',
        timestamp: new Date(),
        locationAccuracy: location!.accuracy || 0
      };

      const result = await incidentService.submitIncident(submission, securityContext);

      if (result.success) {
        Alert.alert(
          'Success',
          'Your incident report has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setTitle('');
                setDescription('');
                setSelectedType('other');
                setSelectedSeverity('medium');
                setIsAnonymous(false);
                onSubmissionComplete(true);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Submission Failed',
          result.error?.message || 'Unable to submit incident report. Please try again.',
          [{ text: 'OK' }]
        );
        onSubmissionComplete(false);
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
      onSubmissionComplete(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelector = (): React.ReactElement => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Incident Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {incidentTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              selectedType === type.value && styles.typeOptionSelected
            ]}
            onPress={() => setSelectedType(type.value)}
          >
            <Text style={[
              styles.typeOptionText,
              selectedType === type.value && styles.typeOptionTextSelected
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSeveritySelector = (): React.ReactElement => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Severity Level</Text>
      <View style={styles.severityContainer}>
        {severityLevels.map((severity) => (
          <TouchableOpacity
            key={severity.value}
            style={[
              styles.severityOption,
              { borderColor: severity.color },
              selectedSeverity === severity.value && { backgroundColor: severity.color }
            ]}
            onPress={() => setSelectedSeverity(severity.value)}
          >
            <Text style={[
              styles.severityOptionText,
              selectedSeverity === severity.value && styles.severityOptionTextSelected
            ]}>
              {severity.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLocationStatus = (): React.ReactElement => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Location</Text>
      {isGettingLocation ? (
        <View style={styles.locationContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.locationText}>Getting your location...</Text>
        </View>
      ) : location ? (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            📍 Location captured (±{Math.round(location.accuracy || 0)}m accuracy)
          </Text>
          <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshLocationButton}>
            <Text style={styles.refreshLocationText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={getCurrentLocation} style={styles.getLocationButton}>
          <Text style={styles.getLocationText}>📍 Get Current Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Report an Incident</Text>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief description of the incident"
            maxLength={100}
            multiline={false}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of what happened"
            maxLength={1000}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{description.length}/1000</Text>
        </View>

        {renderTypeSelector()}
        {renderSeveritySelector()}
        {renderLocationStatus()}

        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxSelected]}>
              {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.anonymousText}>Submit anonymously</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!title.trim() || !description.trim() || !location || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !description.trim() || !location || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  scrollContainer: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center'
  },
  sectionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.medium,
    textAlign: 'right',
    marginTop: 4
  },
  typeScroll: {
    flexDirection: 'row'
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    backgroundColor: COLORS.white
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  typeOptionText: {
    fontSize: 14,
    color: COLORS.dark
  },
  typeOptionTextSelected: {
    color: COLORS.white
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  severityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 80
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: '600'
  },
  severityOptionTextSelected: {
    color: COLORS.white
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.locationBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.locationBorder
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1
  },
  refreshLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6
  },
  refreshLocationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600'
  },
  getLocationButton: {
    padding: 12,
    backgroundColor: COLORS.locationBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.locationBorder,
    alignItems: 'center'
  },
  getLocationText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600'
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  anonymousText: {
    fontSize: 16,
    color: COLORS.dark
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.light
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600'
  }
});
