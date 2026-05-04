import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../constants/colors';
import { s } from '../../../../constants/layout';
import { useTodos } from '../hooks/useTodos';
import { TodoItem } from '../components/TodoItem'
import { AddTodoModal } from '../components/AddTodoModal';
import { styles } from '../styles/todoStyles';

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