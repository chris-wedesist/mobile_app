import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
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
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  option: {
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.body,
  },
});
