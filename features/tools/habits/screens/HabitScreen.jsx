import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s } from '../../../../constants/layout';

import {
  DAYS,
  getTodayIndex,
  getAllDayIndexes,
} from '../utils/habitUtils';

import { useHabits } from '../hooks/useHabits';
import { HabitItem } from '../components/HabitItem';
import { AddHabitModal } from '../components/AddHabitModal';
import { styles } from '../styles/habitStyles';

export default function HabitsScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const {
    visibleHabits,
    completedIds,
    loading,
    loadError,
    actionError,
    completedCount,
    total,
    progress,
    loadHabits,
    setActionError,
    toggle,
    remove,
    add,
  } = useHabits(selectedDay);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [modalDays, setModalDays] = useState(new Set());
  const [allDays, setAllDays] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const handleAdd = useCallback(async () => {
    if (!inputName.trim()) return;

    const days = allDays ? getAllDayIndexes() : Array.from(modalDays);
    if (days.length === 0) return;

    setAddError(null);
    setAdding(true);

    try {
      await add(inputName.trim(), days);
      closeModal();
    } catch (e) {
      setAddError('Gewohnheit konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setAdding(false);
    }
  }, [inputName, modalDays, allDays, add]);

  const closeModal = () => {
    setModalVisible(false);
    setInputName('');
    setModalDays(new Set());
    setAllDays(false);
    setAddError(null);
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
    setModalDays(next ? new Set(getAllDayIndexes()) : new Set());
  };

  const canAdd = inputName.trim().length > 0 && (allDays || modalDays.size > 0);

  return (
    <View style={styles.screen}>

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

        {/* Ladefehler */}
        {loadError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={s(20)} color={styles.errorIcon.color} />
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={loadHabits} style={styles.retryBtn}>
              <Text style={styles.retryText}>Erneut versuchen</Text>
            </Pressable>
          </View>
        )}

        {/* Aktionsfehler (Abhaken, Löschen) */}
        {actionError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={s(16)} color={styles.errorIcon.color} />
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <Pressable onPress={() => setActionError(null)} hitSlop={s(8)}>
              <Ionicons name="close" size={s(16)} color={COLORS.textDim} />
            </Pressable>
          </View>
        )}

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
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={COLORS.gold} />
          </View>
        ) : total === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flame-outline" size={s(48)} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Noch keine Gewohnheiten.</Text>
            <Text style={styles.emptySubText}>Füge deine erste Gewohnheit hinzu.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                selectedDay={selectedDay}
                done={completedIds.has(habit.id)}
                onToggle={toggle}
                onDelete={remove}
              />
            ))}
          </View>
        )}

        {/* Hinzufügen */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Neue Gewohnheit hinzufügen</Text>
        </Pressable>

      </ScrollView>

      {/* ── Add-Modal ─────────────────────────────────────────────────────── */}
      <AddHabitModal
        visible={modalVisible}
        onClose={closeModal}
        inputName={inputName}
        setInputName={setInputName}
        allDays={allDays}
        modalDays={modalDays}
        toggleModalDay={toggleModalDay}
        toggleAllDays={toggleAllDays}
        addError={addError}
        canAdd={canAdd}
        adding={adding}
        onAdd={handleAdd}
      />
    </View>
  );
}