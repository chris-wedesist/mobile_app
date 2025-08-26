import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { threatIntelligenceEngine } from '../../lib/intelligence/threatIntelligence';

export const ThreatDashboard: React.FC = () => {
  const [threatLevel, setThreatLevel] = useState<string>('low');
  const [lastAssessment, setLastAssessment] = useState<Date | null>(null);

  useEffect(() => {
    const assessThreats = async () => {
      try {
        const result = await threatIntelligenceEngine.assessThreat({});
        setThreatLevel(result.severity);
        setLastAssessment(new Date());
      } catch (error) {
        console.error('Failed to assess threats:', error);
      }
    };

    assessThreats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Threat Level</Text>
      <Text
        style={[
          styles.level,
          styles[
            `level${threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}`
          ],
        ]}
      >
        {threatLevel.toUpperCase()}
      </Text>
      {lastAssessment && (
        <Text style={styles.timestamp}>
          Last assessed: {lastAssessment.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    margin: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  level: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: spacing.sm,
  },
  levelLow: {
    color: colors.success,
  },
  levelMedium: {
    color: colors.warning,
  },
  levelHigh: {
    color: colors.error,
  },
  levelCritical: {
    color: colors.error,
  },
  timestamp: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
