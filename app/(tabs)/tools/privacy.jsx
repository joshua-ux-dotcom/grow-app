import { ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DATENSCHUTZ</Text>

      <Text style={styles.text}>
        Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten innerhalb der App Grow.
      </Text>

      <Text style={styles.heading}>1. Verantwortlicher</Text>
      <Text style={styles.text}>
        [NAME]
        {'\n'}[ADRESSE]
        {'\n'}[EMAIL]
      </Text>

      <Text style={styles.heading}>2. Erhobene Daten</Text>
      <Text style={styles.text}>
        Benutzername, Login-Daten, Nutzungsdaten, gespeicherte Videos, freiwillige Eingaben.
      </Text>

      <Text style={styles.heading}>3. Zweck der Nutzung</Text>
      <Text style={styles.text}>
        Bereitstellung der App, Verbesserung des Angebots, Sicherheit und Nutzerfunktionen.
      </Text>

      <Text style={styles.heading}>4. Speicherung</Text>
      <Text style={styles.text}>
        Daten werden auf sicheren Servern gespeichert.
      </Text>

      <Text style={styles.heading}>5. Rechte</Text>
      <Text style={styles.text}>
        Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch.
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