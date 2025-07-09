# DESIST! App - Technical Documentation

## Architecture Overview

DESIST! is built using a modern React Native architecture with Expo, focusing on security, privacy, and user safety. The application follows a component-based architecture with clear separation of concerns.

### Key Architectural Components

1. **Frontend Layer**
   - React Native with Expo SDK 52.0.30
   - Expo Router 4.0.17 for navigation
   - Custom UI components with Lucide icons

2. **Data Management Layer**
   - Supabase for backend services
   - PostGIS for location-based services
   - Local storage for sensitive data

3. **Security Layer**
   - End-to-end encryption
   - Row Level Security (RLS)
   - Secure media handling

4. **Service Layer**
   - SMS emergency alerts
   - Media upload and processing
   - Trust and verification systems

## Core Technical Features

### Stealth Mode System

The stealth mode system allows users to quickly disguise the app as another application (notes, calculator, etc.) for safety in threatening situations.

**Key Components:**
- `StealthModeManager.tsx`: Core logic for activating/deactivating stealth mode
- `StealthModeButton.tsx`: UI component for toggling stealth mode
- `StealthCountdownDisplay.tsx`: Countdown timer for auto-exit
- `useStealthAutoTimeout.ts`: Hook for managing auto-timeout
- Multiple stealth cover screens (notes, calculator, browser, etc.)

**Implementation Details:**
- Uses React Context for global state management
- Implements platform-specific gesture detection
- Maintains audit logs of all stealth mode activations
- Provides multiple cover story options

### Emergency Response System

The emergency response system enables quick activation of panic mode, recording, and alerting emergency contacts.

**Key Components:**
- `PanicButton.tsx`: UI component for triggering panic mode
- `PanicGestureHandler.tsx`: Gesture detection for panic activation
- `SMSManager.tsx`: Handles emergency SMS alerts
- `UploadManager.tsx`: Manages secure media uploads

**Implementation Details:**
- Uses Expo Camera for video recording
- Implements location tracking with Expo Location
- Sends emergency alerts with contact information
- Securely uploads evidence to Supabase Storage

### Badge and Trust System

The badge and trust system provides gamification and community trust metrics.

**Key Components:**
- `BadgeManager.tsx`: Manages badge awards and progress
- `BadgeUnlockModal.tsx`: UI for badge unlocking experience
- `TrustMetricsManager.tsx`: Handles trust score calculations

**Implementation Details:**
- Tracks user actions and contributions
- Awards badges based on specific achievements
- Calculates trust scores based on community verification
- Provides visual feedback for achievements

### Secure Media Management

The secure media management system handles recording, storage, and optional auto-wiping of sensitive media.

**Key Components:**
- `UploadManager.tsx`: Manages media uploads to secure storage
- `AutoWipeManager.tsx`: Handles secure deletion of local media

**Implementation Details:**
- Implements secure overwrite before deletion
- Provides encryption for stored media
- Tracks upload status and retries
- Supports background uploads

## Database Schema

### Core Tables

1. **incidents**
   - Stores incident reports with location data
   - Uses PostGIS for spatial queries
   - Implements verification system

2. **emergency_contacts**
   - Stores user emergency contacts
   - Supports priority ordering
   - Includes custom message templates

3. **user_settings**
   - Stores user preferences and settings
   - Includes stealth mode configuration
   - Tracks badge achievements

4. **trust_metrics**
   - Stores community trust scores
   - Tracks verification history
   - Implements trust calculation algorithms

5. **settings_audit_log**
   - Tracks all settings changes
   - Stores before/after values
   - Includes metadata about changes

### Row Level Security

All tables implement Row Level Security (RLS) policies to ensure data privacy:

```sql
-- Example RLS policy
CREATE POLICY "Users can only view their own data"
ON private.user_data
FOR SELECT
USING (auth.uid() = user_id);
```

## API Integration

### Supabase Integration

The app integrates with Supabase for backend services:

```typescript
// Supabase client initialization
const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

// Example query
const { data, error } = await supabase
  .from('incidents')
  .select('*')
  .order('created_at', { ascending: false });
```

### Location Services

Location services are implemented using Expo Location and PostGIS:

```typescript
// Get current location
const location = await Location.getCurrentPositionAsync({});

// Find nearby incidents
const { data } = await supabase.rpc('find_nearby_incidents', {
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  radius_meters: 5000
});
```

## Security Implementation

### Data Encryption

Sensitive data is encrypted before storage:

```typescript
// Example encryption implementation
const encryptData = async (data: string, key: string) => {
  // Implementation details
};

// Example secure storage
await SecureStore.setItemAsync('sensitive_data', encryptedData);
```

### Secure Media Handling

Media files are securely handled:

```typescript
// Secure media wiping
const wipeLocalMedia = async (mediaUri: string) => {
  // Overwrite with random data before deletion
  const fileSize = (await FileSystem.getInfoAsync(mediaUri)).size;
  const randomData = new Uint8Array(fileSize);
  crypto.getRandomValues(randomData);
  
  // Write random data to file
  await FileSystem.writeAsStringAsync(
    mediaUri,
    String.fromCharCode.apply(null, Array.from(randomData)),
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  // Delete the overwritten file
  await FileSystem.deleteAsync(mediaUri);
};
```

## Performance Optimizations

### Memory Management

- Unload camera when not in use
- Release resources for heavy components
- Implement lazy loading for routes

### Network Optimization

- Implement retry logic for uploads
- Use background uploads for large media
- Cache frequently accessed data

### UI Performance

- Use `react-native-reanimated` for smooth animations
- Implement virtualized lists for long content
- Optimize image loading and caching

## Error Handling

The app implements comprehensive error handling:

```typescript
try {
  // Operation that might fail
} catch (error) {
  // Log error
  console.error('Operation failed:', error);
  
  // Update UI state
  setError(error instanceof Error ? error.message : 'An unexpected error occurred');
  
  // Retry logic if appropriate
  if (shouldRetry) {
    setTimeout(retryOperation, RETRY_DELAY);
  }
}
```

## Testing Strategy

### Unit Testing

- Test individual components and functions
- Mock external dependencies
- Focus on critical security functions

### Integration Testing

- Test complete user flows
- Verify data persistence
- Test cross-component interactions

### Security Testing

- Penetration testing for security features
- Verify encryption implementation
- Test privacy controls

## Deployment Process

### Expo Build

```bash
eas build --platform all
```

### Environment Configuration

- Development: `.env`
- Staging: `.env.staging`
- Production: `.env.production`

### Release Channels

- `default`: Development builds
- `staging`: Testing builds
- `production`: Production releases

## Maintenance Guidelines

### Version Control

- Use feature branches
- Implement PR reviews
- Maintain semantic versioning

### Dependency Management

- Regular security audits
- Scheduled dependency updates
- Compatibility testing

### Performance Monitoring

- Implement crash reporting
- Track key performance metrics
- Monitor API usage and limits