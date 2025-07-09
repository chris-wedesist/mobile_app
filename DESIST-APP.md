# DESIST! App - Complete Project Download Package

## 📱 Overview

DESIST! (Digital Emergency Safety & Incident Support Tool) is a comprehensive React Native application designed to empower communities with digital safety tools and incident reporting capabilities. Built with privacy and security at its core, DESIST! provides essential features for documenting, reporting, and responding to incidents while protecting user safety.

## 🛡️ Key Features

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

## 🧰 Technical Stack

- **Frontend**: React Native (Expo SDK 52.0.30)
- **Navigation**: Expo Router 4.0.17
- **Database**: Supabase with PostGIS for location services
- **State Management**: React Context API
- **UI Components**: Custom components with Lucide icons
- **Security**: Row Level Security (RLS), secure storage

## 📂 Project Structure

```
desist-app/
├── app/                      # Application routes
│   ├── _layout.tsx           # Root layout
│   ├── (tabs)/               # Tab navigation
│   │   ├── _layout.tsx       # Tab configuration
│   │   ├── index.tsx         # Home screen
│   │   ├── record.tsx        # Recording
│   │   ├── incidents.tsx     # Incident list
│   │   ├── badges.tsx        # Achievements
│   │   ├── legal-help.tsx    # Legal resources
│   │   ├── documents.tsx     # Document storage
│   │   └── settings.tsx      # App settings
│   ├── emergency-setup.tsx   # Emergency setup
│   └── panic-activation.tsx  # Panic mode
├── components/               # Reusable components
├── constants/                # App constants
├── hooks/                    # Custom hooks
└── supabase/                 # Database migrations
```

## 🔐 Security Features

- End-to-end encryption
- Secure media storage
- Auto-wipe capabilities
- Stealth mode protection
- Row Level Security (RLS)

## 📱 Platform Support

- Web (Primary Platform)
- iOS (Through Expo)
- Android (Through Expo)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Expo CLI
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start the development server: `npm run dev`

## 🧪 Testing

The application includes comprehensive testing for critical components:

- Unit tests for core functionality
- Integration tests for key user flows
- Security testing for data protection features

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read our Contributing Guide for details on our code of conduct and the process for submitting pull requests.

---

Built with ❤️ for community safety and empowerment.