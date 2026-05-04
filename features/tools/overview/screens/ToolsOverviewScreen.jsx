import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// data
import { tools } from '../../../../data/tools'

// constants
import { COLORS } from '../../../../constants/colors';
import { s, sv, sf, SCREEN } from '../../../../constants/layout';

// services / hooks aus anderen tools
import { getHabitStreak, getTodayHabitProgress } from '../../habits/services/habits'
import { getDeepWorkTimeLeft } from '../../deep-work/services/deepWorkStore'
import { useSteps } from '../../../steps/hooks/useSteps'
import { useProfile } from '../.././../profile/hooks/useProfile'

// eigene components
import ToolCard from '../components/ToolCard';
import TrackerBox from '../components/Trackerbox';

// styles
import { styles } from '../styles/toolsOverviewStyles';

// < 900pt (iPhone 15 Pro 852pt, iPhone 16 Pro 874pt): kompakte Abstände
// < 700pt (iPhone SE 667pt): sehr kompakte Abstände
const compact = SCREEN.height < 900;
const veryCompact = SCREEN.height < 700;
 
function formatDeepWork(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatSteps(count) {
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}.${String(count % 1000).padStart(3, '0')}`;
  }
  return String(count);
}
 
function renderToolIcon(tool) {
  if (tool.type === 'Ionicons')
    return <Ionicons name={tool.name} size={s(20)} color={tool.color} />;
  if (tool.type === 'MaterialCommunityIcons')
    return <MaterialCommunityIcons name={tool.name} size={s(20)} color={tool.color} />;
  if (tool.type === 'Feather')
    return <Feather name={tool.name} size={s(20)} color={tool.color} />;
  return null;
}
 
export default function ToolsScreen() {
  const { username, growPoints } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const [streak, setStreak] = useState(0);
  const [habitProgress, setHabitProgress] = useState({ completed: 0, total: 0 });
  const [deepWorkTime, setDeepWorkTime] = useState(0);
  const steps = useSteps();

  useEffect(() => {
    getHabitStreak().then(setStreak).catch(() => {});
    getTodayHabitProgress().then(setHabitProgress).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    async function tick() {
      const t = await getDeepWorkTimeLeft();
      if (mounted) setDeepWorkTime(t);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const habitPercent = habitProgress.total === 0
    ? '–'
    : `${Math.round((habitProgress.completed / habitProgress.total) * 100)}%`;

  const trackerItems = [
    { value: String(streak), label: 'Tage Streak' },
    { value: habitPercent, label: 'Tagesziele' },
    { value: deepWorkTime > 0 ? formatDeepWork(deepWorkTime) : '00:00', label: 'Deep Work' },
    { value: formatSteps(steps), label: 'Schritte' },
  ];
 
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }
 
  return (
    <Pressable onPress={() => setMenuOpen(false)} style={styles.screen}>
      <View style={styles.content}>
 
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🌳</Text>
            </View>
            <View style={styles.headerTextBox}>
              <Text style={styles.topLabel}>GROW</Text>
              <Text style={styles.accountName}>{username}</Text>
            </View>
          </View>
 
          <View style={styles.rightHeader}>
            <View style={styles.pointsBox}>
              <View style={styles.pointsRow}>
                <View style={styles.coinPlaceholder}>
                  <Text style={styles.coinStar}>★</Text>
                </View>
                <Text style={styles.pointsValue}>
                  {growPoints.toLocaleString('de-DE')}
                </Text>
              </View>
              <Text style={styles.pointsLabel}>GROW Points</Text>
            </View>
 
            <Pressable
              onPress={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
              style={styles.menuButton}
            >
              <Feather name="more-vertical" size={s(20)} color={COLORS.softGold} />
            </Pressable>
 
            {menuOpen && (
              <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
                <Pressable onPress={() => router.push('/tools/saved-videos')}>
                  <Text style={styles.menuItem}>Gespeicherte Videos</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/tools/privacy')}>
                  <Text style={styles.menuItem}>Datenschutz</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/tools/imprint')}>
                  <Text style={styles.menuItem}>Impressum</Text>
                </Pressable>
                <View style={styles.line} />
                <Pressable onPress={handleLogout}>
                  <Text style={styles.logoutItem}>Logout</Text>
                </Pressable>
              </Pressable>
            )}
          </View>
        </View>
 
        {/* Tools Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOOLS</Text>
          <Text style={styles.sectionSubtitle}>
            Build discipline. Track progress. Become unstoppable.
          </Text>
        </View>
 
        <View style={styles.grid}>
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              icon={renderToolIcon(tool)}
              onPress={tool.disabled ? undefined : () => router.push(tool.route)}
              title={tool.title}
              description={tool.description}
              disabled={tool.disabled}
            />
          ))}
        </View>
 
        {/* KI Mentor Card */}
        <View style={styles.mentorCard}>
          <View style={styles.mentorLeft}>
            <View style={styles.mentorIconWrap}>
              <Ionicons name="sparkles-outline" size={s(28)} color={COLORS.softGold} />
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
 
        {/* Tracker */}
        <View style={styles.trackerSection}>
          <Text style={styles.trackerTitle}>ACTIVE TRACKER</Text>
          <Text style={styles.trackerSubtitle}>
            Deine heutigen Fortschritte auf einen Blick.
          </Text>
          <View style={styles.trackerRow}>
            {trackerItems.map((item, index) => (
              <TrackerBox key={`tracker-${index}`} value={item.value} label={item.label} />
            ))}
          </View>
        </View>
 
      </View>
    </Pressable>
  );
}