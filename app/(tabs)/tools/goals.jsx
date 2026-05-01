import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import {
  getGoals, addGoal, toggleGoal, deleteGoal,
} from '../../../features/goals/services/goals';

const CATEGORIES = ['Monatlich', 'Jährlich', 'Lifetime'];

export default function GoalsScreen() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputDeadline, setInputDeadline] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    loadGoals();
  }, [selectedCategory]);

  async function loadGoals() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getGoals(selectedCategory);
      setGoals(data);
    } catch (e) {
      setLoadError('Ziele konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  const completedCount = goals.filter(g => g.completed).length;
  const total = goals.length;
  const progress = total === 0 ? 0 : completedCount / total;

  const handleToggle = useCallback(async (id, currentCompleted) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, completed: !currentCompleted } : g
    ));
    try {
      await toggleGoal(id, !currentCompleted);
    } catch (e) {
      setActionError('Änderung konnte nicht gespeichert werden.');
      setGoals(prev => prev.map(g =>
        g.id === id ? { ...g, completed: currentCompleted } : g
      ));
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    try {
      await deleteGoal(id);
    } catch (e) {
      setActionError('Ziel konnte nicht gelöscht werden.');
      loadGoals();
    }
  }, []);

  const handleAdd = useCallback(async () => {
    if (!inputName.trim()) return;
    setAddError(null);
    setAdding(true);
    try {
      const newGoal = await addGoal(inputName.trim(), selectedCategory, inputDeadline.trim());
      setGoals(prev => [...prev, newGoal]);
      closeModal();
    } catch (e) {
      setAddError('Ziel konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setAdding(false);
    }
  }, [inputName, inputDeadline, selectedCategory]);

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
          {CATEGORIES.map((cat, index) => (
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
          <Text style={styles.sectionTitle}>{CATEGORIES[selectedCategory].toUpperCase()}</Text>
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
              <Pressable
                key={goal.id}
                style={[styles.goalCard, goal.completed && styles.goalCardDone]}
                onPress={() => handleToggle(goal.id, goal.completed)}
              >
                <View style={styles.goalLeft}>
                  <View style={[styles.checkbox, goal.completed && styles.checkboxDone]}>
                    {goal.completed && <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />}
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
                        <Ionicons name="calendar-outline" size={sf(11)} color={goal.completed ? COLORS.textDim : COLORS.softGold} />
                        {'  '}{goal.deadline}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {goal.completed && (
                  <Pressable
                    style={styles.trashBtn}
                    onPress={() => handleDelete(goal.id)}
                    hitSlop={s(8)}
                  >
                    <Ionicons name="trash-outline" size={s(16)} color={COLORS.white} />
                  </Pressable>
                )}
              </Pressable>
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
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.overlay} onPress={closeModal}>
            <Pressable style={styles.sheet} onPress={() => {}}>

              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Neues Ziel</Text>

              <TextInput
                style={styles.input}
                placeholder="Mein Ziel"
                placeholderTextColor={COLORS.textDim}
                value={inputName}
                onChangeText={setInputName}
                autoFocus
                returnKeyType="next"
              />

              <TextInput
                style={styles.input}
                placeholder="Deadline (optional, z.B. 31.12.2025)"
                placeholderTextColor={COLORS.textDim}
                value={inputDeadline}
                onChangeText={setInputDeadline}
                returnKeyType="done"
              />

              {/* Fehler beim Hinzufügen */}
              {addError && (
                <View style={styles.modalErrorRow}>
                  <Ionicons name="alert-circle-outline" size={s(15)} color={styles.errorIcon.color} />
                  <Text style={styles.modalErrorText}>{addError}</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmBtn, (!canAdd || adding) && styles.confirmBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!canAdd || adding}
                >
                  {adding
                    ? <ActivityIndicator color={COLORS.black} />
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
  goalCard: {
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
  goalCardDone: {
    borderColor: 'rgba(212,175,55,0.15)',
    backgroundColor: 'rgba(212,175,55,0.04)',
    opacity: 0.65,
  },
  goalLeft: {
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
  goalTextCol: {
    flex: 1,
    gap: sv(3),
  },
  goalTitle: {
    color: COLORS.white,
    fontSize: sf(16),
    fontWeight: '700',
  },
  goalTitleDone: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  goalDeadline: {
    color: COLORS.softGold,
    fontSize: sf(12),
    fontWeight: '500',
  },
  goalDeadlineDone: {
    color: COLORS.textDim,
  },
  trashBtn: {
    padding: s(4),
    opacity: 0.5,
    marginLeft: s(8),
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
    marginBottom: sv(14),
  },
  modalErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: sv(12),
  },
  modalErrorText: {
    color: '#E05555',
    fontSize: sf(13),
    fontWeight: '500',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(6),
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