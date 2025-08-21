# Phase 1: Stealth Mode Foundation - Quick Start Guide

**Branch:** `phase-1-stealth-mode-foundation`  
**Status:** 🚀 READY TO START  
**Duration:** 5-7 days  
**Priority:** CRITICAL

---

## 🎯 PHASE 1 OBJECTIVES

Build the core stealth mode functionality that allows the app to appear as a calculator/notes app while hiding the attorney search functionality.

---

## 📋 DELIVERABLES CHECKLIST

### **Core Architecture**

- [ ] Mode management system (`lib/stealth.ts`)
- [ ] Root layout with mode detection (`app/_layout.tsx`)
- [ ] Stealth navigation layout (`app/(stealth)/_layout.tsx`)
- [ ] Normal tabs layout (`app/(tabs)/_layout.tsx`)

### **Stealth Interfaces**

- [ ] Calculator disguise (`app/(stealth)/index.tsx`)
- [ ] Notes app disguise (`app/(stealth)/notes.tsx`)
- [ ] Fake settings with hidden toggle (`app/(stealth)/settings.tsx`)

### **Integration**

- [ ] Mode switching logic with gestures/PIN
- [ ] Data persistence (AsyncStorage)
- [ ] Integration with existing attorney search
- [ ] Smooth transitions between modes

---

## 🏗️ IMPLEMENTATION ORDER

### **Day 1-2: Foundation**

1. Create mode management system
2. Set up root layout with mode detection
3. Create basic stealth navigation structure

### **Day 3-4: Interfaces**

1. Build functional calculator disguise
2. Create notes app interface
3. Implement fake settings screen

### **Day 5-6: Integration**

1. Add hidden toggle mechanism
2. Implement mode switching logic
3. Add data persistence

### **Day 7: Testing & Polish**

1. Test mode switching functionality
2. Ensure smooth transitions
3. Validate integration with attorney search

---

## 🔑 SUCCESS CRITERIA

- [ ] App launches in stealth mode by default
- [ ] Calculator functions as a real calculator
- [ ] Hidden toggle mechanism works reliably
- [ ] Mode switches smoothly without artifacts
- [ ] Attorney search works in normal mode
- [ ] Mode state persists between app sessions
- [ ] No visual indicators of hidden functionality in stealth mode

---

## 📁 KEY FILES TO CREATE

```
app/
├── _layout.tsx                    # NEW - Root mode controller
├── (stealth)/                     # NEW - Stealth mode screens
│   ├── _layout.tsx               # NEW - Stealth navigation
│   ├── index.tsx                 # NEW - Calculator disguise
│   ├── notes.tsx                 # NEW - Notes disguise
│   └── settings.tsx              # NEW - Fake settings + toggle
├── (tabs)/
│   ├── _layout.tsx               # NEW - Normal navigation
│   └── legal-help.tsx            # EXISTING - Keep as is
└── lib/
    └── stealth.ts                # NEW - Mode management
```

---

## 🎨 DESIGN REQUIREMENTS

### **Calculator Interface:**

- Professional calculator appearance
- Functional arithmetic operations
- History display
- Convincing icon and styling

### **Notes Interface:**

- Simple note-taking functionality
- List of notes
- Add/edit/delete capabilities
- Search functionality

### **Settings Interface:**

- Standard app settings appearance
- Version info (tap 7 times for toggle)
- Fake preference options
- Hidden mode switch mechanism

---

## 🔐 SECURITY CONSIDERATIONS

- No "legal" or "attorney" text visible in stealth mode
- App icon shows calculator (not legal-related)
- Recent apps view shows stealth interface
- Mode detection happens before any UI renders
- Emergency reset always returns to stealth mode

---

## 🚀 READY TO START

**Current Branch:** `phase-1-stealth-mode-foundation`  
**Next Step:** Start new chat for Phase 1 implementation  
**Focus:** Core stealth architecture and calculator disguise

---

This phase is the **critical foundation** for the entire stealth system. Success here enables all subsequent phases.
