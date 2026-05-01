import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import { useTodos } from '../../../features/todos/hooks/useTodos';
import { TodoItem } from '../../../features/todos/components/TodoItem';
import { AddTodoModal } from '../../../features/todos/components/AddTodoModal';

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function TodoScreen() {
  const {
    todos,
    loading,
    error,
    completedCount,
    totalCount,
    progress,
    loadTodos,
    toggle,
    remove,
    add,
  } = useTodos();

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [androidStep, setAndroidStep] = useState('date');
  const [adding, setAdding] = useState(false);

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

  const handleAdd = async () => {
    if (!inputTitle.trim() || adding) return;

    try {
      setAdding(true);
      await add(inputTitle.trim(), selectedDate);
      closeModal();
    } catch (e) {
      console.log('Fehler beim Hinzufügen der Todo:', e);
    } finally {
      setAdding(false);
    }
  };  

  // ────────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable onPress={loadTodos} style={styles.retryButton}>
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }
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
          <Text style={styles.counter}>{completedCount}/{totalCount} erledigt</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Liste */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={COLORS.gold} />
          </View>
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={s(48)} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Noch keine Aufgaben.</Text>
            <Text style={styles.emptySubText}>Füge deine erste Aufgabe hinzu.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggle}
                onDelete={remove}
              />
            ))}
          </View>
        )}

        {/* Hinzufügen */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Neue Aufgabe hinzufügen</Text>
        </Pressable>
      </ScrollView>

      {/* ── Add-Modal ─────────────────────────────────────────────────────── */}
      <AddTodoModal
        visible={modalVisible}
        onClose={closeModal}
        inputTitle={inputTitle}
        setInputTitle={setInputTitle}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        androidStep={androidStep}
        setAndroidStep={setAndroidStep}
        datePickerLabel={datePickerLabel}
        adding={adding}
        onAdd={handleAdd}
      />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },

  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },

  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: '#000',
    fontWeight: '600',
  },
  
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});