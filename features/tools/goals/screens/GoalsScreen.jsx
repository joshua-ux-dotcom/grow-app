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

// constants
import { COLORS } from '../../../../constants/colors';
import { s } from '../../../../constants/layout';

// feature intern
import { useGoals } from '../hooks/useGoals';
import { GoalItem } from '../components/GoalItem';
import { AddGoalModal } from '../components/AddGoalModal';
import { styles } from '../styles/goalsStyles';
import { GOAL_CATEGORIES } from '../utils/goalUtils';

export default function GoalsScreen() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const {
    goals,
    loading,
    loadError,
    actionError,
    completedCount,
    total,
    progress,
    toggle,
    remove,
    add,
  } = useGoals(selectedCategory);

  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputDeadline, setInputDeadline] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const handleAdd = useCallback(async () => {
    if (!inputName.trim()) return;

    setAddError(null);
    setAdding(true);

    try {
      await add(inputName.trim(), selectedCategory, inputDeadline.trim());
      closeModal();
    } catch (e) {
      setAddError('Ziel konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setAdding(false);
    }
  }, [inputName, inputDeadline, selectedCategory, add]);

  const closeModal = () => {
    setModalVisible(false);
    setInputName('');
    setInputDeadline('');
    setAddError(null);
  };

  const canAdd = inputName.trim().length > 0;

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
            <Ionicons name="trophy" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>Set clear goals. Chase your dreams.</Text>
        </View>

        {/* Ladefehler */}
        {loadError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={s(20)} color={styles.errorIcon.color} />
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={loadGoals} style={styles.retryBtn}>
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

        {/* Kategorie-Tabs */}
        <View style={styles.categoryRow}>
          {GOAL_CATEGORIES.map((cat, index) => (
            <Pressable
              key={cat}
              style={[styles.catBtn, selectedCategory === index && styles.catBtnActive]}
              onPress={() => setSelectedCategory(index)}
            >
              <Text style={[styles.catBtnText, selectedCategory === index && styles.catBtnTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Fortschritt */}
        <View style={styles.progressRow}>
          <Text style={styles.sectionTitle}>{GOAL_CATEGORIES[selectedCategory].toUpperCase()}</Text>
          <Text style={styles.counter}>{completedCount}/{total} erreicht</Text>
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
            <Ionicons name="trophy-outline" size={s(48)} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Noch keine Ziele.</Text>
            <Text style={styles.emptySubText}>Füge dein erstes Ziel hinzu.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map(goal => (
              <GoalItem
                key={goal.id}
                goal={goal}
                onToggle={toggle}
                onDelete={remove}
              />
            ))}
          </View>
        )}

        {/* Hinzufügen */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={s(22)} color={COLORS.gold} />
          <Text style={styles.addText}>Ziel hinzufügen</Text>
        </Pressable>

      </ScrollView>

      {/* ── Add-Modal ─────────────────────────────────────────────────────── */}
      <AddGoalModal
        visible={modalVisible}
        onClose={closeModal}
        inputName={inputName}
        setInputName={setInputName}
        inputDeadline={inputDeadline}
        setInputDeadline={setInputDeadline}
        addError={addError}
        canAdd={canAdd}
        adding={adding}
        onAdd={handleAdd}
      />
    </View>
  );
}