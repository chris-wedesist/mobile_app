# 🛡️ DESIST Mobile App

**Digital Security & Privacy Mobile Application**

[![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Style Guide](https://img.shields.io/badge/Style%20Guide-100%25%20Compliant-green.svg)](./docs/STYLE_GUIDE.md)

---

## ✅ **PHASE 2 COMPLETE: 100% Style Guide Compliance Achieved**

**🎉 SUCCESS**: Transformed from 200+ violations to **ZERO** hardcoded values!

**🎨 Design System**: All components now use established design tokens from `/constants/theme.ts`

**✅ Validation**: Run `./scripts/style-check.sh` to verify compliance

---

## 📚 Documentation

### **🔴 MANDATORY READING**
- **[📋 Style Guide](./docs/STYLE_GUIDE.md)** - Design system and coding standards
- **[🔄 Developer Handover](./docs/DEVELOPER_HANDOVER.md)** - Complete project overview

### **📖 Additional Resources**
- **[🎨 Theme Constants](./constants/theme.ts)** - Design tokens and variables
- **[🔐 Security Architecture](./lib/security/)** - Security system implementation

---

## 🏗️ Project Overview

DESIST is a comprehensive mobile security and privacy application built with React Native and Expo. The app provides advanced security features while maintaining a user-friendly interface through a consistent design system.

### **Key Features**
- 🔐 **Biometric Authentication** - Face ID, Touch ID, fingerprint support
- 🛡️ **Screen Protection** - Anti-screenshot and recording protection  
- 🚨 **Emergency Protocols** - Panic button with automated responses
- 👀 **Threat Detection** - Real-time security monitoring
- 🗄️ **Secure Storage** - Encrypted data persistence
- 🥷 **Stealth Mode** - Disguised calculator interface
- 📱 **Cross-Platform** - iOS and Android support

---

## 🎨 Design System

### **Core Principles**
- **Consistency**: All components follow established patterns
- **Accessibility**: Readable fonts, appropriate contrast
- **Performance**: Optimized for mobile devices
- **Security**: Visual indicators for security states

### **Design Tokens**
```typescript
// ✅ CORRECT - Use theme constants
import { colors, typography, spacing, shadows, radius } from './constants/theme';

// ❌ WRONG - Never use hardcoded values
backgroundColor: '#FFFFFF'  // Use colors.background instead
fontSize: 16               // Use typography.fontSize.body instead
```

### **Typography**
- **Font Family**: Inter (Regular, Medium, SemiBold, Bold)
- **Consistent Sizing**: Display, Title, Heading, Body, Small, Caption
- **Proper Hierarchy**: Clear information architecture

### **Color System**
- **Brand Colors**: Primary, Secondary, Accent
- **Semantic Colors**: Success, Warning, Error
- **Text Colors**: Primary, Secondary, Muted
- **Security States**: Safe, Caution, Danger

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Expo CLI
- Physical device for security feature testing

### **Installation**
```bash
# Clone repository
git clone [repository-url]
cd mobile_app

# Install dependencies
npm install

# Start development server
npx expo start
```

### **Style Guide Setup**
```bash
# Read the mandatory style guide
open docs/STYLE_GUIDE.md

# Review theme constants
open constants/theme.ts

# Check existing implementations
open app/index.tsx
open components/security/SecurityMonitor.tsx
```
---

## 📱 Application Structure

### **Navigation**
```
app/
├── index.tsx                 # Home screen
├── (security)/              # Security features
│   ├── dashboard.tsx        # Main security dashboard
│   ├── emergency-setup.tsx  # Emergency configuration
│   └── security-test.tsx    # Security validation
├── (stealth)/               # Stealth mode
│   ├── index.tsx           # Calculator disguise
│   ├── notes.tsx           # Encrypted notes
│   └── settings.tsx        # Stealth configuration
└── (tabs)/                  # Tab navigation
    └── legal-help.tsx       # Legal assistance
```

### **Components**
```
components/
├── security/
│   ├── SecurityMonitor.tsx  # Security dashboard
│   ├── ScreenProtector.tsx  # Anti-capture protection
│   ├── BiometricPrompt.tsx  # Biometric authentication
│   └── EmergencyPanel.tsx   # Emergency controls
```

### **Core Systems**
```
lib/
├── security/
│   ├── biometricAuth.ts     # Biometric authentication
│   ├── screenProtection.ts # Screen capture protection
│   ├── emergencyProtocols.ts # Emergency response
│   ├── threatDetection.ts  # Security monitoring
│   └── secureStorage.ts    # Encrypted storage
└── stealth.ts              # Stealth mode manager
```

---

## � Project Status

### **Phase 2: Complete ✅**
**Style Guide Compliance Achievement**
- ✅ **100% Compliance**: Zero hardcoded colors/fonts
- ✅ **Design System**: Complete theme implementation
- ✅ **Validation**: Automated style checking
- ✅ **Documentation**: Comprehensive style guide

### **Phase 3: Next Focus 🚀**
**Advanced Security & Biometric Authentication**
- 🎯 **Enhanced Authentication**: Multi-factor flows
- 🎯 **Advanced Security**: App locking, data encryption
- 🎯 **Performance**: Optimization and production readiness
- 🎯 **Testing**: Comprehensive security validation

### **Handover Documentation**
- 📋 **[Phase 3 Handover](./PHASE_3_HANDOVER.md)** - Complete transition guide
- 📋 **[Developer Handover](./docs/DEVELOPER_HANDOVER.md)** - Project overview
- 📋 **[Style Guide](./docs/STYLE_GUIDE.md)** - Design system rules

---

## �🔐 Security Features

### **Authentication**
- **Biometric Support**: Face ID, Touch ID, Fingerprint
- **PIN Fallback**: Secure PIN authentication
- **Session Management**: Configurable timeout periods

### **Protection Systems**
- **Screen Capture Blocking**: Prevents screenshots/recording
- **Background Protection**: Hides content when app backgrounded
- **Anti-Tampering**: Detects unauthorized access attempts

### **Emergency Features**
- **Panic Button**: Instant emergency activation
- **Emergency Contacts**: Automated notification system
- **Data Wiping**: Secure data destruction capabilities

---

## 🧪 Testing

### **Security Testing**
```bash
# Access security test suite
# Navigate to Security Dashboard > Test All Systems
# Or visit /app/(security)/security-test.tsx directly
```

### **Required Testing**
- **Physical Device**: Biometric features require actual hardware
- **Platform Testing**: Verify on both iOS and Android
- **Security Validation**: Test all protection mechanisms

### **Stealth Mode Testing**
```bash
# Access stealth test interface
# Navigate to Stealth Calculator > Long press operations
# Or visit /app/stealth-test.tsx directly
```

---

## 📋 Development Guidelines

### **🎨 Style Requirements**
1. **Read Style Guide**: `/docs/STYLE_GUIDE.md` is mandatory
2. **Use Theme Constants**: Import from `/constants/theme.ts`
3. **Follow Patterns**: Reference existing components
4. **Maintain Consistency**: Adhere to established design

### **🔐 Security Standards**
- Never log sensitive information
- Always use secure storage for credentials
- Implement proper error handling
- Follow principle of least privilege

### **📱 Platform Considerations**
- Test on both iOS and Android
- Use platform-specific APIs appropriately
- Handle permissions correctly
- Optimize for mobile performance

---

## 🏗️ Development Phases

### **✅ Phase 1: Foundation** (Complete)
- Basic app structure and navigation
- Initial security framework
- Stealth mode foundation

### **✅ Phase 2: Advanced Security** (Complete)
- Biometric authentication system
- Screen protection mechanisms
- Emergency protocols implementation
- Threat detection engine
- **Design system establishment**
- **Style guide implementation**

### **🚧 Phase 3: Advanced Intelligence** (Planned)
- Enhanced threat detection
- Advanced privacy features
- Behavioral analysis
- Network security monitoring

---

## 📞 Support

### **Style System**
- **Style Guide**: `/docs/STYLE_GUIDE.md` (MANDATORY)
- **Theme Constants**: `/constants/theme.ts`
- **Developer Handover**: `/docs/DEVELOPER_HANDOVER.md`

### **Technical Support**
- **Architecture**: Review `/lib/` directory for core systems
- **Components**: Check `/components/` for reusable UI elements
- **Navigation**: Expo Router file-based routing in `/app/`

### **Security Questions**
- Review security manager implementations in `/lib/security/`
- Check security component implementations in `/components/security/`
- Test security features using built-in test suites

---

## ⚖️ License

Private/Proprietary - All rights reserved

---

## 🏁 Final Reminders

### **🚨 CRITICAL**
- **Style Guide Compliance** is mandatory for all code changes
- **Security Best Practices** must be followed at all times
- **Cross-Platform Testing** is required for all features

### **✅ Success Checklist**
- [ ] Read and understand Style Guide
- [ ] Import theme constants in all components
- [ ] Follow established design patterns
- [ ] Test on physical devices
- [ ] Validate security features
- [ ] Maintain code quality standards

---

**🛡️ Secure. Private. Reliable.**

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