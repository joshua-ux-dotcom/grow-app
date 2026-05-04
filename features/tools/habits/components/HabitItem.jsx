import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';

export function HabitItem({
  habit,
  selectedDay,
  done,
  onToggle,
  onDelete,
}) {
  return (
    <Pressable
      style={[styles.habitCard, done && styles.habitCardDone]}
      onPress={() => onToggle(habit.id)}
    >
      <View style={styles.habitLeft}>
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done && (
            <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
          )}
        </View>

        <Text
          style={[styles.habitTitle, done && styles.habitTitleDone]}
          numberOfLines={2}
        >
          {habit.name}
        </Text>
      </View>

      <View style={styles.habitRight}>
        <View style={styles.habitDayDots}>
          {habit.days.map((day) => (
            <View
              key={day}
              style={[
                styles.dayDot,
                day === selectedDay && styles.dayDotActive,
              ]}
            />
          ))}
        </View>

        {done && (
          <Pressable
            style={styles.trashBtn}
            onPress={(event) => {
              event.stopPropagation();
              onDelete(habit.id);
            }}
            hitSlop={s(8)}
          >
            <Ionicons name="trash-outline" size={s(16)} color={COLORS.white} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  habitCard: {
    minHeight: sv(70),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    paddingHorizontal: s(14),
    paddingVertical: sv(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(12),
  },
  habitCardDone: {
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderColor: 'rgba(212,175,55,0.28)',
  },
  habitLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  checkbox: {
    width: s(24),
    height: s(24),
    borderRadius: s(6),
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  habitTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: sf(15),
    fontWeight: '800',
  },
  habitTitleDone: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  habitRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: sv(8),
  },
  habitDayDots: {
    flexDirection: 'row',
    gap: s(4),
  },
  dayDot: {
    width: s(5),
    height: s(5),
    borderRadius: s(999),
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dayDotActive: {
    backgroundColor: COLORS.gold,
  },
  trashBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});