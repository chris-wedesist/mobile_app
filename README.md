# DESIST! - Digital Emergency Safety & Incident Support Tool

A comprehensive React Native application designed to empower communities with digital safety tools and incident reporting capabilities. Built with privacy and security at its core, DESIST! provides essential features for documenting, reporting, and responding to incidents while protecting user safety.

![DESIST! App Banner](https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg)

## 🛡️ Core Features

### Emergency Response
- Quick-access panic button with location tracking
- Automatic incident recording with secure storage
- Emergency contact alert system
- Stealth mode for safety in threatening situations

### Documentation & Evidence
- Secure video/photo capture
- Automatic cloud backup with encryption
- Evidence preservation protocols
- Secure document storage for legal papers

### Community Safety
- Real-time incident mapping
- Anonymous reporting system
- Community verification system
- Trust-based reputation metrics

### Legal Resources
- Know Your Rights information
- Legal procedure guides
- Emergency legal contacts
- Document templates

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/desist-app.git
cd desist-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
desist-app/
├── app/                      # Application routes
│   ├── _layout.tsx          # Root layout
│   ├── (tabs)/              # Tab navigation
│   │   ├── _layout.tsx      # Tab configuration
│   │   ├── index.tsx        # Home screen
│   │   ├── record.tsx       # Recording
│   │   ├── incidents.tsx    # Incident list
│   │   ├── badges.tsx       # Achievements
│   │   ├── legal-help.tsx   # Legal resources
│   │   ├── documents.tsx    # Document storage
│   │   └── settings.tsx     # App settings
│   ├── emergency-setup.tsx  # Emergency setup
│   └── panic-activation.tsx # Panic mode
├── components/              # Reusable components
├── constants/              # App constants
├── hooks/                  # Custom hooks
└── supabase/              # Database migrations
```

## 🛠️ Technical Stack

### Frontend
- React Native (Expo SDK 52.0.30)
- Expo Router 4.0.17
- TypeScript
- Lucide Icons

### Backend
- Supabase
- PostGIS for location services
- Row Level Security (RLS)

### Security Features
- End-to-end encryption
- Secure media storage
- Auto-wipe capabilities
- Stealth mode protection

## 📱 Key Features Implementation

### Emergency Recording System
```typescript
import { CameraView } from 'expo-camera';
import * as Location from 'expo-location';

// Secure recording implementation
const startRecording = async () => {
  const location = await Location.getCurrentPositionAsync();
  const recording = await cameraRef.current.recordAsync();
  await uploadManager.uploadPanicEvent(recording.uri, location);
};
```

### Stealth Mode Protection
```typescript
const activateStealthMode = async () => {
  await settingsManager.updateSettings({
    stealth_mode_enabled: true,
    cover_story_screen: selectedApp
  });
};
```

### Badge System
```typescript
const awardBadge = async (type: BadgeType) => {
  await badgeManager.checkEligibility(type);
  await badgeManager.award(type);
};
```

## 🔐 Security Features

### Data Protection
- Automatic media wiping
- Encrypted storage
- Secure transmission protocols

### Privacy Controls
- Stealth mode activation
- Anonymous reporting
- Location privacy settings

### Row Level Security
```sql
-- Example RLS policy
CREATE POLICY "Users can only view their own data"
ON private.user_data
FOR SELECT
USING (auth.uid() = user_id);
```

## 🤝 Community Features

### Badge System
1. Founding Protector
   - Early adopter recognition
   - Safety training completion

2. Shield Builder
   - Community growth contribution
   - Successful referrals

3. Emergency Sentinel
   - Active safety reporting
   - Verified incident documentation

4. Evidence Guardian
   - Reliable documentation
   - Verified evidence preservation

5. Community Defender
   - Consistent participation
   - Positive impact metrics

### Trust System
- Verification metrics
- Community validation
- Contribution tracking
- Reliability scoring

## 📋 Database Schema

### Key Tables

```sql
-- Incidents tracking
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  location geography(Point,4326),
  description text,
  verified boolean DEFAULT false
);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  contact_type text,
  priority integer
);

-- Trust metrics
CREATE TABLE public.trust_metrics (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  score decimal,
  verified_count integer
);
```

## 📱 Platform Support

- Web (Primary Platform)
- iOS (Through Expo)
- Android (Through Expo)

## 🔧 Development

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:web
```

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Supabase](https://supabase.com/) for the backend infrastructure
- [PostGIS](https://postgis.net/) for location services
- All contributors and community members

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers directly.

---

Built with ❤️ for community safety and empowerment.