# Incident Reporting System

## Overview

The Incident Reporting System is a comprehensive feature that allows users to report, view, and manage security incidents in real-time. This system provides location-based incident reporting with encryption, validation, and community-driven verification.

## Features

### Core Functionality

- **Real-time Incident Submission**: Users can report incidents with location, description, and severity
- **Location-based Viewing**: Interactive map showing nearby incidents
- **Security & Encryption**: All sensitive data is encrypted using AES-256-GCM
- **Rate Limiting**: Prevents spam with configurable submission limits
- **Community Voting**: Users can upvote/downvote incidents for credibility
- **Anonymous Reporting**: Option to submit incidents anonymously

### Security Features

- **Data Encryption**: All incident descriptions are encrypted at rest
- **Content Validation**: Automatic validation for suspicious content
- **Rate Limiting**: Maximum 3 submissions per hour per device
- **Location Accuracy**: Validation of location accuracy for incident reports
- **Security Scoring**: Each submission gets a security score based on various factors

## API Reference

### IncidentService

The main service class for incident operations.

```typescript
import { IncidentService } from 'desist-mobile-security';

const incidentService = new IncidentService(encryptionService);
```

#### Methods

##### `submitIncident(submission, securityContext)`

Submit a new incident report.

**Parameters:**
- `submission: IncidentSubmission` - The incident data
- `securityContext: IncidentSecurityContext` - Security context for validation

**Returns:** `Promise<SecurityResult<IncidentReport>>`

**Example:**
```typescript
const submission = {
  title: "Suspicious activity reported",
  description: "Saw someone trying car door handles",
  type: "suspicious_activity",
  severity: "medium",
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    timestamp: new Date()
  },
  anonymous: false,
  visibility: "public",
  tags: ["parking", "night"]
};

const securityContext = {
  deviceId: "device_abc123",
  userAgent: "DesistMobile/1.0",
  timestamp: new Date(),
  locationAccuracy: 10
};

const result = await incidentService.submitIncident(submission, securityContext);
```

##### `getIncidentsNearLocation(location, radius, filter?)`

Get incidents near a specific location.

**Parameters:**
- `location: Location` - Center point for search
- `radius: number` - Search radius in meters (default: 1000)
- `filter?: IncidentFilter` - Optional filters for results

**Returns:** `Promise<SecurityResult<IncidentReport[]>>`

##### `voteOnIncident(incidentId, vote, userId)`

Vote on an incident (up, down, or neutral).

**Parameters:**
- `incidentId: string` - ID of the incident
- `vote: 'up' | 'down' | 'neutral'` - Vote type
- `userId: string` - ID of the voting user

**Returns:** `Promise<SecurityResult<boolean>>`

##### `getIncidentAnalytics(location?, radius?)`

Get analytics for incidents in an area.

**Parameters:**
- `location?: Location` - Optional location filter
- `radius?: number` - Optional radius in meters

**Returns:** `Promise<SecurityResult<IncidentAnalytics>>`

## React Components

### IncidentSubmissionForm

A complete form component for submitting incident reports.

```typescript
import { IncidentSubmissionForm } from 'desist-mobile-security/src/components';

<IncidentSubmissionForm
  encryptionService={encryptionService}
  onSubmissionComplete={(success) => {
    if (success) {
      console.log('Incident submitted successfully');
    }
  }}
/>
```

**Props:**
- `encryptionService: EncryptionService` - Required encryption service
- `onSubmissionComplete: (success: boolean) => void` - Callback when submission completes

**Features:**
- Location detection and validation
- Form validation with character limits
- Type and severity selection
- Anonymous submission option
- Real-time form state management

### IncidentMapView

Interactive map component showing incidents in the area.

```typescript
import { IncidentMapView } from 'desist-mobile-security/src/components';

<IncidentMapView
  encryptionService={encryptionService}
  onIncidentSelect={(incident) => {
    console.log('Selected incident:', incident);
  }}
/>
```

**Props:**
- `encryptionService: EncryptionService` - Required encryption service
- `onIncidentSelect?: (incident: IncidentReport) => void` - Optional callback when incident is selected

**Features:**
- Interactive map with incident markers
- Color-coded severity indicators
- Detailed incident popups
- Location-based incident loading
- Filtering and search capabilities

## Type Definitions

### IncidentType

```typescript
type IncidentType = 
  | 'harassment'
  | 'theft'
  | 'vandalism'
  | 'assault'
  | 'fraud'
  | 'suspicious_activity'
  | 'traffic_incident'
  | 'safety_concern'
  | 'emergency'
  | 'other';
```

### IncidentSeverity

