import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { networkSecurityManager } from '../../lib/intelligence/networkSecurity';

export const NetworkMonitor: React.FC = () => {
  const [connections, setConnections] = useState<string[]>([]);
  const [vpnDetected, setVpnDetected] = useState<boolean>(false);

  useEffect(() => {
    const fetchNetwork = async () => {
      setConnections(await networkSecurityManager.monitorConnections());
      setVpnDetected(await networkSecurityManager.detectVPN());
    };
    fetchNetwork();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Security Monitor</Text>
      <Text style={styles.label}>Connections:</Text>
      {connections.map((conn, idx) => (
        <Text key={idx} style={styles.value}>- {conn}</Text>
      ))}
      <Text style={styles.label}>VPN Detected: <Text style={styles.value}>{vpnDetected ? 'Yes' : 'No'}</Text></Text>
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

export default NetworkMonitor;
