import { View } from 'react-native';
import Svg, { Path, Text } from 'react-native-svg';

export default function NoHandsIcon({ size = 300 }) {
  // Calculate points for octagon
  const center = size / 2;
  const radius = (size * 0.45);  // Slightly larger proportion of the size
  const points = [];
  
  // Generate 8 points for octagon
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 8;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Stop sign (octagon) */}
        <Path
          d={`M ${points.join(' L ')} Z`}
          fill="#C41E3A"  // Official US Stop sign red color
          stroke="#fff"
          strokeWidth={size * 0.02}
        />
        
        {/* DESIST! text */}
        <Text
          x={center}
          y={center + size * 0.08}
          fontSize={size * 0.18}  // Slightly larger text proportion
          fontWeight="bold"
          fill="#fff"
          textAnchor="middle"
          fontFamily="Arial">
          DESIST!
        </Text>
      </Svg>
    </View>
  );
}