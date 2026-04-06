import { View, Text, StyleSheet } from 'react-native';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Daily Planner Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06040a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#f4e7c5',
    fontSize: 24,
    fontWeight: '700',
  },
});