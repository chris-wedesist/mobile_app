# DESIST App - Quick Developer Reference

## 🚀 Getting Started in 5 Minutes

### 1. Clone & Setup
```bash
cd /Users/chrismitchell/mobile_app
npm install
npx expo install
```

### 2. Environment Setup
```bash
# Required API Keys (ask for values)
GOOGLE_PLACES_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

### 3. Run Development Build
```bash
npx expo run:ios --device    # iOS device
npx expo run:android         # Android device
```

---

## 📁 Key Files You Need to Know

### **Currently Working (Don't Break These):**
- `app/(tabs)/legal-help.tsx` - ✅ Main attorney search (COMPLETE)
- `lib/attorneys.ts` - ✅ Google Places API integration (COMPLETE)  
- `constants/theme.ts` - ✅ App theming with tag colors (COMPLETE)

### **Files You Need to Create:**
- `app/_layout.tsx` - Root mode controller (stealth/normal)
- `app/(stealth)/` - Entire stealth mode directory
- `lib/stealth.ts` - Mode management system
- `components/stealth/` - Privacy components

---

## 🔐 Stealth Mode Priority Tasks

### **Week 1: Foundation**
```typescript
// 1. Create mode manager
// lib/stealth.ts
export type AppMode = 'stealth' | 'normal';
export class StealthManager {
  async getCurrentMode(): Promise<AppMode> { /* implement */ }
  async toggleMode(): Promise<boolean> { /* implement */ }
}

// 2. Root layout with mode detection  
// app/_layout.tsx
export default function RootLayout() {
  const [mode, setMode] = useState<AppMode>('stealth');
  return mode === 'stealth' ? <StealthNav /> : <NormalNav />;
}

// 3. Calculator disguise
// app/(stealth)/index.tsx - Make it look like a real calculator
```

### **Week 2: Security**
```typescript
// 1. Hidden toggle (7 taps on calculator display)
// 2. Privacy guard (hide content when backgrounded)  
// 3. Screenshot prevention
// 4. Data isolation between modes
```

---

## 🏃‍♂️ Critical Implementation Notes

### **Non-Negotiable Requirements:**
1. **Stealth mode must be default** - App launches in disguise mode
2. **Toggle must be hidden** - No visible UI elements for mode switching  
3. **Complete disguise** - Calculator/notes app must look authentic
4. **Zero data leakage** - No cross-contamination between modes
5. **Emergency reset** - Always possible to return to stealth mode

### **Security Checklist:**
- [ ] No "legal" or "attorney" text visible in stealth mode
- [ ] App icon shows calculator (not legal-related)
- [ ] Recent apps view shows disguise interface
- [ ] Screenshots blocked in normal mode
- [ ] Hidden toggle works reliably but not accidentally

---

## 🛠 Technical Stack Quick Reference

### **Current Dependencies (Working):**
```json
{
  "expo": "~53.0.0",
  "expo-router": "~5.1.4", 
  "react-native": "0.76.3",
  "zustand": "^5.0.6"
}
```

### **Add These for Stealth Mode:**
```json
{
  "expo-local-authentication": "^14.0.1",
  "expo-secure-store": "^13.0.2", 
  "expo-screen-capture": "^6.0.0"
}
```

---

## 🔧 Development Commands

### **Start Development:**
```bash
npx expo start --dev-client    # Start dev server
npx expo run:ios --device      # Build & run on iOS
npx expo run:android           # Build & run on Android
```

### **Testing:**
```bash
npm test                       # Run tests
npx expo doctor               # Check configuration
```

### **Build for Production:**
```bash
eas build --platform ios      # iOS build
eas build --platform android  # Android build
```

---

## 📞 Emergency Contacts & Resources

### **Technical Support:**
- **Expo Dev Client Issues:** Check expo doctor, rebuild dev client
- **Google Places API:** Verify API key, check quota limits
- **Navigation Issues:** Expo Router v5 documentation

### **Critical Files Backup:**
- Current working attorney search: `app/(tabs)/legal-help.tsx`
- Google Places integration: `lib/attorneys.ts` 
- Complete theming: `constants/theme.ts`

### **Performance Monitoring:**
```typescript
// Already implemented in utils/performanceOptimizer.ts
import { performanceOptimizer } from '../utils/performanceOptimizer';
```

---

## 🎯 Success Metrics

### **Stealth Mode Success:**
- User can't tell it's not a real calculator app
- Mode switching works 100% of the time
- No security vulnerabilities in pen testing
- App passes manual security review

### **Overall App Success:**
- Attorney search works with real Google data ✅
- Filtering system functions properly ✅  
- Professional UI/UX maintained ✅
- Performance remains smooth ✅

---

## ⚡ Quick Debugging Guide

### **Common Issues:**
1. **"Expo Go not supported"** - Use Dev Client build
2. **Location not working** - Check permissions in app settings
3. **No attorneys found** - Verify Google Places API key
4. **App crashes on search** - Check network connectivity

### **Debug Tools:**
```bash
npx expo logs              # View device logs
npx react-devtools       # React debugging
```

---

**🎯 Focus: Your main job is implementing stealth mode. Everything else is working!**

**📚 Read: Start with `DEVELOPMENT_HANDOVER.md` for full context, then `STEALTH_IMPLEMENTATION_GUIDE.md` for technical details.**

**🔐 Remember: User safety depends on stealth mode working perfectly.**
