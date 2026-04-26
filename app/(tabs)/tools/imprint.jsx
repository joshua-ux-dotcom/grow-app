import { ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
 
export default function ImprintScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>IMPRESSUM</Text>
 
      <Text style={styles.text}>Angaben gemäß § 5 TMG</Text>
 
      <Text style={styles.heading}>Name des Anbieters</Text>
      <Text style={styles.text}>Dominik Vilz</Text>
 
      <Text style={styles.heading}>Anschrift</Text>
      <Text style={styles.text}>
        Neustraße 50{'\n'}
        53949 Dahlem{'\n'}
        Deutschland
      </Text>
 
      <Text style={styles.heading}>Kontakt</Text>
      <Text style={styles.text}>E-Mail: d.vilz2004@gmail.com</Text>
 
      <Text style={styles.heading}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</Text>
      <Text style={styles.text}>
        Dominik Vilz{'\n'}
        Neustraße 50, 53949 Dahlem
      </Text>
 
      <Text style={styles.heading}>Haftung für Inhalte</Text>
      <Text style={styles.text}>
        Die Inhalte unserer App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
      </Text>
 
      <Text style={styles.heading}>Haftung für Links</Text>
      <Text style={styles.text}>
        Unsere App kann Inhalte Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben.
        Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
      </Text>
 
      <Text style={styles.heading}>Urheberrecht</Text>
      <Text style={styles.text}>
        Die durch die Betreiber der App erstellten Inhalte und Werke unterliegen dem deutschen
        Urheberrecht. Inhalte Dritter werden als solche gekennzeichnet und nur mit entsprechender
        Zustimmung verwendet.
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
    padding: s(20),
    paddingTop: sv(70),
    paddingBottom: sv(50),
  },
  title: {
    color: COLORS.paleGold,
    fontSize: sf(24),
    fontWeight: '700',
    marginBottom: sv(20),
  },
  heading: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '700',
    marginTop: sv(16),
    marginBottom: sv(6),
  },
  text: {
    color: COLORS.textMuted,
    fontSize: sf(14),
    lineHeight: sf(22),
    marginBottom: 30,
  },
});