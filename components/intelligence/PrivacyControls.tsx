import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { privacyEngineManager } from '../../lib/intelligence/privacyEngine';

export const PrivacyControls: React.FC = () => {
  const [config, setConfig] = useState(privacyEngineManager.getConfig());
  const [obfuscatedLocation, setObfuscatedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const obfuscate = async () => {
      const result = await privacyEngineManager.obfuscateLocation({ lat: 37.7749, lng: -122.4194 });
      setObfuscatedLocation(result);
    };
    obfuscate();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Engine Controls</Text>
      <Text style={styles.label}>Data Minimization: <Text style={styles.value}>{config.dataMinimization ? 'Enabled' : 'Disabled'}</Text></Text>
      <Text style={styles.label}>Anonymous Metrics: <Text style={styles.value}>{config.anonymousMetrics ? 'Enabled' : 'Disabled'}</Text></Text>
      <Text style={styles.label}>Location Obfuscation: <Text style={styles.value}>{config.locationObfuscation ? 'Enabled' : 'Disabled'}</Text></Text>
      <Text style={styles.label}>Zero-Knowledge Storage: <Text style={styles.value}>{config.zeroKnowledgeStorage ? 'Enabled' : 'Disabled'}</Text></Text>
      <Text style={styles.label}>Obfuscated Location:</Text>
      {obfuscatedLocation && (
        <Text style={styles.value}>
          Lat: {obfuscatedLocation.lat.toFixed(5)}, Lng: {obfuscatedLocation.lng.toFixed(5)}
        </Text>
      )}
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
});

export default PrivacyControls;
