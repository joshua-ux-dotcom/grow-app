import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getTodayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [modalDays, setModalDays] = useState(new Set());
  const [allDays, setAllDays] = useState(false);
  const [adding, setAdding] = useState(false);

  const visibleHabits = habits.filter(h => h.days.includes(selectedDay));
  const dayCompletions = completions[selectedDay] ?? {};
  const completedCount = visibleHabits.filter(h => dayCompletions[h.id]).length;
  const total = visibleHabits.length;
  const progress = total === 0 ? 0 : completedCount / total;

  const handleToggle = useCallback((id) => {
    setCompletions(prev => {
      const dayData = { ...(prev[selectedDay] ?? {}) };
      dayData[id] = !dayData[id];
      return { ...prev, [selectedDay]: dayData };
    });
  }, [selectedDay]);

  const handleDelete = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(day => {
        if (next[day][id]) {
          next[day] = { ...next[day] };
          delete next[day][id];
        }
      });
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (!inputName.trim()) return;
    const days = allDays ? [0, 1, 2, 3, 4, 5, 6] : Array.from(modalDays);
    if (days.length === 0) return;
    setAdding(true);
    const newHabit = { id: Date.now().toString(), name: inputName.trim(), days };
    setHabits(prev => [...prev, newHabit]);
    setTimeout(() => {
      setAdding(false);
      closeModal();
    }, 200);
  }, [inputName, modalDays, allDays]);

  const closeModal = () => {
    setModalVisible(false);
    setInputName('');
    setModalDays(new Set());
    setAllDays(false);
  };

  const toggleModalDay = (dayIndex) => {
    setModalDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIndex)) next.delete(dayIndex);
      else next.add(dayIndex);
      setAllDays(next.size === 7);
      return next;
    });
  };

  const toggleAllDays = () => {
    const next = !allDays;
    setAllDays(next);
    setModalDays(next ? new Set([0, 1, 2, 3, 4, 5, 6]) : new Set());
  };

  const canAdd = inputName.trim().length > 0 && (allDays || modalDays.size > 0);

  return (
    <View style={styles.screen}>

      {/* Zurück-Button */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="flame" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>GEWOHNHEITEN</Text>
          <Text style={styles.subtitle}>Build life-changing habits</Text>
        </View>

        {/* Tages-Auswahl */}
        <View style={styles.dayRow}>
          {DAYS.map((day, index) => (
            <Pressable
              key={day}
              style={[styles.dayBtn, selectedDay === index && styles.dayBtnActive]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayBtnText, selectedDay === index && styles.dayBtnTextActive]}>
                {day}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Fortschritt */}
        <View style={styles.progressRow}>
          <Text style={styles.sectionTitle}>HEUTE</Text>
          <Text style={styles.counter}>{completedCount}/{total} erledigt</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Liste */}
        {total === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flame-outline" size={s(48)} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Noch keine Gewohnheiten.</Text>
            <Text style={styles.emptySubText}>Füge deine erste Gewohnheit hinzu.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleHabits.map(habit => {
              const done = !!dayCompletions[habit.id];
              return (
                <Pressable
                  key={habit.id}
                  style={[styles.habitCard, done && styles.habitCardDone]}
                  onPress={() => handleToggle(habit.id)}
                >
                  <View style={styles.habitLeft}>
                    <View style={[styles.checkbox, done && styles.checkboxDone]}>
                      {done && <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />}
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
                      {habit.days.map(d => (
                        <View
                          key={d}
                          style={[styles.dayDot, d === selectedDay && styles.dayDotActive]}
                        />
                      ))}
                    </View>
                    {done && (
                      <Pressable
                        style={styles.trashBtn}
                        onPress={() => handleDelete(habit.id)}
                        hitSlop={s(8)}
                      >
                        <Ionicons name="trash-outline" size={s(16)} color={COLORS.white} />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Hinzufügen */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Neue Gewohnheit hinzufügen</Text>
        </Pressable>

      </ScrollView>

      {/* ── Add-Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.overlay} onPress={closeModal}>
            <Pressable style={styles.sheet} onPress={() => {}}>

              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Neue Gewohnheit</Text>

              <TextInput
                style={styles.input}
                placeholder="Name der Gewohnheit"
                placeholderTextColor={COLORS.textDim}
                value={inputName}
                onChangeText={setInputName}
                autoFocus
                returnKeyType="done"
              />

              {/* Tage auswählen */}
              <Text style={styles.dayLabel}>An welchen Tagen?</Text>
              <View style={styles.modalDayRow}>
                {DAYS.map((day, index) => {
                  const active = allDays || modalDays.has(index);
                  return (
                    <Pressable
                      key={day}
                      style={[styles.modalDayBtn, active && styles.modalDayBtnActive]}
                      onPress={() => toggleModalDay(index)}
                    >
                      <Text style={[styles.modalDayText, active && styles.modalDayTextActive]}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Alle Tage Checkbox */}
              <Pressable style={styles.allDaysRow} onPress={toggleAllDays}>
                <View style={[styles.checkboxSmall, allDays && styles.checkboxSmallDone]}>
                  {allDays && <Ionicons name="checkmark" size={s(11)} color={COLORS.black} />}
                </View>
                <Text style={styles.allDaysText}>An allen Tagen</Text>
              </Pressable>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmBtn, (!canAdd || adding) && styles.confirmBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!canAdd || adding}
                >
                  <Text style={styles.confirmBtnText}>Hinzufügen</Text>
                </Pressable>
              </View>

            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  backText: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '600',
  },
  content: {
    paddingTop: sv(110),
    paddingHorizontal: s(20),
    paddingBottom: sv(120),
  },
  header: {
    alignItems: 'center',
    marginBottom: sv(28),
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
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sv(24),
    gap: s(6),
  },
  dayBtn: {
    flex: 1,
    height: sv(38),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard,
  },
  dayBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  dayBtnText: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '700',
  },
  dayBtnTextActive: {
    color: COLORS.black,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sv(12),
  },
  sectionTitle: {
    color: COLORS.paleGold,
    fontSize: sf(18),
    fontWeight: '700',
    letterSpacing: 2,
  },
  counter: {
    color: COLORS.softGold,
    fontSize: sf(14),
    fontWeight: '600',
  },
  progressCard: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    borderRadius: s(12),
    padding: s(12),
    marginBottom: sv(20),
  },
  progressTrack: {
    height: sv(7),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 999,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: sv(48),
    gap: sv(8),
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: sf(16),
    fontWeight: '600',
  },
  emptySubText: {
    color: COLORS.textDim,
    fontSize: sf(13),
  },
  list: {
    gap: sv(10),
    marginBottom: sv(8),
  },
  habitCard: {
    minHeight: sv(64),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
    backgroundColor: COLORS.darkCard,
    paddingHorizontal: s(16),
    paddingVertical: sv(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitCardDone: {
    borderColor: 'rgba(212,175,55,0.15)',
    backgroundColor: 'rgba(212,175,55,0.04)',
    opacity: 0.65,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    flex: 1,
  },
  checkbox: {
    width: s(24),
    height: s(24),
    borderRadius: s(6),
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  habitTitle: {
    color: COLORS.white,
    fontSize: sf(16),
    fontWeight: '700',
    flex: 1,
  },
  habitTitleDone: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  habitDayDots: {
    flexDirection: 'row',
    gap: s(3),
  },
  dayDot: {
    width: s(5),
    height: s(5),
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  dayDotActive: {
    backgroundColor: COLORS.gold,
  },
  trashBtn: {
    padding: s(4),
    opacity: 0.5,
  },
  addButton: {
    height: sv(54),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(20),
    backgroundColor: COLORS.darkCard,
  },
  addText: {
    color: COLORS.softGold,
    fontSize: sf(15),
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: s(20),
    paddingTop: sv(12),
    paddingBottom: sv(40),
    borderTopWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  sheetHandle: {
    width: s(40),
    height: sv(4),
    borderRadius: 999,
    backgroundColor: COLORS.textDim,
    alignSelf: 'center',
    marginBottom: sv(20),
  },
  sheetTitle: {
    color: COLORS.paleGold,
    fontSize: sf(20),
    fontWeight: '700',
    marginBottom: sv(16),
  },
  input: {
    backgroundColor: COLORS.darkCard2,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: sv(12),
    color: COLORS.white,
    fontSize: sf(15),
    marginBottom: sv(16),
  },
  dayLabel: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '600',
    marginBottom: sv(10),
    letterSpacing: 0.5,
  },
  modalDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(6),
    marginBottom: sv(14),
  },
  modalDayBtn: {
    flex: 1,
    height: sv(36),
    borderRadius: s(9),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard2,
  },
  modalDayBtnActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: COLORS.gold,
  },
  modalDayText: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '700',
  },
  modalDayTextActive: {
    color: COLORS.gold,
  },
  allDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: sv(20),
  },
  checkboxSmall: {
    width: s(20),
    height: s(20),
    borderRadius: s(5),
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSmallDone: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  allDaysText: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(10),
  },
  cancelBtn: {
    flex: 1,
    height: sv(50),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: sf(15),
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: sv(50),
    borderRadius: s(12),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: {
    color: COLORS.black,
    fontSize: sf(15),
    fontWeight: '700',
  },
});