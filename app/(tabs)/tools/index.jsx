import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';

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
  const tools = [
    {
      title: 'To-Do',
      description: 'Plane deinen Tag.',
      icon: <Ionicons name="checkmark-outline" size={20} color="#f2dfb4" />,
      onPress: () => router.push('/tools/todo'),
    },
    {
      title: 'Trainingsplan',
      description: 'Erstelle Trainingstage.',
      icon: (
        <MaterialCommunityIcons
          name="dumbbell"
          size={20}
          color="#f2dfb4"
        />
      ),
      onPress: () => router.push('/tools/training-plan'),
    },
    {
      title: 'Ziele',
      description: 'Setze große Ziele.',
      icon: <Feather name="target" size={20} color="#f2dfb4" />,
      onPress: () => router.push('/tools/goals'),
    },
    {
      title: 'Gewohnheiten',
      description: 'Baue Streaks auf.',
      icon: <Ionicons name="flame-outline" size={20} color="#f2dfb4" />,
      onPress: () => router.push('/tools/habits'),
    },
    {
      title: 'Deep Work',
      description: 'Fokus ohne Ablenkungen',
      icon: <Feather name="clock" size={20} color="#f2dfb4" />,
      onPress: () => router.push('/tools/deep-work'),
    },
    {
      title: 'Tagesplaner',
      description: 'Strukturiere deinen Tag.',
      icon: <Ionicons name="calendar-outline" size={20} color="#f2dfb4" />,
      onPress: () => router.push('/tools/daily-planner'),
    },
    {
      title: 'In Bearbeitung',
      description: 'Bleib dran – hier entsteht etwas Großes.',
      icon: <Feather name="tool" size={20} color="#d6d0db" />,
      disabled: true,
    },
    {
      title: 'In Bearbeitung',
      description: 'Bleib dran – hier entsteht etwas Großes.',
      icon: <Feather name="tool" size={20} color="#d6d0db" />,
      disabled: true,
    },
    {
      title: 'In Bearbeitung',
      description: 'Bleib dran – hier entsteht etwas Großes.',
      icon: <Feather name="tool" size={20} color="#d6d0db" />,
      disabled: true,
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🌳</Text>
            </View>

            <View style={styles.headerTextBox}>
              <Text style={styles.topLabel}>GROW</Text>
              <Text style={styles.accountName}>Grower</Text>
            </View>
          </View>

          <View style={styles.pointsBox}>
            <Text style={styles.pointsValue}>18.760</Text>
            <Text style={styles.pointsLabel}>GROW Points</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOOLS</Text>
          <Text style={styles.sectionSubtitle}>
            Build discipline. Track progress. Become unstoppable.
          </Text>
        </View>

        <View style={styles.grid}>
          {tools.map((tool, index) => (
            <ToolCard
              key={`${tool.title}-${index}`}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              onPress={tool.onPress}
              disabled={tool.disabled}
            />
          ))}
        </View>

        <View style={styles.mentorCard}>
          <View style={styles.mentorLeft}>
            <View style={styles.mentorIconWrap}>
              <Ionicons name="sparkles-outline" size={28} color="#f2dfb4" />
            </View>

            <View style={styles.mentorTextBox}>
              <Text style={styles.mentorTitle}>KI Mentor</Text>
              <Text style={styles.mentorDescription}>
                Dein persönlicher Mentor. Klare Tipps & Motivation.
              </Text>
            </View>
          </View>

          <View style={styles.mentorButton}>
            <Text style={styles.mentorButtonText}>In Bearbeitung</Text>
          </View>
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
    paddingTop: 66,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#89683a',
    backgroundColor: '#100b15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  headerTextBox: {
    flex: 1,
  },
  topLabel: {
    color: '#a07d47',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  accountName: {
    color: '#f2dfb4',
    fontSize: 20,
    fontWeight: '700',
  },
  pointsBox: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: 18,
    marginBottom: -2,
  },  
  pointsValue: {
    color: '#f2dfb4',
    fontSize: 18,
    fontWeight: '700',
  },
  pointsLabel: {
    color: '#9c8f78',
    fontSize: 9,
    marginTop: 1,
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
  mentorCard: {
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7f6236',
    backgroundColor: '#0d0913',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 82,
  },
  mentorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7f6236',
    backgroundColor: '#120d19',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mentorTextBox: {
    flex: 1,
  },
  mentorTitle: {
    color: '#f4e7c5',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  mentorDescription: {
    color: '#a89881',
    fontSize: 9,
    lineHeight: 12,
  },
  mentorButton: {
    borderWidth: 1,
    borderColor: '#7f6236',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#120d19',
  },
  mentorButtonText: {
    color: '#f2dfb4',
    fontSize: 9.5,
    fontWeight: '700',
  },
  trackerSection: {
    marginTop: 6,
    marginBottom: 24,
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