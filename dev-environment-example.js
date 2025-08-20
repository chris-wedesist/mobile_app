// HOW TO INTEGRATE DevEnvironmentInfo:
// In your App.js or similar component:

import { DevEnvironmentInfo } from "./dev-environment";

export default function App() {
  return (
    <View style={{flex: 1}}>
      {/* Your existing app */}
      {__DEV__ && <DevEnvironmentInfo />}
    </View>
  );
}
