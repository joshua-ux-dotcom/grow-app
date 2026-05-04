import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout'
 
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
    borderRadius: s(14),
    minHeight: sv(52),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(6),
    paddingVertical: sv(8),
  },
  value: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '700',
    marginBottom: sv(4),
  },
  label: {
    color: COLORS.mutedGold,
    fontSize: sf(10),
    textAlign: 'center',
    lineHeight: sf(13),
  },
});