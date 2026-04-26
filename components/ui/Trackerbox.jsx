import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
 
export default function TrackerBox({ value, label }) {
  return (
    <View style={styles.box}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  value: {
    color: COLORS.softGold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    color: COLORS.mutedGold,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
});