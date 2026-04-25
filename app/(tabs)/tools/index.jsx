import { useCallback, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  Pressable 
} from 'react-native';
import { router } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import ToolCard from '../../../components/ui/ToolCard';
import { tools } from '../../../data/tools';
import { COLORS } from '../../../constants/colors';
import { supabase } from '../../../services/supabaseClient';

const TRACKER_ITEMS = [
  { value: '7', label: 'Tage Streak' },
  { value: '68%', label: 'Tagesziele' },
  { value: '24:37', label: 'Deep Work' },
  { value: '5.432', label: 'Schritte' },
];

function TrackerBox({ value, label }) {
  return (
    <View style={styles.trackerBox}>
      <Text style={styles.trackerValue}>{value}</Text>
      <Text style={styles.trackerLabel}>{label}</Text>
    </View>
  );
}

function renderToolIcon(tool) {
  if (tool.type === 'Ionicons') {
    return <Ionicons name={tool.name} size={20} color={tool.color} />;
  }

  if (tool.type === 'MaterialCommunityIcons') {
    return (
      <MaterialCommunityIcons
        name={tool.name}
        size={20}
        color={tool.color}
      />
    );
  }

  if (tool.type === 'Feather') {
    return <Feather name={tool.name} size={20} color={tool.color} />;
  }

  return null;
}

async function loadProfileData(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, grow_points')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const fallbackUsername = `user_${userId.slice(0, 6)}`;

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: fallbackUsername,
        grow_points: 0,
      })
      .select('username, grow_points')
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      username: newProfile.username,
      growPoints: newProfile.grow_points ?? 0,
    };
  }

  return {
    username: data.username,
    growPoints: data.grow_points ?? 0,
  };
}

export default function ToolsScreen() {
  const [username, setUsername] = useState('Grower');
  const [growPoints, setGrowPoints] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }

      const profileData = await loadProfileData(user.id);

      setUsername(profileData.username);
      setGrowPoints(profileData.growPoints);
    } catch (error) {
      console.log('Fehler beim Laden des Profils:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <Pressable 
      onPress={() => setMenuOpen(false)}
      style={styles.screen}
    >
      <View style={styles.content}>
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
              onPress={(event) => {
                event.stopPropagation();
                setMenuOpen((prev) => (!prev));
              }}
              style={styles.menuButton}
            >
              <Feather name="more-vertical" size={20} color={COLORS.softGold} />
            </Pressable>

            {menuOpen && (
              <Pressable 
                style={styles.dropdown}
                onPress={(event) => event.stopPropagation()}
              >
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

        <View style={styles.mentorCard}>
          <View style={styles.mentorLeft}>
            <View style={styles.mentorIconWrap}>
              <Ionicons
                name="sparkles-outline"
                size={28}
                color={COLORS.softGold}
              />
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
            {TRACKER_ITEMS.map((item, index) => (
              <TrackerBox
                key={`tracker-${index}`}
                value={item.value}
                label={item.label}
              />
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
    backgroundColor: COLORS.black,
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
    borderColor: COLORS.goldBorderLight,
    backgroundColor: COLORS.darkCard3,
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
    color: COLORS.dimGold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  accountName: {
    color: COLORS.softGold,
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
    color: COLORS.softGold,
    fontSize: 18,
    fontWeight: '700',
  },
  pointsLabel: {
    color: COLORS.mutedGold,
    fontSize: 9,
    marginTop: -7,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorderLight,
    backgroundColor: COLORS.darkCard2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 5,
    shadowColor: COLORS.dimGold,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  coinStar: {
    color: COLORS.softGold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: COLORS.paleGold,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: COLORS.mutedGold,
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
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
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
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mentorTextBox: {
    flex: 1,
  },
  mentorTitle: {
    color: COLORS.paleGold,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  mentorDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 12,
  },
  mentorButton: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.darkCard2,
  },
  mentorButtonText: {
    color: COLORS.softGold,
    fontSize: 9.5,
    fontWeight: '700',
  },
  trackerSection: {
    marginTop: 6,
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  trackerTitle: {
    color: COLORS.paleGold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 1,
  },
  trackerSubtitle: {
    color: COLORS.mutedGold,
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
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  trackerValue: {
    color: COLORS.softGold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackerLabel: {
    color: COLORS.mutedGold,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButton: {
    marginLeft: 10,
    padding: 4,
  },

  dropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 190,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 999,
  },

  menuItem: {
    color: COLORS.softGold,
    fontSize: 14,
    paddingVertical: 8,
  },

  logoutItem: {
    color: COLORS.error,
    fontSize: 14,
    paddingVertical: 8,
  },

  line: {
    height: 1,
    backgroundColor: COLORS.goldBorder,
    marginVertical: 6,
  },
});