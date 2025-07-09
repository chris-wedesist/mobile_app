import { View } from 'react-native';
import { TAB_BAR_HEIGHT } from './CustomTabBar';

/**
 * A component that adds bottom padding to account for the tab bar
 * Use this at the bottom of scrollable content to ensure nothing is hidden behind the tab bar
 */
export default function TabBarSpacer() {
  return <View style={{ height: TAB_BAR_HEIGHT }} />;
}