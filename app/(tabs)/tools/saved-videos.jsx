import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function SavedVideosScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>GESPEICHERTE VIDEOS</Text>
      <Text style={styles.text}>
        Hier erscheinen alle Videos, die du gespeichert hast.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: 20,
    paddingTop: 70,
  },
  title: {
    color: COLORS.paleGold,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },
  text: {
    color: COLORS.softGold,
    fontSize: 15,
  },
});