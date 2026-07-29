import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  LayoutAnimation,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s } from '../../../../constants/layout';

import {
  DAYS,
  getTodayIndex,
  getAllDayIndexes,
  groupHabitOverviewItems,
} from '../utils/habitUtils';

import { useHabits } from '../hooks/useHabits';
import { useHabitCollections } from '../hooks/useHabitCollections';
import { HabitItem } from '../components/HabitItem';
import { HabitCollectionItem } from '../components/HabitCollectionItem';
import { AddHabitModal } from '../components/AddHabitModal';
import { styles } from '../styles/habitStyles';
import ToolStateCard from '../../../../components/ui/ToolStateCard';
import { useDelayedLoading } from '../../../../hooks/useDelayedLoading';
import { HABITS_PAGE_BG } from '../../../../constants/toolAssets';
import { tools } from '../../../../data/tools';

function getLinkedToolFromHabit(habit) {
  return habit?.linked_tool_id && habit?.linked_tool_title && habit?.linked_tool_route
    ? {
        id: habit.linked_tool_id,
        title: habit.linked_tool_title,
        route: habit.linked_tool_route,
      }
    : null;
}

export default function HabitsScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const {
    visibleHabits,
    completedIds,
    loading,
    loadError,
    actionError,
    loadHabits,
    setActionError,
    toggle,
    remove,
    add,
    update,
  } = useHabits(selectedDay);

  const {
    collections,
    loadCollections,
  } = useHabitCollections();

  useFocusEffect(
    useCallback(() => {
      void loadCollections({ silent: true });
    }, [loadCollections])
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [inputName, setInputName] = useState('');
  const [modalDays, setModalDays] = useState(new Set());
  const [allDays, setAllDays] = useState(false);
  const [linkedTool, setLinkedTool] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState(null);
  const showLoading = useDelayedLoading(loading);

  const linkableTools = useMemo(
    () => tools.filter((tool) => !tool.disabled && tool.route && tool.id !== 'habits'),
    []
  );

  const collectionChildHabitIds = useMemo(() => {
    const ids = new Set();
    collections.forEach(c => {
      if (c.days.includes(selectedDay)) {
        c.members.forEach(m => ids.add(m.habit_id));
      }
    });
    return ids;
  }, [collections, selectedDay]);

  const visibleFreeHabits = useMemo(
    () => visibleHabits.filter(h => !collectionChildHabitIds.has(h.id)),
    [visibleHabits, collectionChildHabitIds]
  );

  const visibleDueCollections = useMemo(() => {
    return collections
      .filter(c => c.days.includes(selectedDay) && c.members.length > 0)
      .map(c => ({
        ...c,
        progress_completed: c.members.filter(m => completedIds.has(m.habit_id)).length,
        progress_total: c.members.length,
      }));
  }, [collections, selectedDay, completedIds]);

  const overviewGroups = useMemo(
    () => groupHabitOverviewItems(
      visibleFreeHabits,
      visibleDueCollections,
      completedIds
    ),
    [visibleFreeHabits, visibleDueCollections, completedIds]
  );

  const visualProgress = useMemo(() => {
    const completedHabits = visibleFreeHabits.filter(habit => completedIds.has(habit.id)).length;
    const completedCollections = visibleDueCollections.filter(
      collection => collection.progress_total > 0
        && collection.progress_completed === collection.progress_total
    ).length;
    const total = visibleFreeHabits.length + visibleDueCollections.length;
    const completed = completedHabits + completedCollections;
    return { completed, total, ratio: total === 0 ? 0 : completed / total };
  }, [visibleFreeHabits, visibleDueCollections, completedIds]);

  const resetModalState = useCallback(() => {
    setEditingHabit(null);
    setInputName('');
    setModalDays(new Set());
    setAllDays(false);
    setLinkedTool(null);
    setAddError(null);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetModalState();
  }, [resetModalState]);

  const openAddModal = useCallback(() => {
    resetModalState();
    setModalVisible(true);
  }, [resetModalState]);

  const openEditModal = useCallback((habit) => {
    if (!habit?.id) return;

    const days = Array.isArray(habit.days) ? habit.days : [];

    setEditingHabit(habit);
    setInputName(habit.name ?? '');
    setModalDays(new Set(days));
    setAllDays(days.length === 7);
    setLinkedTool(getLinkedToolFromHabit(habit));
    setAddError(null);
    setModalVisible(true);
  }, []);

  const handleSaveHabit = useCallback(async () => {
    const safeName = inputName.trim();
    if (!safeName) return;

    const days = allDays ? getAllDayIndexes() : Array.from(modalDays);
    if (days.length === 0) return;

    setAddError(null);
    setSaving(true);

    try {
      if (editingHabit) {
        await update(editingHabit.id, safeName, days, linkedTool);
      } else {
        await add(safeName, days, linkedTool);
      }

      closeModal();
    } catch (e) {
      setAddError(
        editingHabit
          ? 'Gewohnheit konnte nicht aktualisiert werden. Bitte versuche es erneut.'
          : 'Gewohnheit konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setSaving(false);
    }
  }, [inputName, modalDays, allDays, linkedTool, editingHabit, add, update, closeModal]);

  const toggleModalDay = useCallback((dayIndex) => {
    setModalDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIndex)) next.delete(dayIndex);
      else next.add(dayIndex);
      setAllDays(next.size === 7);
      return next;
    });
  }, []);

  const toggleAllDays = useCallback(() => {
    const next = !allDays;
    setAllDays(next);
    setModalDays(next ? new Set(getAllDayIndexes()) : new Set());
  }, [allDays]);

  const handleOpenLinkedTool = useCallback((habit) => {
    if (!habit?.linked_tool_route) return;
    router.push(habit.linked_tool_route);
  }, []);

  const handleToggleHabit = useCallback((habitId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggle(habitId);
  }, [toggle]);

  const handleOpenCollections = useCallback(() => {
    router.push('/tools/habits-collections');
  }, []);

  const canSave = inputName.trim().length > 0 && (allDays || modalDays.size > 0);

  return (
    <ImageBackground
      source={HABITS_PAGE_BG}
      style={styles.screen}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.pageOverlay} pointerEvents="none" />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>GEWOHNHEITEN</Text>
          <Text style={styles.subtitle}>Build life-changing habits</Text>
        </View>

        {loadError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={s(20)} color={styles.errorIcon.color} />
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={loadHabits} style={styles.retryBtn}>
              <Text style={styles.retryText}>Erneut versuchen</Text>
            </Pressable>
          </View>
        )}

        {actionError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={s(16)} color={styles.errorIcon.color} />
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <Pressable onPress={() => setActionError(null)} hitSlop={s(8)}>
              <Ionicons name="close" size={s(16)} color={COLORS.textDim} />
            </Pressable>
          </View>
        )}

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

        <View style={styles.progressRow}>
          <Text style={styles.sectionTitle}>HEUTE</Text>
          <Text style={styles.counter}>{visualProgress.completed}/{visualProgress.total} erledigt</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${visualProgress.ratio * 100}%` }]} />
          </View>
        </View>

        {showLoading ? (
          <ToolStateCard loading title="Gewohnheiten werden geladen" subtitle="Dein heutiger Fortschritt wird vorbereitet." />
        ) : !loading && visibleFreeHabits.length === 0 && visibleDueCollections.length === 0 ? (
          <ToolStateCard
            icon="flame-outline"
            title="Noch keine Gewohnheiten."
            subtitle="Füge deine erste Gewohnheit hinzu und baue Momentum auf."
          />
        ) : !loading ? (
          <View style={styles.list}>
            {overviewGroups.openCollections.map((collection) => (
              <HabitCollectionItem
                key={collection.id}
                collection={collection}
                completedCount={collection.progress_completed}
                total={collection.progress_total}
                onPress={() => {
                  router.push({
                    pathname: '/tools/habits-collection-detail',
                    params: { collectionId: collection.id },
                  });
                }}
              />
            ))}
            {overviewGroups.openHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                selectedDay={selectedDay}
                done={completedIds.has(habit.id)}
                onToggle={handleToggleHabit}
                onDelete={remove}
                onEdit={openEditModal}
                onOpenLinkedTool={handleOpenLinkedTool}
              />
            ))}
            {overviewGroups.completedCollections.map((collection) => (
              <HabitCollectionItem
                key={collection.id}
                collection={collection}
                completedCount={collection.progress_completed}
                total={collection.progress_total}
                onPress={() => {
                  router.push({
                    pathname: '/tools/habits-collection-detail',
                    params: { collectionId: collection.id },
                  });
                }}
              />
            ))}
            {overviewGroups.completedHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                selectedDay={selectedDay}
                done={completedIds.has(habit.id)}
                onToggle={handleToggleHabit}
                onDelete={remove}
                onEdit={openEditModal}
                onOpenLinkedTool={handleOpenLinkedTool}
              />
            ))}
          </View>
        ) : null}

        <Pressable style={styles.addButton} onPress={handleOpenCollections}>
          <Ionicons name="albums-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Sammlungen verwalten</Text>
        </Pressable>

        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Neue Gewohnheit hinzufügen</Text>
        </Pressable>
      </ScrollView>

      <AddHabitModal
        visible={modalVisible}
        onClose={closeModal}
        inputName={inputName}
        setInputName={setInputName}
        allDays={allDays}
        modalDays={modalDays}
        toggleModalDay={toggleModalDay}
        toggleAllDays={toggleAllDays}
        linkedTool={linkedTool}
        linkableTools={linkableTools}
        onSelectLinkedTool={setLinkedTool}
        onClearLinkedTool={() => setLinkedTool(null)}
        addError={addError}
        canAdd={canSave}
        adding={saving}
        isEditing={Boolean(editingHabit)}
        onAdd={handleSaveHabit}
      />
    </ImageBackground>
  );
}
