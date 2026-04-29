import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, ActivityIndicator, Platform,
  Animated, PanResponder, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import { getTodos, addTodo, toggleTodo, deleteTodo } from '../../../features/todos/services/todo'

// ─── Swipe-to-Delete Komponente ───────────────────────────────────────────────

function SwipeToDelete({ children, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const DELETE_WIDTH = s(80);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(Math.max(dx, -DELETE_WIDTH));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -(DELETE_WIDTH / 2)) {
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  };

  return (
    <View style={{ overflow: 'hidden', borderRadius: s(14) }}>
      {/* Löschen-Button im Hintergrund */}
      <Pressable
        style={styles.deleteAction}
        onPress={() => { close(); onDelete(); }}
      >
        <Ionicons name="trash-outline" size={s(20)} color={COLORS.white} />
        <Text style={styles.deleteLabel}>Löschen</Text>
      </Pressable>

      {/* Verschiebbarer Vordergrund */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function isUrgent(dueAt, completed) {
  if (!dueAt || completed) return false;
  const diff = new Date(dueAt) - new Date();
  return diff > 0 && diff < 60 * 60 * 1000;
}

function isOverdue(dueAt, completed) {
  if (!dueAt || completed) return false;
  return new Date(dueAt) < new Date();
}

function formatDueLabel(dueAt, completed) {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  const diff = d - new Date();

  if (!completed && diff < 0) return 'Überfällig';
  if (!completed && diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / 60000);
    return `Noch ${mins} Min.`;
  }

  const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return `Heute um ${timeStr}`;
  const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `${dateStr} um ${timeStr}`;
}

function sortTodos(todos) {
  const incomplete = [...todos.filter(t => !t.completed)].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });
  const completed = todos.filter(t => t.completed);
  return [...incomplete, ...completed];
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function TodoScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [androidStep, setAndroidStep] = useState('date');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTodos();
      setTodos(sortTodos(data));
    } catch (e) {
      console.log('Fehler beim Laden der Todos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const completedCount = todos.filter(t => t.completed).length;
  const total = todos.length;
  const progress = total === 0 ? 0 : completedCount / total;

  const handleToggle = useCallback(async (id, current) => {
    const next = !current;
    setTodos(prev => sortTodos(prev.map(t => t.id === id ? { ...t, completed: next } : t)));
    try {
      await toggleTodo(id, next);
    } catch {
      setTodos(prev => sortTodos(prev.map(t => t.id === id ? { ...t, completed: current } : t)));
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTodo(id);
    } catch {
      load();
    }
  }, [load]);

  const handleAdd = useCallback(async () => {
    if (!inputTitle.trim()) return;
    setAdding(true);
    try {
      const newTodo = await addTodo(inputTitle.trim(), selectedDate?.toISOString() ?? null);
      setTodos(prev => sortTodos([...prev, newTodo]));
      closeModal();
    } catch (e) {
      console.log('Fehler beim Hinzufügen:', e);
    } finally {
      setAdding(false);
    }
  }, [inputTitle, selectedDate]);

  const closeModal = () => {
    setModalVisible(false);
    setInputTitle('');
    setSelectedDate(null);
    setShowDatePicker(false);
    setAndroidStep('date');
  };

  const datePickerLabel = showDatePicker && selectedDate
    ? `${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um ${selectedDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
    : 'Fälligkeitsdatum setzen';

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      {/* Zurück-Button */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-done-outline" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>TO-DO</Text>
          <Text style={styles.subtitle}>Erledige deine Aufgaben. Gewinne deinen Tag.</Text>
        </View>

        {/* Fortschritt */}
        <View style={styles.progressRow}>
          <Text style={styles.sectionTitle}>AUFGABEN</Text>
          <Text style={styles.counter}>{completedCount}/{total} erledigt</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Liste */}
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: sv(40) }} />
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={s(48)} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Noch keine Aufgaben.</Text>
            <Text style={styles.emptySubText}>Füge deine erste Aufgabe hinzu.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {todos.map(todo => {
              const urgent  = isUrgent(todo.due_at, todo.completed);
              const overdue = isOverdue(todo.due_at, todo.completed);
              const dueLabel = formatDueLabel(todo.due_at, todo.completed);

              return (
                <SwipeToDelete key={todo.id} onDelete={() => handleDelete(todo.id)}>
                  <Pressable
                    style={[
                      styles.todoCard,
                      todo.completed && styles.todoCardDone,
                      urgent   && styles.todoCardUrgent,
                      overdue  && styles.todoCardOverdue,
                    ]}
                    onPress={() => handleToggle(todo.id, todo.completed)}
                  >
                    <View style={styles.todoLeft}>
                      <View style={[
                        styles.checkbox,
                        todo.completed && styles.checkboxDone,
                        urgent   && styles.checkboxUrgent,
                        overdue  && styles.checkboxOverdue,
                      ]}>
                        {todo.completed && (
                          <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
                        )}
                      </View>
                      <View style={styles.todoTextWrap}>
                        <Text
                          style={[
                            styles.todoTitle,
                            todo.completed && styles.todoTitleDone,
                            urgent   && styles.todoTitleUrgent,
                            overdue  && styles.todoTitleOverdue,
                          ]}
                          numberOfLines={2}
                        >
                          {todo.title}
                        </Text>
                        {dueLabel && (
                          <Text style={[
                            styles.todoSub,
                            urgent  && styles.todoSubUrgent,
                            overdue && styles.todoSubOverdue,
                          ]}>
                            {dueLabel}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </SwipeToDelete>
              );
            })}
          </View>
        )}

        {/* Hinzufügen */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Neue Aufgabe hinzufügen</Text>
        </Pressable>
      </ScrollView>

      {/* ── Add-Modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.sheet} onPress={() => {}}>

            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Neue Aufgabe</Text>

            <TextInput
              style={styles.input}
              placeholder="Was willst du erledigen?"
              placeholderTextColor={COLORS.textDim}
              value={inputTitle}
              onChangeText={setInputTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {/* Datum/Uhrzeit Toggle */}
            <Pressable
              style={[styles.dateToggle, showDatePicker && styles.dateToggleActive]}
              onPress={() => {
                if (!showDatePicker) {
                  setSelectedDate(new Date(Date.now() + 60 * 60 * 1000));
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(false);
                  setSelectedDate(null);
                }
              }}
            >
              <Ionicons
                name={showDatePicker ? 'time' : 'time-outline'}
                size={s(17)}
                color={showDatePicker ? COLORS.gold : COLORS.textSecondary}
              />
              <Text style={[styles.dateToggleText, showDatePicker && styles.dateToggleTextActive]}>
                {datePickerLabel}
              </Text>
              {showDatePicker && (
                <Ionicons name="close-circle" size={s(16)} color={COLORS.textDim} />
              )}
            </Pressable>

            {/* DateTimePicker */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode={Platform.OS === 'android' ? androidStep : 'datetime'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                themeVariant="dark"
                accentColor={COLORS.gold}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                      setAndroidStep('date');
                    } else if (androidStep === 'date') {
                      setSelectedDate(date);
                      setAndroidStep('time');
                    } else {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                      setAndroidStep('date');
                    }
                  } else {
                    if (date) setSelectedDate(date);
                  }
                }}
                style={styles.datePicker}
              />
            )}

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, (!inputTitle.trim() || adding) && styles.confirmBtnDisabled]}
                onPress={handleAdd}
                disabled={!inputTitle.trim() || adding}
              >
                {adding
                  ? <ActivityIndicator color={COLORS.black} size="small" />
                  : <Text style={styles.confirmBtnText}>Hinzufügen</Text>
                }
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
    backgroundColor: COLORS.background ?? '#050505',
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
    marginBottom: sv(32),
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
    color: COLORS.paleGold ?? '#F2D48A',
    fontSize: sf(32),
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.textSecondary ?? '#D8C7A3',
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
    lineHeight: sf(20),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sv(12),
  },
  sectionTitle: {
    color: COLORS.paleGold ?? '#F2D48A',
    fontSize: sf(18),
    fontWeight: '700',
    letterSpacing: 2,
  },
  counter: {
    color: COLORS.softGold ?? '#E8C97A',
    fontSize: sf(14),
    fontWeight: '600',
  },
  progressCard: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder ?? 'rgba(212,175,55,0.35)',
    backgroundColor: COLORS.darkCard ?? 'rgba(255,255,255,0.03)',
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
    backgroundColor: COLORS.gold ?? '#D4AF37',
    borderRadius: 999,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: sv(48),
    gap: sv(8),
  },
  emptyText: {
    color: COLORS.textSecondary ?? '#9B9B9B',
    fontSize: sf(16),
    fontWeight: '600',
  },
  emptySubText: {
    color: COLORS.textDim ?? '#6B6B6B',
    fontSize: sf(13),
  },
  list: {
    gap: sv(10),
    marginBottom: sv(8),
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
  checkboxUrgent: { borderColor: 'rgba(220,60,60,0.8)' },
  checkboxOverdue: { borderColor: 'rgba(180,40,40,0.8)' },
  todoTextWrap: { flex: 1 },
  todoTitle: {
    color: COLORS.white ?? '#F4E7C5',
    fontSize: sf(16),
    fontWeight: '700',
  },
  todoTitleDone: {
    color: COLORS.textDim ?? '#6B6B6B',
    textDecorationLine: 'line-through',
  },
  todoTitleUrgent:  { color: 'rgb(255,90,90)' },
  todoTitleOverdue: { color: 'rgb(220,70,70)' },
  todoSub: {
    color: COLORS.textSecondary ?? '#A99B84',
    fontSize: sf(12),
    marginTop: sv(3),
  },
  todoSubUrgent:  { color: 'rgba(255,90,90,0.9)',  fontWeight: '600' },
  todoSubOverdue: { color: 'rgba(220,70,70,0.9)',  fontWeight: '600' },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: s(80),
    backgroundColor: COLORS.error ?? '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sv(4),
  },
  deleteLabel: {
    color: COLORS.white,
    fontSize: sf(11),
    fontWeight: '600',
  },
  addButton: {
    height: sv(54),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: COLORS.goldBorder ?? 'rgba(212,175,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(20),
    backgroundColor: COLORS.darkCard ?? 'rgba(255,255,255,0.025)',
  },
  addText: {
    color: COLORS.softGold ?? '#F2D48A',
    fontSize: sf(15),
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.darkCard ?? '#111111',
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: s(20),
    paddingTop: sv(12),
    paddingBottom: sv(40),
    borderTopWidth: 1,
    borderColor: COLORS.goldBorder ?? 'rgba(212,175,55,0.25)',
  },
  sheetHandle: {
    width: s(40),
    height: sv(4),
    borderRadius: 999,
    backgroundColor: COLORS.textDim ?? '#444',
    alignSelf: 'center',
    marginBottom: sv(20),
  },
  sheetTitle: {
    color: COLORS.paleGold ?? '#F2D48A',
    fontSize: sf(20),
    fontWeight: '700',
    marginBottom: sv(16),
  },
  input: {
    backgroundColor: COLORS.darkCard2 ?? 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle ?? 'rgba(212,175,55,0.2)',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: sv(12),
    color: COLORS.white,
    fontSize: sf(15),
    marginBottom: sv(12),
  },
  dateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(14),
    paddingVertical: sv(11),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle ?? 'rgba(212,175,55,0.2)',
    backgroundColor: COLORS.darkCard2 ?? 'rgba(255,255,255,0.04)',
    marginBottom: sv(12),
  },
  dateToggleActive: {
    borderColor: COLORS.gold ?? '#D4AF37',
    backgroundColor: 'rgba(212,175,55,0.07)',
  },
  dateToggleText: {
    flex: 1,
    color: COLORS.textSecondary ?? '#9B9B9B',
    fontSize: sf(14),
  },
  dateToggleTextActive: {
    color: COLORS.softGold ?? '#E8C97A',
  },
  datePicker: {
    marginBottom: sv(12),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(4),
  },
  cancelBtn: {
    flex: 1,
    height: sv(50),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle ?? 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary ?? '#9B9B9B',
    fontSize: sf(15),
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: sv(50),
    borderRadius: s(12),
    backgroundColor: COLORS.gold ?? '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: {
    color: COLORS.black ?? '#050505',
    fontSize: sf(15),
    fontWeight: '700',
  },
});
