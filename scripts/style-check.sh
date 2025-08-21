#!/bin/bash

# DESIST Mobile App - Style Guide Compliance Checker
# 
# This script validates that all components follow the established style guide
# See /docs/STYLE_GUIDE.md for complete guidelines

echo "🎨 DESIST Style Guide Compliance Check"
echo "======================================"
echo ""

# Color violations - check for hardcoded hex colors
echo "🔍 Checking for hardcoded colors..."
color_violations=$(grep -r "#[0-9A-Fa-f]\{3,8\}" app/ components/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v "theme.ts" | grep -v "// OK:" | grep -v "/* OK:" || true)

if [ -n "$color_violations" ]; then
    echo "❌ STYLE VIOLATION: Hardcoded colors found"
    echo "$color_violations"
    echo ""
    echo "💡 Fix: Use colors from '../constants/theme' instead"
    echo "   Example: backgroundColor: colors.background"
    echo ""
    violations=true
else
    echo "✅ No hardcoded colors found"
fi

# Font family violations
echo ""
echo "🔍 Checking for hardcoded font families..."
font_violations=$(grep -r "fontFamily.*['\"]" app/ components/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v "theme.ts" | grep -v "Inter-" | grep -v "typography.fontFamily" || true)

if [ -n "$font_violations" ]; then
    echo "❌ STYLE VIOLATION: Hardcoded font families found"
    echo "$font_violations"
    echo ""
    echo "💡 Fix: Use typography.fontFamily from '../constants/theme'"
    echo "   Example: fontFamily: typography.fontFamily.regular"
    echo ""
    violations=true
else
    echo "✅ No hardcoded font families found"
fi

# Check for hardcoded spacing values (common violations)
echo ""
echo "🔍 Checking for common hardcoded spacing violations..."
spacing_violations=$(grep -r -E "(margin|padding).*: [0-9]{2,}" app/ components/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v "theme.ts" || true)

if [ -n "$spacing_violations" ]; then
    echo "⚠️  POTENTIAL VIOLATION: Large hardcoded spacing values found"
    echo "$spacing_violations"
    echo ""
    echo "💡 Consider: Use spacing constants from '../constants/theme'"
    echo "   Example: padding: spacing.md"
    echo ""
fi

# Check for shadow violations
echo ""
echo "🔍 Checking for hardcoded shadow properties..."
shadow_violations=$(grep -r -E "shadowColor.*['\"]#" app/ components/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v "theme.ts" || true)

if [ -n "$shadow_violations" ]; then
    echo "❌ STYLE VIOLATION: Hardcoded shadow colors found"
    echo "$shadow_violations"
    echo ""
    echo "💡 Fix: Use shadows from '../constants/theme'"
    echo "   Example: ...shadows.medium"
    echo ""
    violations=true
else
    echo "✅ No hardcoded shadow colors found"
fi

# Check for proper theme imports
echo ""
echo "🔍 Checking for missing theme imports..."
files_with_styles=$(find app/ components/ lib/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "StyleSheet\|styles.*=" | grep -v "theme.ts" || true)

if [ -n "$files_with_styles" ]; then
    missing_imports=""
    for file in $files_with_styles; do
        if ! grep -q "from.*constants/theme" "$file" && ! grep -q "from.*theme" "$file"; then
            # Check if file actually uses style properties that should use theme
            if grep -q -E "(backgroundColor|color|fontFamily|fontSize|shadowColor|borderRadius|padding|margin):" "$file"; then
                missing_imports="$missing_imports\n$file"
            fi
        fi
    done
    
    if [ -n "$missing_imports" ]; then
        echo "⚠️  WARNING: Files with styles missing theme imports:"
        echo -e "$missing_imports"
        echo ""
        echo "💡 Add: import { colors, typography, spacing, shadows, radius } from '../constants/theme';"
        echo ""
    fi
fi

# Check for Inter font usage
echo ""
echo "🔍 Checking Inter font implementation..."
inter_check=$(grep -r "Inter-" app/ components/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | wc -l || echo "0")

if [ "$inter_check" -gt 0 ]; then
    echo "✅ Inter font family found in use"
else
    echo "⚠️  WARNING: Inter font family not found - ensure typography.fontFamily is being used"
fi

# Summary
echo ""
echo "======================================"
if [ "$violations" = true ]; then
    echo "❌ STYLE GUIDE VIOLATIONS FOUND"
    echo ""
    echo "📋 Action Required:"
    echo "1. Fix all violations listed above"
    echo "2. Read the Style Guide: /docs/STYLE_GUIDE.md"
    echo "3. Use theme constants from /constants/theme.ts"
    echo "4. Re-run this script to verify fixes"
    echo ""
    exit 1
else
    echo "✅ STYLE GUIDE COMPLIANCE PASSED"
    echo ""
    echo "🎉 All components follow the established design system!"
    echo "📋 Keep up the good work and maintain consistency"
    echo ""
    exit 0
fi