```typescript
type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### IncidentReport

```typescript
interface IncidentReport {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  location: Location;
  timestamp: Date;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reporter: {
    id: string;
    anonymous: boolean;
    verified: boolean;
  };
  evidence?: Evidence[];
  tags?: string[];
  upvotes: number;
  downvotes: number;
  visibility: VisibilityLevel;
  expiresAt?: Date;
  lastUpdated: Date;
  encrypted: boolean;
}
```

### IncidentSubmission

```typescript
interface IncidentSubmission {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: Location;
  anonymous: boolean;
  visibility: VisibilityLevel;
  tags?: string[];
  evidence?: Evidence[];
}
```

## Configuration

### Rate Limiting

Configure submission limits in `constants/incident.ts`:

```typescript
export const RATE_LIMITING = {
  MAX_SUBMISSIONS_PER_HOUR: 3,
  // ... other settings
};
```

### Validation Limits

```typescript
export const VALIDATION = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  LOCATION_ACCURACY_THRESHOLD: 100,
};
```

### Security Settings

```typescript
export const SECURITY = {
  PENALTY_LOW_ACCURACY: 10,
  PENALTY_SUSPICIOUS_CONTENT: 20,
  INITIAL_SCORE: 100,
};
```

## Security Considerations

### Data Protection

1. **Encryption**: All incident descriptions are encrypted using AES-256-GCM
2. **Location Privacy**: Location data accuracy is validated and limited
3. **Anonymous Reporting**: Users can submit incidents without revealing identity
4. **Rate Limiting**: Prevents spam and abuse with configurable limits

### Content Validation

1. **Security Scoring**: Each submission receives a security score
2. **Suspicious Content Detection**: Automatic flagging of potentially fake reports
3. **Location Accuracy**: Low accuracy locations receive warnings
4. **Content Length Limits**: Prevents oversized submissions

### Privacy Features

1. **Anonymous Submission**: Optional anonymous reporting
2. **Data Expiration**: Incidents can have expiration dates
3. **Visibility Controls**: Public/private incident visibility
4. **User Verification**: Optional reporter verification system

## Error Handling

The system uses comprehensive error handling with detailed error codes:

```typescript
// Example error response
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Maximum 3 submissions per hour exceeded',
    severity: 'medium',
    details: { resetTime: new Date() }
  },
  timestamp: new Date()
}
```

Common error codes:
- `VALIDATION_FAILED`: Form validation errors
- `RATE_LIMIT_EXCEEDED`: Too many submissions
- `ENCRYPTION_FAILED`: Encryption operation failed
- `LOCATION_REQUIRED`: Location data missing
- `SUBMISSION_ERROR`: General submission failure

## Usage Examples

### Basic Incident Submission

```typescript
import { IncidentService } from 'desist-mobile-security';

const incidentService = new IncidentService(encryptionService);

// Submit incident
const result = await incidentService.submitIncident({
  title: "Bike theft attempt",
  description: "Someone tried to cut my bike lock",
  type: "theft",
  severity: "medium",
  location: currentLocation,
  anonymous: false,
  visibility: "public"
}, securityContext);

if (result.success) {
  console.log('Incident submitted:', result.data);
}
```

### Get Nearby Incidents

```typescript
// Get incidents within 2km
const incidents = await incidentService.getIncidentsNearLocation(
  userLocation,
  2000,
  {
    types: ['theft', 'vandalism'],
    severity: ['medium', 'high'],
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    }
  }
);
```

### Vote on Incident

```typescript
// Upvote an incident
const voteResult = await incidentService.voteOnIncident(
  'incident_123',
  'up',
  'user_456'
);
```

### Get Analytics

```typescript
// Get incident analytics for area
const analytics = await incidentService.getIncidentAnalytics(
  userLocation,
  5000 // 5km radius
);

console.log('Total reports:', analytics.data?.totalReports);
console.log('Trending types:', analytics.data?.trendingTypes);
console.log('Hotspots:', analytics.data?.hotspots);
```

## Integration Guide

### 1. Install Dependencies

```bash
npm install expo-location @react-native-async-storage/async-storage react-native-maps
```

### 2. Initialize Service

```typescript
import { EncryptionService, IncidentService } from 'desist-mobile-security';

const encryptionService = new EncryptionService(config);
const incidentService = new IncidentService(encryptionService);
```

### 3. Request Permissions

```typescript
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Handle permission denied
}
```

### 4. Use Components

```typescript
import { IncidentSubmissionForm, IncidentMapView } from 'desist-mobile-security/src/components';

// In your app
<IncidentSubmissionForm
  encryptionService={encryptionService}
  onSubmissionComplete={handleSubmissionComplete}
/>

<IncidentMapView
  encryptionService={encryptionService}
  onIncidentSelect={handleIncidentSelect}
/>
```

## Best Practices

### Performance

1. **Lazy Loading**: Load incidents only when needed
2. **Caching**: Cache incident data for offline viewing
3. **Pagination**: Use pagination for large incident lists
4. **Image Optimization**: Optimize evidence images before upload

### User Experience

1. **Location Accuracy**: Always show location accuracy to users
2. **Offline Support**: Allow form completion offline with sync later
3. **Progress Indicators**: Show submission progress
4. **Error Messages**: Provide clear, actionable error messages

### Security

1. **Input Validation**: Always validate user input
2. **Rate Limiting**: Implement client-side rate limiting hints
3. **Encryption**: Never store sensitive data unencrypted
4. **Anonymous Options**: Always provide anonymous reporting options

### Accessibility

1. **Screen Reader Support**: Ensure all components are accessible
2. **High Contrast**: Support high contrast mode
3. **Large Text**: Support dynamic text sizing
4. **Voice Input**: Support voice input for descriptions

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   ```typescript
   // Always check permissions before using location
   const { status } = await Location.requestForegroundPermissionsAsync();
   ```

2. **Encryption Errors**
   ```typescript
   // Ensure encryption service is properly initialized
   if (!encryptionService.isInitialized()) {
     await encryptionService.initialize();
   }
   ```

3. **Rate Limiting**
   ```typescript
   // Check rate limit status
   const rateLimitCheck = await incidentService.checkRateLimit(deviceId);
   if (!rateLimitCheck.allowed) {
     // Show rate limit message with reset time
   }
   ```

4. **Map Loading Issues**
   ```typescript
   // Ensure proper map configuration
   <MapView
     style={styles.map}
     initialRegion={initialRegion}
     showsUserLocation={true}
     // ... other props
   />
   ```

### Debug Mode

Enable debug logging for development:

```typescript
// In development
if (__DEV__) {
  console.log('Incident submission data:', submission);
  console.log('Security context:', securityContext);
}
```

## License

This incident reporting system is part of the Desist Mobile Security library and follows the same licensing terms.
