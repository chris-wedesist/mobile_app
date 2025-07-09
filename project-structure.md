# DESIST! App - Project Structure

## Directory Structure

```
desist-app/
├── app/                      # Application routes
│   ├── _layout.tsx           # Root layout
│   ├── +not-found.tsx        # 404 page
│   ├── (tabs)/               # Tab navigation
│   │   ├── _layout.tsx       # Tab configuration
│   │   ├── index.tsx         # Home screen
│   │   ├── record.tsx        # Recording screen
│   │   ├── incidents.tsx     # Incidents list
│   │   ├── badges.tsx        # Badges/achievements
│   │   ├── legal-help.tsx    # Legal resources
│   │   ├── documents.tsx     # Document storage
│   │   ├── settings.tsx      # App settings
│   │   └── recordings.tsx    # Recordings list
│   ├── badge-unlock.tsx      # Badge unlock screen
│   ├── cover-story-activation.tsx # Cover story activation
│   ├── demo-welcome.tsx      # Demo welcome screen
│   ├── emergency-setup.tsx   # Emergency contact setup
│   ├── emergency-sms.tsx     # SMS alerts screen
│   ├── legal-rights.tsx      # Legal rights info
│   ├── mission-success.tsx   # Mission completion
│   ├── my-badges.tsx         # Badges detail
│   ├── panic-activation.tsx  # Panic mode activation
│   ├── recording-backup.tsx  # Recording backup flow
│   ├── report-incident.tsx   # Incident reporting
│   ├── settings-history.tsx  # Settings history
│   ├── shield-builder-badge.tsx # Badge screen
│   ├── stealth-browser.tsx   # Stealth browser mode
│   ├── stealth-calculator.tsx # Stealth calculator
│   ├── stealth-calendar.tsx  # Stealth calendar
│   ├── stealth-cover.tsx     # Stealth cover
│   ├── stealth-document.tsx  # Stealth document viewer
│   ├── stealth-mode-demo.tsx # Stealth mode demo
│   ├── stealth-mode.tsx      # Stealth mode settings
│   ├── stealth-notes.tsx     # Stealth notes app
│   └── test-panic-flow.tsx   # Panic flow testing
├── assets/                   # Static assets
│   └── images/               # Image assets
├── components/               # Reusable components
│   ├── AutoWipeManager.tsx   # Auto-wipe functionality
│   ├── BadgeManager.tsx      # Badge management
│   ├── BadgeUnlockModal.tsx  # Badge unlock UI
│   ├── CoverStoryManager.tsx # Cover story management
│   ├── CoverStoryNotes.tsx   # Cover story notes UI
│   ├── NoHandsIcon.tsx       # App icon component
│   ├── PanicButton.tsx       # Panic button UI
│   ├── PanicGestureHandler.tsx # Panic gesture detection
│   ├── SettingsAuditLog.tsx  # Settings audit log
│   ├── SMSManager.tsx        # SMS functionality
│   ├── StealthCountdownDisplay.tsx # Stealth countdown
│   ├── StealthModeButton.tsx # Stealth mode toggle
│   ├── StealthModeManager.tsx # Stealth mode logic
│   ├── TrustMetricsManager.tsx # Trust metrics
│   └── UploadManager.tsx     # Upload management
├── constants/                # App constants
│   ├── styles.ts             # Shared styles
│   └── theme.ts              # Theme configuration
├── hooks/                    # Custom hooks
│   ├── useFrameworkReady.ts  # Framework initialization
│   ├── useStealthAutoTimeout.ts # Stealth timeout
│   └── useStealthCountdown.ts # Stealth countdown
├── supabase/                 # Supabase configuration
│   └── migrations/           # Database migrations
├── .env                      # Environment variables
├── .prettierrc               # Prettier configuration
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── README.md                 # Project documentation
└── tsconfig.json             # TypeScript configuration
```

## Key Components

### Navigation Structure

- **Root Layout**: Configured in `app/_layout.tsx`
- **Tab Navigation**: Configured in `app/(tabs)/_layout.tsx`
- **Modal Screens**: Implemented as direct routes in the `app/` directory

### Core Features

1. **Recording System**
   - `app/(tabs)/record.tsx`: Camera recording interface
   - `components/UploadManager.tsx`: Secure upload management

2. **Incident Reporting**
   - `app/(tabs)/incidents.tsx`: Incident map and list
   - `app/report-incident.tsx`: Incident reporting form

3. **Emergency Response**
   - `components/PanicButton.tsx`: Panic button implementation
   - `app/panic-activation.tsx`: Panic mode activation flow
   - `components/SMSManager.tsx`: Emergency SMS functionality

4. **Stealth Mode**
   - `components/StealthModeManager.tsx`: Stealth mode logic
   - `app/stealth-mode.tsx`: Stealth mode configuration
   - Multiple stealth cover apps (notes, calculator, etc.)

5. **Document Management**
   - `app/(tabs)/documents.tsx`: Document storage interface
   - Secure document handling and encryption

6. **Badge System**
   - `components/BadgeManager.tsx`: Badge award logic
   - `app/(tabs)/badges.tsx`: Badge display interface
   - `app/badge-unlock.tsx`: Badge unlock experience

7. **Legal Resources**
   - `app/(tabs)/legal-help.tsx`: Legal assistance directory
   - `app/legal-rights.tsx`: Know Your Rights information

### Database Structure

The Supabase database includes tables for:

- User profiles and settings
- Incident reports and recordings
- Emergency contacts
- Trust metrics and verification
- Badge awards and requirements
- Audit logs for security tracking

## Security Architecture

1. **Data Protection**
   - End-to-end encryption for sensitive data
   - Secure storage for credentials and tokens
   - Auto-wipe functionality for sensitive media

2. **Privacy Controls**
   - Stealth mode with multiple cover stories
   - Location privacy settings
   - Anonymized reporting options

3. **Authentication & Authorization**
   - Supabase authentication integration
   - Row Level Security (RLS) policies
   - Role-based access control

## State Management

- React Context API for global state
- Local component state for UI-specific state
- AsyncStorage for persistent local storage
- Supabase for remote data synchronization

## Styling Approach

- Consistent theme defined in `constants/theme.ts`
- Reusable style components in `constants/styles.ts`
- Component-specific styles using `StyleSheet.create()`
- Responsive design for cross-platform compatibility