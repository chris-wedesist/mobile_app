#!/bin/bash
# GitHub Copilot workspace optimization for React Native development

PROJECT_NAME=${1:-"mobile_app"}
echo "Optimizing GitHub Copilot for React Native project: $PROJECT_NAME"

# Ensure VS Code settings are optimized
if [ ! -f ".vscode/settings.json" ]; then
  mkdir -p .vscode
  cat > .vscode/settings.json << 'SETTINGS'
{
  "github.copilot.enable": {
    "*": true,
    "javascript": true,
    "typescript": true,
    "tsx": true,
    "jsx": true
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.chat.enabled": true,
  "typescript.suggest.autoImports": true,
  "javascript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.organizeImports": "explicit"
  }
}
SETTINGS
fi

# Create project context file for better Copilot understanding
cat > .copilot-context.md << 'CONTEXT'
# Project Context for GitHub Copilot

## Project Type
React Native mobile application built with Expo

## Key Technologies
- React Native with Expo
- TypeScript
- React Navigation
- Supabase (backend)
- Emergency response features
- Location services

## Coding Standards
- Use TypeScript for all new code
- Follow React Native best practices
- Implement accessibility features
- Consider mobile performance
- Handle both iOS and Android platforms

## Emergency App Features
- Panic button functionality
- Location tracking
- Emergency contacts
- Stealth mode
- Incident reporting
CONTEXT

echo "✅ GitHub Copilot workspace optimization complete for $PROJECT_NAME"
echo "📱 React Native context configured"
echo "🤖 GitHub Copilot ready for emergency app development"
