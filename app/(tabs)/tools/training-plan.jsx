import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
 
export default function TrainingPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Training Plan Screen</Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.paleGold,
    fontSize: 24,
    fontWeight: '700',
  },
});