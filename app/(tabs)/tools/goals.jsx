import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import { GOAL_CATEGORIES } from '../../../features/goals/utils/goalUtils';
import { useGoals } from '../../../features/goals/hooks/useGoals';
import { GoalItem } from '../../../features/goals/components/GoalItem';
import { AddGoalModal } from '../../../features/goals/components/AddGoalModal';
import { ActivityIndicator } from 'react-native';

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
  errorCard: {
    backgroundColor: 'rgba(180,30,30,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.35)',
    borderRadius: s(12),
    padding: s(16),
    marginBottom: sv(16),
    gap: sv(10),
    alignItems: 'center',
  },
  errorIcon: {
    color: '#E05555',
  },
  errorText: {
    color: '#E05555',
    fontSize: sf(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: s(16),
    paddingVertical: sv(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.5)',
  },
  retryText: {
    color: '#E05555',
    fontSize: sf(13),
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: 'rgba(180,30,30,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.3)',
    borderRadius: s(10),
    paddingHorizontal: s(12),
    paddingVertical: sv(10),
    marginBottom: sv(12),
  },
  errorBannerText: {
    color: '#E05555',
    fontSize: sf(13),
    fontWeight: '500',
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sv(24),
    gap: s(8),
  },
  catBtn: {
    flex: 1,
    height: sv(38),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard,
  },
  catBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  catBtnText: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '700',
  },
  catBtnTextActive: {
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
});