#!/bin/bash
# Verify GitHub Copilot setup for React Native development

echo "🔍 Verifying GitHub Copilot Setup..."
echo "===================================="

# Check VS Code extensions
echo "📦 Checking installed extensions:"
REQUIRED_EXTENSIONS=("GitHub.copilot" "eamodio.gitlens" "usernamehw.errorlens" "msjsdiag.vscode-react-native")

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if code --list-extensions | grep -q "$ext"; then
        echo "✅ $ext - Installed"
    else
        echo "❌ $ext - Missing"
    fi
done

# Check configuration files
echo ""
echo "⚙️ Checking configuration files:"

if [ -f ".vscode/settings.json" ]; then
    echo "✅ VS Code settings configured"
else
    echo "❌ VS Code settings missing"
fi

if [ -f ".vscode/keybindings.json" ]; then
    echo "✅ Keyboard shortcuts configured"
else
    echo "❌ Keyboard shortcuts missing"
fi

if [ -f ".copilot-context.md" ]; then
    echo "✅ GitHub Copilot context file found"
else
    echo "❌ GitHub Copilot context file missing"
fi

# Check scripts
echo ""
echo "🛠️ Checking automation scripts:"

if [ -x "scripts/copilot-workspace-setup.sh" ]; then
    echo "✅ Copilot workspace setup script ready"
else
    echo "❌ Copilot workspace setup script missing or not executable"
fi

if [ -x "scripts/update-ai-tools.sh" ]; then
    echo "✅ Update script ready"
else
    echo "❌ Update script missing or not executable"
fi

# Check documentation
echo ""
echo "📚 Checking documentation:"

if [ -f "docs/AI-Workflow-Guide.md" ]; then
    echo "✅ GitHub Copilot workflow guide available"
else
    echo "❌ Workflow guide missing"
fi

# Check for React Native project structure
echo ""
echo "📱 Checking React Native project structure:"

if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if grep -q "expo" package.json; then
        echo "✅ Expo project detected"
    fi
    if grep -q "react-native" package.json; then
        echo "✅ React Native dependencies found"
    fi
else
    echo "❌ package.json missing"
fi

if [ -d "app" ]; then
    echo "✅ app directory found"
else
    echo "❌ app directory missing"
fi

echo ""
echo "🎯 Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Test GitHub Copilot: Open a .tsx file and start typing a function"
echo "2. Test Copilot Chat: Press Cmd+Shift+/ to open GitHub Copilot chat"
echo "3. Review the workflow guide: docs/AI-Workflow-Guide.md"
echo "4. Use inline suggestions with Cmd+I for quick edits"
