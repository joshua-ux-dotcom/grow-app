import { ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
 
export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DATENSCHUTZ</Text>
 
      <Text style={styles.text}>
        Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten
        innerhalb der App „GROW".
      </Text>
 
      <Text style={styles.heading}>1. Verantwortlicher</Text>
      <Text style={styles.text}>
        Dominik Vilz / GROW{'\n'}
        Neustraße 50, 53949 Dahlem{'\n'}
        E-Mail: d.vilz2004@gmail.com
      </Text>
 
      <Text style={styles.heading}>2. Allgemeines zur Datenverarbeitung</Text>
      <Text style={styles.text}>
        Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Personenbezogene Daten werden
        von uns ausschließlich im Rahmen der gesetzlichen Bestimmungen verarbeitet.{'\n\n'}
        Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden
        können (z. B. E-Mail-Adresse, Nutzername).
      </Text>
 
      <Text style={styles.heading}>3. Erhebung und Speicherung personenbezogener Daten</Text>
      <Text style={styles.text}>
        Wir erheben und verarbeiten folgende Daten:{'\n\n'}
        <Text style={styles.subheading}>Bei Registrierung:{'\n'}</Text>
        • E-Mail-Adresse{'\n'}
        • Benutzername{'\n'}
        • Passwort (verschlüsselt gespeichert){'\n\n'}
        <Text style={styles.subheading}>Bei Nutzung der App:{'\n'}</Text>
        • Angesehene Videos{'\n'}
        • Interaktionen (z. B. Likes){'\n'}
        • Nutzungsdauer (zur Verbesserung der App){'\n\n'}
        <Text style={styles.subheading}>Technische Daten:{'\n'}</Text>
        • Gerätetyp{'\n'}
        • Betriebssystem{'\n'}
        • IP-Adresse (gekürzt/anonymisiert, soweit möglich)
      </Text>
 
      <Text style={styles.heading}>4. Zweck der Datenverarbeitung</Text>
      <Text style={styles.text}>
        • Bereitstellung und Betrieb der App{'\n'}
        • Verbesserung der Inhalte und Nutzererfahrung{'\n'}
        • Personalisierung von Inhalten{'\n'}
        • Gewährleistung der Sicherheit der Plattform
      </Text>
 
      <Text style={styles.heading}>5. Rechtsgrundlagen der Verarbeitung</Text>
      <Text style={styles.text}>
        • Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO){'\n'}
        • zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO){'\n'}
        • berechtigtem Interesse (Art. 6 Abs. 1 lit. f DSGVO)
      </Text>
 
      <Text style={styles.heading}>6. Speicherung und Löschung der Daten</Text>
      <Text style={styles.text}>
        Ihre personenbezogenen Daten werden nur so lange gespeichert, wie dies für die jeweiligen
        Zwecke erforderlich ist. Sie können jederzeit die Löschung Ihres Accounts und Ihrer Daten
        verlangen.
      </Text>
 
      <Text style={styles.heading}>7. Weitergabe von Daten</Text>
      <Text style={styles.text}>
        Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt grundsätzlich nicht,
        es sei denn:{'\n'}
        • Sie haben ausdrücklich eingewilligt{'\n'}
        • Es besteht eine gesetzliche Verpflichtung{'\n'}
        • Es ist zur technischen Bereitstellung der App notwendig (z. B. Hosting-Dienstleister)
      </Text>
 
      <Text style={styles.heading}>8. Rechte der Nutzer</Text>
      <Text style={styles.text}>
        Sie haben jederzeit das Recht:{'\n'}
        • Auskunft über Ihre gespeicherten Daten zu erhalten{'\n'}
        • Berichtigung unrichtiger Daten zu verlangen{'\n'}
        • Löschung Ihrer Daten zu verlangen{'\n'}
        • Einschränkung der Verarbeitung zu verlangen{'\n'}
        • Ihre Einwilligung jederzeit zu widerrufen
      </Text>
 
      <Text style={styles.heading}>9. Datensicherheit</Text>
      <Text style={styles.text}>
        Wir verwenden geeignete technische und organisatorische Sicherheitsmaßnahmen, um Ihre
        Daten gegen Manipulation, Verlust oder unbefugten Zugriff zu schützen.{'\n'}
        • Verschlüsselte Datenübertragung (HTTPS){'\n'}
        • Sichere Speicherung von Passwörtern
      </Text>
 
      <Text style={styles.heading}>10. Nutzung von Inhalten (Videos)</Text>
      <Text style={styles.text}>
        Die in der App dargestellten Inhalte stammen entweder von uns selbst oder von Creatorn,
        die der Nutzung ihrer Inhalte zugestimmt haben.
      </Text>
 
      <Text style={styles.heading}>11. Änderungen dieser Datenschutzerklärung</Text>
      <Text style={styles.text}>
        Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an aktuelle
        rechtliche Anforderungen oder Änderungen unserer Leistungen anzupassen.
      </Text>
 
      <Text style={styles.heading}>12. Kontakt</Text>
      <Text style={styles.text}>
        Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren:{'\n'}
        E-Mail: d.vilz2004@gmail.com
      </Text>
 
      {/* Nutzerrechte */}
      <Text style={[styles.title, { marginTop: sv(40) }]}>DEINE RECHTE</Text>
 
      <Text style={styles.text}>
        Wir legen großen Wert auf Transparenz und geben dir jederzeit die Kontrolle über deine
        Daten.
      </Text>
 
      <Text style={styles.heading}>1. Recht auf Auskunft</Text>
      <Text style={styles.text}>
        Du hast das Recht zu erfahren, welche personenbezogenen Daten wir über dich speichern.
        Dazu gehören insbesondere:{'\n'}
        • deine E-Mail-Adresse{'\n'}
        • dein Benutzername{'\n'}
        • deine Aktivitäten innerhalb der App (z. B. angesehene Inhalte)
      </Text>
 
      <Text style={styles.heading}>2. Recht auf Berichtigung</Text>
      <Text style={styles.text}>
        Sollten deine Daten nicht korrekt sein, hast du das Recht, diese berichtigen zu lassen
        (z. B. falscher Benutzername, veraltete E-Mail-Adresse).
      </Text>
 
      <Text style={styles.heading}>3. Recht auf Löschung</Text>
      <Text style={styles.text}>
        Du hast jederzeit das Recht, die Löschung deiner personenbezogenen Daten zu verlangen.
        Dies beinhaltet die vollständige Löschung deines Accounts und aller gespeicherten Daten.
      </Text>
 
      <Text style={styles.heading}>4. Recht auf Einschränkung der Verarbeitung</Text>
      <Text style={styles.text}>
        Du hast das Recht, die Verarbeitung deiner Daten einschränken zu lassen, wenn du die
        Richtigkeit der Daten bestreitest oder die Verarbeitung unrechtmäßig ist.
      </Text>
 
      <Text style={styles.heading}>5. Recht auf Datenübertragbarkeit</Text>
      <Text style={styles.text}>
        Du hast das Recht, deine Daten in einem strukturierten, gängigen Format zu erhalten
        (z. B. Export deiner Account-Daten).
      </Text>
 
      <Text style={styles.heading}>6. Recht auf Widerruf deiner Einwilligung</Text>
      <Text style={styles.text}>
        Wenn du der Verarbeitung deiner Daten zugestimmt hast, kannst du diese Einwilligung
        jederzeit widerrufen. Der Widerruf gilt für die Zukunft.
      </Text>
 
      <Text style={styles.heading}>7. Beschwerderecht</Text>
      <Text style={styles.text}>
        Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren, wenn du der
        Ansicht bist, dass die Verarbeitung deiner Daten gegen geltendes Recht verstößt.
      </Text>
 
      <Text style={styles.heading}>Datenverwaltung in der App</Text>
      <Text style={styles.text}>
        Du kannst folgende Funktionen direkt in der App nutzen:{'\n'}
        • Änderung deiner E-Mail-Adresse{'\n'}
        • Änderung deines Benutzernamens{'\n'}
        • Löschen deines Accounts
      </Text>
 
      <Text style={styles.heading}>Kontakt für Datenschutzanfragen</Text>
      <Text style={styles.text}>
        Für alle Anfragen zu deinen Daten kannst du uns jederzeit kontaktieren:{'\n'}
        E-Mail: d.vilz2004@gmail.com{'\n\n'}
        Für bestimmte Anfragen (z. B. Datenauskunft oder Datenübertragbarkeit) kann es
        erforderlich sein, dass du uns direkt kontaktierst. Wir bearbeiten solche Anfragen
        zeitnah im Rahmen der gesetzlichen Vorgaben.
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
  subheading: {
    color: COLORS.softGold,
    fontWeight: '600',
  },
  text: {
    color: COLORS.textMuted,
    fontSize: sf(14),
    lineHeight: sf(22),
    marginBottom: 30,
  },
});