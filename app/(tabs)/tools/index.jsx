import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import ToolCard from '../../../components/ui/ToolCard'
import TrackerBox from '../../../components/ui/Trackerbox';
import { tools } from '../../../data/tools';
import { COLORS } from '../../../constants/colors';
import { supabase } from '../../../services/supabaseClient';
import { useProfile } from '../../../features/profile/hooks/useProfile';
import { s, sv, sf, SCREEN } from '../../../constants/layout';
import { getHabitStreak, getTodayHabitProgress } from '../../../features/habits/services/habits';
import { getDeepWorkTimeLeft } from '../../../features/deep-work/services/deepWorkStore'
import { useSteps } from '../../../features/steps/hooks/useSteps';

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
 
const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: COLORS.black 
  },
  content: {
    flex: 1,
    paddingTop: sv(66),
    paddingHorizontal: s(14),
    paddingBottom: sv(72),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: veryCompact ? sv(2) : compact ? sv(6) : sv(16),
    paddingHorizontal: s(2)
  },
  leftHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  avatar: { 
    width: s(56), 
    height: s(56), 
    borderRadius: s(28), 
    borderWidth: 1.5, 
    borderColor: COLORS.goldBorderLight, 
    backgroundColor: COLORS.darkCard3, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(12) 
  },
  avatarText: { 
    fontSize: sf(20) 
  },
  headerTextBox: { 
    flex: 1 
  },
  topLabel: { 
    color: COLORS.dimGold, 
    fontSize: sf(10), 
    letterSpacing: 2, 
    marginBottom: sv(2) 
  },
  accountName: { 
    color: COLORS.softGold, 
    fontSize: sf(20), 
    fontWeight: '700' 
  },
  rightHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  pointsBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(12), 
  },
  pointsRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: sv(2),
  },
  coinPlaceholder: { 
    width: s(24), 
    height: s(24), 
    borderRadius: s(12), 
    borderWidth: 1.5, 
    borderColor: COLORS.goldBorderLight, 
    backgroundColor: COLORS.darkCard2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(6), 
    shadowColor: COLORS.dimGold, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 6 
  },
  coinStar: { 
    color: COLORS.softGold, 
    fontSize: sf(11), 
    fontWeight: '700', 
  },
  pointsValue: { 
    color: COLORS.softGold, 
    fontSize: sf(18), 
    fontWeight: '700' 
  },
  pointsLabel: { 
    color: COLORS.mutedGold, 
    fontSize: sf(9),
    textAlign: 'center',
  },
  menuButton: { 
    marginLeft: s(10), 
    padding: s(4) 
  },
  dropdown: { 
    position: 'absolute', 
    top: sv(46), 
    right: 0, 
    width: s(190), 
    backgroundColor: COLORS.darkCard, 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    borderRadius: s(14), 
    paddingVertical: sv(10), 
    paddingHorizontal: s(14), 
    zIndex: 999 
  },
  menuItem: { 
    color: COLORS.softGold, 
    fontSize: sf(14), 
    paddingVertical: 8 
  },
  logoutItem: { 
    color: COLORS.error, 
    fontSize: sf(14), 
    paddingVertical: 8 
  },
  line: { 
    height: 1, 
    backgroundColor: COLORS.goldBorder, 
    marginVertical: 6 
  },
  sectionHeader: {
    marginBottom: veryCompact ? sv(2) : compact ? sv(4) : sv(12),
    paddingHorizontal: s(2)
  },
  sectionTitle: { 
    color: COLORS.paleGold, 
    fontSize: sf(22), 
    fontWeight: '700', 
    marginBottom: sv(4), 
    letterSpacing: 1 
  },
  sectionSubtitle: { 
    color: COLORS.mutedGold, 
    fontSize: sf(12.5), 
    lineHeight: sf(18) 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  mentorCard: {
    marginTop: compact ? 0 : sv(4),
    marginBottom: veryCompact ? sv(2) : compact ? sv(4) : sv(10),
    borderRadius: s(16), 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    backgroundColor: COLORS.darkCard, 
    paddingVertical: sv(8), 
    paddingHorizontal: s(12), 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    minHeight: sv(82) 
  },
  mentorLeft: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  mentorIconWrap: { 
    width: s(42), 
    height: s(42), 
    borderRadius: s(12), 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    backgroundColor: COLORS.darkCard2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(10) 
  },
  mentorTextBox: { 
    flex: 1 
  },
  mentorTitle: { 
    color: COLORS.paleGold, 
    fontSize: sf(13.5), 
    fontWeight: '700', 
    marginBottom: sv(2) 
  },
  mentorDescription: { 
    color: COLORS.textMuted, 
    fontSize: sf(9), 
    lineHeight: 12 
  },
  mentorButton: { 
    borderWidth: 1,
    borderColor: COLORS.goldBorder, 
    borderRadius: 999, 
    paddingVertical: sv(6), 
    paddingHorizontal: s(10), 
    backgroundColor: COLORS.darkCard2 
  },
  mentorButtonText: { 
    color: COLORS.softGold, 
    fontSize: sf(9.5), 
    fontWeight: '700' 
  },
  trackerSection: {
    flex: 1,
    marginTop: sv(4),
    paddingHorizontal: s(2),
  },
  trackerTitle: {
    color: COLORS.paleGold,
    fontSize: sf(15),
    fontWeight: '700',
    marginBottom: sv(2),
    letterSpacing: 1
  },
  trackerSubtitle: {
    color: COLORS.mutedGold,
    fontSize: sf(11),
    marginBottom: sv(4),
  },
  trackerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
    maxHeight: sv(110),
  },
});