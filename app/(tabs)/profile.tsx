import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.username}>@johndoe</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>125</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1,024</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>348</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>
      
      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>
          Professional photographer and travel enthusiast. Capturing moments and sharing stories from around the world.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.fontSize.body,
    color: colors.text.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
  },
  bioContainer: {
    paddingHorizontal: spacing.sm,
  },
  bioText: {
    fontSize: typography.fontSize.body,
    lineHeight: 24,
    color: colors.text.secondary,
  },
});