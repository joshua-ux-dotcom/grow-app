import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { s, sv } from '../../constants/layout';
 
export default function ScreenContainer({ children, style }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: s(14),
    paddingTop: sv(10),
    paddingBottom: sv(10),
  },
});