const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

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

// Get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate a random date within the last 30 days
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
  const hoursAgo = Math.floor(Math.random() * 24); // 0-24 hours ago
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  
  return now.toISOString();
};

// Generate a sample incident
const generateSampleIncident = (id) => {
  return {
    id,
    description: getRandomItem(INCIDENT_DESCRIPTIONS),
    location: getRandomItem(SAMPLE_LOCATIONS),
    created_at: getRandomDate(),
    uploaded: Math.random() > 0.7, // 30% chance of being uploaded
  };
};

// Main function to generate sample data
const generateSampleData = () => {
  try {
    // Create directory structure
    const dataDir = path.join(__dirname, '..', 'assets', 'sample-data');
    ensureDirectoryExists(dataDir);
    
    // Generate sample incidents
    const incidents = [];
    const count = 5; // Number of incidents to generate
    
    for (let i = 0; i < count; i++) {
      const id = `sample-${i + 1}`;
      const incident = generateSampleIncident(id);
      incidents.push(incident);
      
      // Save individual incident file
      fs.writeFileSync(
        path.join(dataDir, `${id}.json`),
        JSON.stringify(incident, null, 2)
      );
      
      // Create a dummy video file
      fs.writeFileSync(
        path.join(dataDir, `${id}.txt`),
        `This is a placeholder for video file ${id}`
      );
      
      console.log(`Generated sample incident: ${id}`);
    }
    
    // Save all incidents to a single file
    fs.writeFileSync(
      path.join(dataDir, 'incidents.json'),
      JSON.stringify(incidents, null, 2)
    );
    
    console.log(`✅ Successfully generated ${count} sample incidents`);
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
};

// Run the generator
generateSampleData();