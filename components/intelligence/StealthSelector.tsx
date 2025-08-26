import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { coverApplicationsManager } from '../../lib/stealth-advanced/coverApplications';

export const StealthSelector: React.FC = () => {
  const [activeCover, setActiveCover] = useState(
    coverApplicationsManager.getActiveCover()?.name || ''
  );
  const covers = coverApplicationsManager.getAvailableCovers();

  const selectCover = (appName: string) => {
    coverApplicationsManager.activateCover(appName);
    setActiveCover(appName);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Cover Application</Text>
      {covers.map((cover) => (
        <TouchableOpacity
          key={cover.name}
          style={[
            styles.option,
            cover.name === activeCover && styles.selectedOption,
          ]}
          onPress={() => selectCover(cover.name)}
        >
          <Text style={styles.optionText}>{cover.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
  },
});
