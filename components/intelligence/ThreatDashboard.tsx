import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { threatIntelligenceEngine } from '../../lib/intelligence/threatIntelligence';

export const ThreatDashboard: React.FC = () => {
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      const result = await threatIntelligenceEngine.assessThreats({});
      setAssessment(result);
    };
    fetchAssessment();
  }, []);

  if (!assessment) {
    return <Text style={styles.loading}>Loading threat assessment...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Threat Intelligence Dashboard</Text>
      <Text style={styles.label}>Risk Score: <Text style={styles.value}>{assessment.riskScore}</Text></Text>
      <Text style={styles.label}>Severity: <Text style={styles.value}>{assessment.severity}</Text></Text>
      <Text style={styles.label}>Confidence: <Text style={styles.value}>{assessment.confidence.toFixed(2)}</Text></Text>
      <Text style={styles.label}>Threat Categories:</Text>
      {assessment.threatCategories.map((cat: string, idx: number) => (
        <Text key={idx} style={styles.value}>- {cat}</Text>
      ))}
      <Text style={styles.label}>Recommendations:</Text>
      {assessment.recommendations.map((rec: string, idx: number) => (
        <Text key={idx} style={styles.value}>- {rec}</Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  loading: {
    fontSize: 16,
    color: '#999',
    padding: 20,
  },
});

export default ThreatDashboard;
