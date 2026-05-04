import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';
import {
  isUrgent,
  isOverdue,
  formatDueLabel,
} from '../utils/todoUtils';

export function TodoItem({ todo, onToggle, onDelete }) {
  const urgent = isUrgent(todo.due_at, todo.completed);
  const overdue = isOverdue(todo.due_at, todo.completed);
  const dueLabel = formatDueLabel(todo.due_at, todo.completed);

  return (
    <View style={styles.todoCardWrap}>
      <Pressable
        style={[
          styles.todoCard,
          todo.completed && styles.todoCardDone,
          urgent && styles.todoCardUrgent,
          overdue && styles.todoCardOverdue,
        ]}
        onPress={() => onToggle(todo.id, todo.completed)}
      >
        <View style={styles.todoLeft}>
          <View
            style={[
              styles.checkbox,
              todo.completed && styles.checkboxDone,
              urgent && styles.checkboxUrgent,
              overdue && styles.checkboxOverdue,
            ]}
          >
            {todo.completed && (
              <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
            )}
          </View>

          <View style={styles.todoTextWrap}>
            <Text
              style={[
                styles.todoTitle,
                todo.completed && styles.todoTitleDone,
                urgent && styles.todoTitleUrgent,
                overdue && styles.todoTitleOverdue,
              ]}
              numberOfLines={2}
            >
              {todo.title}
            </Text>

            {dueLabel && (
              <Text
                style={[
                  styles.todoSub,
                  urgent && styles.todoSubUrgent,
                  overdue && styles.todoSubOverdue,
                ]}
              >
                {dueLabel}
              </Text>
            )}
          </View>

          {todo.completed && (
            <Pressable
              style={styles.completedDeleteButton}
              onPress={(event) => {
                event.stopPropagation();
                onDelete(todo.id);
              }}
              hitSlop={s(10)}
            >
              <Ionicons name="trash-outline" size={s(21)} color={COLORS.white} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  todoCardWrap: {
    borderRadius: s(14),
    overflow: 'hidden',
  },
  todoCard: {
    minHeight: sv(68),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: COLORS.goldBorder ?? 'rgba(212,175,55,0.22)',
    backgroundColor: COLORS.darkCard ?? 'rgba(255,255,255,0.035)',
    paddingHorizontal: s(16),
    paddingVertical: sv(12),
    justifyContent: 'center',
  },
  todoCardDone: {
    borderColor: 'rgba(212,175,55,0.15)',
    backgroundColor: 'rgba(212,175,55,0.04)',
    opacity: 0.65,
  },
  todoCardUrgent: {
    borderColor: 'rgba(220,60,60,0.6)',
    backgroundColor: 'rgba(220,60,60,0.08)',
  },
  todoCardOverdue: {
    borderColor: 'rgba(180,40,40,0.5)',
    backgroundColor: 'rgba(180,40,40,0.07)',
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },
  checkbox: {
    width: s(24),
    height: s(24),
    borderRadius: s(6),
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder ?? '#B8924B',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: COLORS.gold ?? '#D4AF37',
    borderColor: COLORS.gold ?? '#D4AF37',
  },
  checkboxUrgent: {
    borderColor: 'rgba(220,60,60,0.8)',
  },
  checkboxOverdue: {
    borderColor: 'rgba(180,40,40,0.8)',
  },
  todoTextWrap: {
    flex: 1,
  },
  todoTitle: {
    color: COLORS.white ?? '#F4E7C5',
    fontSize: sf(16),
    fontWeight: '700',
  },
  todoTitleDone: {
    color: COLORS.textDim ?? '#6B6B6B',
    textDecorationLine: 'line-through',
  },
  todoTitleUrgent: {
    color: 'rgb(255,90,90)',
  },
  todoTitleOverdue: {
    color: 'rgb(220,70,70)',
  },
  todoSub: {
    color: COLORS.textSecondary ?? '#A99B84',
    fontSize: sf(12),
    marginTop: sv(3),
  },
  todoSubUrgent: {
    color: 'rgba(255,90,90,0.9)',
    fontWeight: '600',
  },
  todoSubOverdue: {
    color: 'rgba(220,70,70,0.9)',
    fontWeight: '600',
  },
  completedDeleteButton: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});