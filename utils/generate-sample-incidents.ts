import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the base directory for storing incidents
const INCIDENTS_DIR = `${FileSystem.documentDirectory}DESIST/incidents/`;
const INCIDENTS_METADATA_KEY = 'DESIST_incidents_metadata';

// Sample incident descriptions
const INCIDENT_DESCRIPTIONS = [
  'Police checkpoint on Main Street and 5th Avenue',
  'ICE activity near community center on Washington Blvd',
  'Border patrol vehicles spotted near the park',
  'Raid in progress at warehouse district',
  'Checkpoint set up on Highway 101 northbound',
  'Officers checking IDs at bus station',
  'Unmarked vehicles conducting stops on Central Ave'
];

// Sample locations (coordinates for major US cities)
const SAMPLE_LOCATIONS = [
  { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
  { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  { latitude: 40.7128, longitude: -74.0060 }, // New York
  { latitude: 41.8781, longitude: -87.6298 }, // Chicago
  { latitude: 29.7604, longitude: -95.3698 }, // Houston
  { latitude: 33.4484, longitude: -112.0740 }, // Phoenix
  { latitude: 32.7157, longitude: -117.1611 }  // San Diego
];

// Sample tags
const SAMPLE_TAGS = [
  'police', 'ice', 'checkpoint', 'raid', 'border-patrol', 
  'id-check', 'vehicle-stop', 'unmarked-vehicles'
];

// Ensure the incidents directory exists
const ensureDirectoryExists = async (): Promise<boolean> => {
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

// Load incident metadata from AsyncStorage
const loadIncidentMetadata = async (): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(INCIDENTS_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading incident metadata:', error);
    return {};
  }
};

// Save incident metadata to AsyncStorage
const saveIncidentMetadata = async (metadata: any): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(INCIDENTS_METADATA_KEY, JSON.stringify(metadata));
    return true;
  } catch (error) {
    console.error('Error saving incident metadata:', error);
    return false;
  }
};

// Generate a random date within the last 30 days
const getRandomDate = (): string => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
  const hoursAgo = Math.floor(Math.random() * 24); // 0-24 hours ago
  const minutesAgo = Math.floor(Math.random() * 60); // 0-60 minutes ago
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  now.setMinutes(now.getMinutes() - minutesAgo);
  
  return now.toISOString();
};

// Get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Get random tags (1-3 tags)
const getRandomTags = (): string[] => {
  const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags
  const tags: string[] = [];
  
  for (let i = 0; i < numTags; i++) {
    const tag = getRandomItem(SAMPLE_TAGS);
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
};

// Generate a single sample incident
export const generateSampleIncident = async (): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    // Ensure directory exists
    const dirExists = await ensureDirectoryExists();
    if (!dirExists) {
      return { success: false, error: 'Failed to create incidents directory' };
    }
    
    // Generate unique ID
    const id = `incident_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create incident metadata
    const incident = {
      id,
      description: getRandomItem(INCIDENT_DESCRIPTIONS),
      location: getRandomItem(SAMPLE_LOCATIONS),
      tags: getRandomTags(),
      created_at: getRandomDate(),
      uploaded: Math.random() > 0.7, // 30% chance of being uploaded
    };
    
    // Create a dummy video file
    const videoPath = `${INCIDENTS_DIR}${id}.mp4`;
    await FileSystem.writeAsStringAsync(videoPath, 'MOCK_VIDEO_DATA');
    
    // Save metadata
    const metadata = await loadIncidentMetadata();
    metadata[id] = incident;
    await saveIncidentMetadata(metadata);
    
    return { success: true, id };
  } catch (error) {
    console.error('Error generating sample incident:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error generating sample incident'
    };
  }
};

// Generate multiple sample incidents
export const generateSampleIncidents = async (count: number = 5): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    let successCount = 0;
    
    for (let i = 0; i < count; i++) {
      const result = await generateSampleIncident();
      if (result.success) {
        successCount++;
      }
    }
    
    return { success: true, count: successCount };
  } catch (error) {
    console.error('Error generating sample incidents:', error);
    return { 
      success: false, 
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error generating sample incidents'
    };
  }
};

// Clear all sample incidents
export const clearSampleIncidents = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get directory contents
    const dirInfo = await FileSystem.getInfoAsync(INCIDENTS_DIR);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(INCIDENTS_DIR);
      
      // Delete each file
      for (const file of files) {
        await FileSystem.deleteAsync(`${INCIDENTS_DIR}${file}`, { idempotent: true });
      }
    }
    
    // Clear metadata
    await AsyncStorage.removeItem(INCIDENTS_METADATA_KEY);
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing sample incidents:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error clearing sample incidents'
    };
  }
};