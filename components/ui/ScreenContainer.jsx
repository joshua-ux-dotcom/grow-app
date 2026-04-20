import { SafeAreaView, StyleSheet, View } from 'react-native';

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
    backgroundColor: '#05060a',
  },
  container: {
    flex: 1,
    backgroundColor: '#05060a',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
});