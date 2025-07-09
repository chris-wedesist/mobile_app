import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { biometricVerify } from '@/components/BiometricAuth';

// Define the base directory for storing incidents
const INCIDENTS_DIR = `${FileSystem.documentDirectory}DESIST/incidents/`;
const INCIDENTS_METADATA_KEY = 'DESIST_incidents_metadata';

// Define incident types
export type Incident = {
  id: string;
  videoUri: string;
  thumbnailUri?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  description?: string;
  tags?: string[];
  created_at: string;
  uploaded?: boolean;
  cloud_url?: string;
};

type IncidentMetadata = {
  [id: string]: Omit<Incident, 'videoUri'>;
};

// Ensure the incidents directory exists
const ensureDirectoryExists = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(INCIDENTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(INCIDENTS_DIR, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating incidents directory:', error);
    return false;
  }
};

// Save incident metadata to AsyncStorage
const saveIncidentMetadata = async (metadata: IncidentMetadata) => {
  try {
    await AsyncStorage.setItem(INCIDENTS_METADATA_KEY, JSON.stringify(metadata));
    return true;
  } catch (error) {
    console.error('Error saving incident metadata:', error);
    return false;
  }
};

// Load incident metadata from AsyncStorage
const loadIncidentMetadata = async (): Promise<IncidentMetadata> => {
  try {
    const data = await AsyncStorage.getItem(INCIDENTS_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading incident metadata:', error);
    return {};
  }
};

// Save an incident to the local device
export const saveIncidentToLocal = async (incident: {
  id: string;
  videoUri: string;
  location?: any;
  description?: string;
  tags?: string[];
}): Promise<{ success: boolean; error?: string }> => {
  try {
    // Ensure directory exists
    const dirExists = await ensureDirectoryExists();
    if (!dirExists) {
      return { success: false, error: 'Failed to create incidents directory' };
    }

    // Generate a unique ID if not provided
    const incidentId = incident.id || `incident_${Date.now()}`;
    
    // Define the destination path
    const destinationUri = `${INCIDENTS_DIR}${incidentId}.mp4`;
    
    // Copy the video file
    await FileSystem.copyAsync({
      from: incident.videoUri,
      to: destinationUri,
    });

    // Save metadata
    const metadata = await loadIncidentMetadata();
    metadata[incidentId] = {
      id: incidentId,
      location: incident.location,
      description: incident.description,
      tags: incident.tags,
      created_at: new Date().toISOString(),
      uploaded: false,
    };
    
    await saveIncidentMetadata(metadata);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error saving incident'
    };
  }
};

// List all locally stored incidents
export const listLocalIncidents = async (): Promise<Incident[]> => {
  try {
    // Load metadata
    const metadata = await loadIncidentMetadata();
    
    // Convert to array and sort by creation date (newest first)
    return Object.values(metadata)
      .map(meta => ({
        ...meta,
        videoUri: `${INCIDENTS_DIR}${meta.id}.mp4`,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error listing incidents:', error);
    return [];
  }
};

// Delete an incident from the device
export const deleteIncidentFromDevice = async (incidentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify with biometrics first
    if (Platform.OS !== 'web') {
      const bioResult = await biometricVerify('Confirm incident deletion');
      if (!bioResult.success) {
        return { success: false, error: 'Biometric authentication failed' };
      }
    }
    
    // Delete the video file
    const filePath = `${INCIDENTS_DIR}${incidentId}.mp4`;
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    
    // Update metadata
    const metadata = await loadIncidentMetadata();
    delete metadata[incidentId];
    await saveIncidentMetadata(metadata);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting incident'
    };
  }
};

// Download an incident from cloud storage
export const downloadIncidentFromCloud = async (userId: string, incidentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify with biometrics first
    if (Platform.OS !== 'web') {
      const bioResult = await biometricVerify('Confirm incident download');
      if (!bioResult.success) {
        return { success: false, error: 'Biometric authentication failed' };
      }
    }
    
    // Ensure directory exists
    const dirExists = await ensureDirectoryExists();
    if (!dirExists) {
      return { success: false, error: 'Failed to create incidents directory' };
    }
    
    // In a real app, this would download from Supabase or another cloud storage
    // For demo purposes, we'll simulate a download
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock incident
    const mockIncident = {
      id: incidentId,
      description: 'Downloaded incident',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      created_at: new Date().toISOString(),
      uploaded: true,
      cloud_url: `https://example.com/incidents/${userId}/${incidentId}`,
    };
    
    // Save metadata
    const metadata = await loadIncidentMetadata();
    metadata[incidentId] = mockIncident;
    await saveIncidentMetadata(metadata);
    
    // Create an empty file to simulate the video
    const destinationUri = `${INCIDENTS_DIR}${incidentId}.mp4`;
    await FileSystem.writeAsStringAsync(destinationUri, 'mock video data');
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error downloading incident'
    };
  }
};

// Permanently delete an incident from cloud storage
export const permanentlyDeleteIncidentFromCloud = async (userId: string, incidentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify with biometrics first
    if (Platform.OS !== 'web') {
      const bioResult = await biometricVerify('Confirm permanent deletion');
      if (!bioResult.success) {
        return { success: false, error: 'Biometric authentication failed' };
      }
    }
    
    // In a real app, this would delete from Supabase or another cloud storage
    // For demo purposes, we'll simulate deletion
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting incident'
    };
  }
};

// Upload an incident to cloud storage
export const uploadIncidentToCloud = async (incidentId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Load metadata
    const metadata = await loadIncidentMetadata();
    const incident = metadata[incidentId];
    
    if (!incident) {
      return { success: false, error: 'Incident not found' };
    }
    
    // Get the file path
    const filePath = `${INCIDENTS_DIR}${incidentId}.mp4`;
    
    // In a real app, this would upload to Supabase or another cloud storage
    // For demo purposes, we'll simulate an upload
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update metadata to mark as uploaded
    metadata[incidentId] = {
      ...incident,
      uploaded: true,
      cloud_url: `https://example.com/incidents/${incidentId}`,
    };
    
    await saveIncidentMetadata(metadata);
    
    return { 
      success: true,
      url: `https://example.com/incidents/${incidentId}`
    };
  } catch (error) {
    console.error('Error uploading incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error uploading incident'
    };
  }
};