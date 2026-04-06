import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import ToolCard from '../../../components/ui/ToolCard';

export default function ToolsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
          description="Plane deinen Tag und hake Aufgaben sauber ab."
          onPress={() => router.push('/tools/todo')}
        />

        <ToolCard
          icon="🏋️"
          title="Trainingsplan"
          description="Erstelle deine Trainingstage und Übungen."
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
          description="Baue Streaks auf und bleib konsequent."
          onPress={() => router.push('/tools/habits')}
        />

        <ToolCard
          icon="⏱️"
          title="Deep Work"
          description="Fokus. Keine Ablenkung. Nur Fortschritt."
          onPress={() => router.push('/tools/deep-work')}
        />

        <ToolCard
          icon="📅"
          title="Tagesplaner"
          description="Strukturiere deinen Tag klar und bewusst."
          onPress={() => router.push('/tools/daily-planner')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#06040a',
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: '#8a6a39',
    backgroundColor: '#100b15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
  },
  headerTextBox: {
    flex: 1,
  },
  topLabel: {
    color: '#a07d47',
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 6,
  },
  accountName: {
    color: '#f2dfb4',
    fontSize: 30,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#f4e7c5',
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#aa9b81',
    fontSize: 14,
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});