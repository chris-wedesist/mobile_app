import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_PLACES_API_KEY not found in environment variables');
  process.exit(1);
}

const testGooglePlacesAPI = async () => {
  try {
    console.log('Testing Google Places API connection...');
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: 'attorneys near San Francisco',
          radius: 10000, // 10km
          key: API_KEY,
        },
      }
    );
    
    console.log('API Status:', response.data.status);
    console.log('Results Count:', response.data.results.length);
    
    if (response.data.results.length > 0) {
      console.log('Sample Result:');
      console.log(JSON.stringify(response.data.results[0], null, 2));
    }
    
    if (response.data.status !== 'OK') {
      console.error('API Error:', response.data.error_message || 'Unknown error');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testGooglePlacesAPI(); 