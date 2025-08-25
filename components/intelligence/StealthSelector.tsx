import React, { useState } from 'react';
import { View, Text, StyleSheet, Picker, TouchableOpacity } from 'react-native';
import { coverApplicationsManager } from '../../lib/stealth-advanced/coverApplications';

export const StealthSelector: React.FC = () => {
  const [activeCover, setActiveCover] = useState(coverApplicationsManager.getConfig().activeCoverApp);
  const covers = coverApplicationsManager.getConfig().availableCovers;

  const handleChange = (app: string) => {
    coverApplicationsManager.setActiveCover(app);
    setActiveCover(app);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stealth Cover Selector</Text>
      <Text style={styles.label}>Current Cover: <Text style={styles.value}>{activeCover}</Text></Text>
      <Picker
        selectedValue={activeCover}
        style={styles.picker}
        onValueChange={handleChange}
      >
        {covers.map((cover) => (
          <Picker.Item key={cover} label={cover} value={cover} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.button} onPress={() => handleChange(activeCover)}>
        <Text style={styles.buttonText}>Apply Cover</Text>
      </TouchableOpacity>
    </View>
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
  picker: {
    height: 50,
    width: '100%',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StealthSelector;
