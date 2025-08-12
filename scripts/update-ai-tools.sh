#!/bin/bash
# Update GitHub Copilot and supporting tools for React Native development

echo "🔄 Updating GitHub Copilot and development tools..."

# Update VS Code extensions
echo "📦 Updating VS Code extensions..."
code --install-extension GitHub.copilot --force
code --install-extension GitHub.copilot-chat --force
code --install-extension eamodio.gitlens --force
code --install-extension usernamehw.errorlens --force
code --install-extension esbenp.prettier-vscode --force

# Update React Native specific extensions
echo "📱 Updating React Native extensions..."
code --install-extension msjsdiag.vscode-react-native --force
code --install-extension ms-vscode.vscode-typescript-next --force
code --install-extension bradlc.vscode-tailwindcss --force

# Update Node.js packages for better development experience
echo "🔧 Checking for development dependencies..."
if [ -f "package.json" ]; then
    echo "📦 Installing/updating development dependencies..."
    npm install --save-dev @types/react @types/react-native typescript
fi

echo "✅ GitHub Copilot and development tools updated successfully!"
echo "🎯 Your React Native development environment is optimized!"

# Display current versions
echo ""
echo "📋 Current tool versions:"
code --version | head -1
echo "GitHub Copilot extensions:"
code --list-extensions | grep -i copilot
