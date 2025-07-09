import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useStealthCountdown } from '@/hooks/useStealthCountdown';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type StealthCountdownDisplayProps = {
  initialMinutes?: number;
  onComplete?: () => void;
  autoDeactivate?: boolean;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'standard' | 'prominent';
};

export default function StealthCountdownDisplay({
  initialMinutes = 5,
  onComplete,
  autoDeactivate = false,
  showControls = true,
  size = 'md',
  variant = 'standard'
}: StealthCountdownDisplayProps) {
  const {
    formattedTime,
    percentRemaining,
    isPaused,
    pause,
    resume,
    addTime
  } = useStealthCountdown({
    initialMinutes,
    onComplete,
    autoDeactivate
  });

  // Determine styles based on size
  const getFontSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 24;
      default: return 18;
    }
  };

  // Determine styles based on remaining time
  const getTimeColor = () => {
    if (percentRemaining <= 20) return colors.status.error;
    if (percentRemaining <= 50) return colors.status.warning;
    return colors.text.primary;
  };

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <View style={styles.minimalContainer}>
        <MaterialIcons name="schedule" size={getFontSize()} color={getTimeColor()} />
        <Text style={[styles.minimalTime, { fontSize: getFontSize(), color: getTimeColor() }]}>
          {formattedTime}
        </Text>
      </View>
    );
  }

  // Render prominent variant
  if (variant === 'prominent') {
    return (
      <View style={styles.prominentContainer}>
        <View style={styles.prominentTimeContainer}>
          <MaterialIcons name="schedule" size={24} color={colors.accent} />
          <Text style={styles.prominentTime}>{formattedTime}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentRemaining}%`, backgroundColor: getTimeColor() }
            ]} 
          />
        </View>
        
        {showControls && (
          <View style={styles.prominentControls}>
            <TouchableOpacity 
              style={styles.prominentButton}
              onPress={() => addTime(-1)}
              disabled={percentRemaining <= 10}>
              <MaterialIcons name="remove" size={16} color={colors.text.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.prominentPlayPauseButton}
              onPress={isPaused ? resume : pause}>
              {isPaused ? (
                <MaterialIcons name="play-arrow" size={20} color={colors.text.primary} />
              ) : (
                <MaterialIcons name="pause" size={20} color={colors.text.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.prominentButton}
              onPress={() => addTime(1)}>
              <MaterialIcons name="add" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Render standard variant (default)
  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <MaterialIcons name="schedule" size={getFontSize()} color={colors.text.muted} />
        <Text style={[styles.time, { fontSize: getFontSize(), color: getTimeColor() }]}>
          {formattedTime}
        </Text>
      </View>
      
      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => addTime(-1)}
            disabled={percentRemaining <= 10}>
            <MaterialIcons name="remove" size={14} color={colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={isPaused ? resume : pause}>
            {isPaused ? (
              <MaterialIcons name="play-arrow" size={16} color={colors.text.primary} />
            ) : (
              <MaterialIcons name="pause" size={16} color={colors.text.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => addTime(1)}>
            <MaterialIcons name="add" size={14} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Standard variant styles
  container: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 10,
    ...shadows.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  time: {
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  controlButton: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Minimal variant styles
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minimalTime: {
    fontWeight: '600',
  },
  
  // Prominent variant styles
  prominentContainer: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    ...shadows.md,
  },
  prominentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  prominentTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.round,
  },
  prominentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  prominentButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentPlayPauseButton: {
    backgroundColor: colors.accent,
    width: 48,
    height: 48,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});