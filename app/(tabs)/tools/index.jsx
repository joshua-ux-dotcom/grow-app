import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import ToolCard from '../../../components/ui/ToolCard';

function TrackerBox({ value, label }) {
  return (
    <View style={styles.trackerBox}>
      <Text style={styles.trackerValue}>{value}</Text>
      <Text style={styles.trackerLabel}>{label}</Text>
    </View>
  );
}

export default function ToolsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌳</Text>
          </View>

          <View style={styles.headerTextBox}>
            <Text style={styles.topLabel}>GROW</Text>
            <Text style={styles.accountName}>Grower</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOOLS</Text>
          <Text style={styles.sectionSubtitle}>
            Build discipline. Track progress. Become unstoppable.
          </Text>
        </View>

        <View style={styles.grid}>
          <ToolCard
            icon="✅"
            title="To-do"
            description="Plane deinen Tag und hake Aufgaben ab."
            onPress={() => router.push('/tools/todo')}
          />

          <ToolCard
            icon="🏋️"
            title="Trainingsplan"
            description="Erstelle Trainingstage und Übungen."
            onPress={() => router.push('/tools/training-plan')}
          />

          <ToolCard
            icon="🎯"
            title="Ziele"
            description="Setze Monats-, Jahres- und Lebensziele."
            onPress={() => router.push('/tools/goals')}
          />

          <ToolCard
            icon="🔥"
            title="Gewohnheiten"
            description="Baue Streaks auf und bleib konstant."
            onPress={() => router.push('/tools/habits')}
          />

          <ToolCard
            icon="⏱️"
            title="Deep Work"
            description="Fokus. Keine Ablenkung. Fortschritt."
            onPress={() => router.push('/tools/deep-work')}
          />

          <ToolCard
            icon="📅"
            title="Tagesplaner"
            description="Strukturiere deinen Tag klar."
            onPress={() => router.push('/tools/daily-planner')}
          />
        </View>

        <View style={styles.trackerSection}>
          <Text style={styles.trackerTitle}>ACTIVE TRACKER</Text>
          <Text style={styles.trackerSubtitle}>
            Deine heutigen Fortschritte auf einen Blick.
          </Text>

          <View style={styles.trackerRow}>
            <TrackerBox value="7" label="Tage Streak" />
            <TrackerBox value="68%" label="Tagesziele" />
            <TrackerBox value="24:37" label="Deep Work" />
            <TrackerBox value="5.432" label="Schritte" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#89683a',
    backgroundColor: '#100b15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
  },
  headerTextBox: {
    flex: 1,
  },
  topLabel: {
    color: '#a07d47',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
  accountName: {
    color: '#f2dfb4',
    fontSize: 24,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#f4e7c5',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#aa9b81',
    fontSize: 12.5,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackerSection: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
  trackerTitle: {
    color: '#f4e7c5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 1,
  },
  trackerSubtitle: {
    color: '#9c8f78',
    fontSize: 11,
    marginBottom: 10,
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  trackerBox: {
    flex: 1,
    backgroundColor: '#0d0913',
    borderWidth: 1,
    borderColor: '#7f6236',
    borderRadius: 14,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  trackerValue: {
    color: '#f2dfb4',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackerLabel: {
    color: '#9d9079',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
});