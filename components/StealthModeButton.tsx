import { TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useStealthMode } from './StealthModeManager';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type StealthModeButtonProps = {
  variant?: 'icon' | 'full' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

export default function StealthModeButton({ 
  variant = 'full',
  size = 'md',
  showLabel = true
}: StealthModeButtonProps) {
  const { isActive, toggle } = useStealthMode();

  const getSize = () => {
    switch (size) {
      case 'sm': return 20;
      case 'md': return 24;
      case 'lg': return 32;
    }
  };

  const iconSize = getSize();

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={[
          styles.iconButton,
          isActive && styles.iconButtonActive
        ]}
        onPress={() => toggle('manual')}>
        {isActive ? (
          <MaterialIcons name="visibility-off" size={iconSize} color={colors.text.primary} />
        ) : (
          <MaterialIcons name="visibility" size={iconSize} color={colors.text.primary} />
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={[
          styles.minimalButton,
          isActive && styles.minimalButtonActive
        ]}
        onPress={() => toggle('manual')}>
        {isActive ? (
          <MaterialIcons name="visibility-off" size={iconSize} color={colors.text.primary} />
        ) : (
          <MaterialIcons name="visibility" size={iconSize} color={colors.text.primary} />
        )}
        {showLabel && (
          <Text style={styles.minimalButtonText}>
            {isActive ? 'Exit Cover' : 'Cover Mode'}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.buttonActive,
        Platform.OS === 'web' && styles.webButton
      ]}
      onPress={() => toggle('manual')}>
      {isActive ? (
        <MaterialIcons name="visibility-off" size={iconSize} color={colors.text.primary} />
      ) : (
        <MaterialIcons name="visibility" size={iconSize} color={colors.text.primary} />
      )}
      <Text style={styles.buttonText}>
        {isActive ? 'Exit Cover Mode' : 'Enter Cover Mode'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.sm,
  },
  webButton: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
  },
  buttonActive: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: radius.round,
    backgroundColor: colors.accent,
    ...shadows.sm,
  },
  iconButtonActive: {
    backgroundColor: colors.status.error,
  },
  minimalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    gap: 6,
  },
  minimalButtonActive: {
    backgroundColor: `${colors.status.error}20`,
  },
  minimalButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});