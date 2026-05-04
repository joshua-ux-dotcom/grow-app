import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';
import {
  MONTH_NAMES,
  DAY_NAMES_SHORT,
  buildCalendarCells,
} from '../utils/plannerUtils';

export function PlannerCalendar({
  currentYear,
  currentMonth,
  todayStr,
  monthEventDates,
  onPrevMonth,
  onNextMonth,
  onOpenDay,
}) {
  const cells = buildCalendarCells(currentYear, currentMonth);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.calContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>DAILY PLANNER</Text>
          <Text style={styles.subtitle}>Plane deinen Tag. Gestalte dein Leben.</Text>
        </View>

        <View style={styles.monthNav}>
          <Pressable onPress={onPrevMonth} style={styles.monthArrow} hitSlop={s(12)}>
            <Ionicons name="chevron-back" size={s(22)} color={COLORS.softGold} />
          </Pressable>

          <Text style={styles.monthLabel}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>

          <Pressable onPress={onNextMonth} style={styles.monthArrow} hitSlop={s(12)}>
            <Ionicons name="chevron-forward" size={s(22)} color={COLORS.softGold} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {DAY_NAMES_SHORT.map(day => (
            <View key={day} style={styles.weekCell}>
              <Text style={styles.weekLabel}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calGrid}>
          {cells.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.calCell} />;
            }

            const monthText = String(currentMonth + 1).padStart(2, '0');
            const dayText = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${monthText}-${dayText}`;
            const isToday = dateStr === todayStr;
            const hasEvent = monthEventDates.has(dateStr);

            return (
              <Pressable
                key={dateStr}
                style={[styles.calCell, isToday && styles.calCellToday]}
                onPress={() => onOpenDay(dateStr)}
              >
                <Text style={[styles.calDayNum, isToday && styles.calDayNumToday]}>
                  {day}
                </Text>
                {hasEvent && <View style={[styles.dot, isToday && styles.dotToday]} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    position: 'absolute',
    top: sv(54),
    left: s(16),
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  backText: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '700',
  },
  calContent: {
    paddingTop: sv(110),
    paddingHorizontal: s(20),
    paddingBottom: sv(100),
  },
  header: {
    alignItems: 'center',
    marginBottom: sv(26),
  },
  iconCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sv(16),
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  title: {
    color: COLORS.paleGold,
    fontSize: sf(28),
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sv(18),
  },
  monthArrow: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  monthLabel: {
    color: COLORS.white,
    fontSize: sf(19),
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: sv(8),
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    color: COLORS.textDim,
    fontSize: sf(12),
    fontWeight: '900',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: s(18),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  calCellToday: {
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  calDayNum: {
    color: COLORS.white,
    fontSize: sf(15),
    fontWeight: '800',
  },
  calDayNumToday: {
    color: COLORS.gold,
  },
  dot: {
    width: s(5),
    height: s(5),
    borderRadius: s(999),
    backgroundColor: COLORS.softGold,
    marginTop: sv(4),
  },
  dotToday: {
    backgroundColor: COLORS.gold,
  },
});