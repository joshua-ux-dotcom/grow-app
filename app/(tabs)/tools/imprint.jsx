import { ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function ImprintScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>IMPRESSUM</Text>

      <Text style={styles.text}>
        Angaben gemäß § 5 TMG
      </Text>

      <Text style={styles.heading}>Betreiber</Text>
      <Text style={styles.text}>
        [VORNAME NACHNAME]
        {'\n'}[STRASSE HAUSNUMMER]
        {'\n'}[PLZ ORT]
        {'\n'}Deutschland
      </Text>

      <Text style={styles.heading}>Kontakt</Text>
      <Text style={styles.text}>
        E-Mail: [EMAIL]
      </Text>

      <Text style={styles.heading}>Verantwortlich für Inhalte</Text>
      <Text style={styles.text}>
        [NAME]
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 50,
  },
  title: {
    color: COLORS.paleGold,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  heading: {
    color: COLORS.softGold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});