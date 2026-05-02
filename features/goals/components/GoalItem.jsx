import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';

export function GoalItem({ goal, onToggle, onDelete }) {
  return (
    <Pressable
      style={[styles.goalCard, goal.completed && styles.goalCardDone]}
      onPress={() => onToggle(goal.id, goal.completed)}
    >
      <View style={styles.goalLeft}>
        <View style={[styles.checkbox, goal.completed && styles.checkboxDone]}>
          {goal.completed && (
            <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
          )}
        </View>

        <View style={styles.goalTextCol}>
          <Text
            style={[styles.goalTitle, goal.completed && styles.goalTitleDone]}
            numberOfLines={2}
          >
            {goal.name}
          </Text>

          {goal.deadline ? (
            <Text style={[styles.goalDeadline, goal.completed && styles.goalDeadlineDone]}>
              <Ionicons
                name="calendar-outline"
                size={sf(11)}
                color={goal.completed ? COLORS.textDim : COLORS.softGold}
              />
              {'  '}
              {goal.deadline}
            </Text>
          ) : null}
        </View>
      </View>

      {goal.completed && (
        <Pressable
          style={styles.trashBtn}
          onPress={(event) => {
            event.stopPropagation();
            onDelete(goal.id);
          }}
          hitSlop={s(8)}
        >
          <Ionicons name="trash-outline" size={s(16)} color={COLORS.white} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    minHeight: sv(74),
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
  goalCardDone: {
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderColor: 'rgba(212,175,55,0.28)',
  },
  goalLeft: {
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
  goalTextCol: {
    flex: 1,
  },
  goalTitle: {
    color: COLORS.white,
    fontSize: sf(15),
    fontWeight: '800',
  },
  goalTitleDone: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  goalDeadline: {
    marginTop: sv(5),
    color: COLORS.softGold,
    fontSize: sf(12),
    fontWeight: '700',
  },
  goalDeadlineDone: {
    color: COLORS.textDim,
  },
  trashBtn: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});