import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  level: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
  },
  levelLow: {
    color: '#4CAF50',
  },
  levelMedium: {
    color: '#FF9800',
  },
  levelHigh: {
    color: '#F44336',
  },
  levelCritical: {
    color: '#D32F2F',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
