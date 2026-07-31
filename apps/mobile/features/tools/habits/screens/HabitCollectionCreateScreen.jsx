import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';
import { DAYS, getTodayIndex, getAllDayIndexes } from '../utils/habitUtils';
import { useHabits } from '../hooks/useHabits';
import { useHabitCollections } from '../hooks/useHabitCollections';
import ToolStateCard from '../../../../components/ui/ToolStateCard';
import { useDelayedLoading } from '../../../../hooks/useDelayedLoading';
import { styles as habitStyles } from '../styles/habitStyles';
import { HABITS_PAGE_BG } from '../../../../constants/toolAssets';
import { useHabitCollectionDraft } from '../hooks/useHabitCollectionDraft';
import {
  createEmptyHabitCollectionSnapshot,
  dismissHabitCollectionsToOverview,
} from '../services/habitCollectionDrafts';

export default function HabitCollectionCreateScreen() {
  const {
    habits,
    completedIds,
    loading: habitsLoading,
  } = useHabits(getTodayIndex());

  const {
    ownerUserId,
    collections,
    loading: collectionsLoading,
    add: addCollection,
    actionError: collectionError,
    setActionError: setCollectionError,
  } = useHabitCollections();

  const [collectionName, setCollectionName] = useState('');
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [allDays, setAllDays] = useState(false);
  const [selectedHabitIds, setSelectedHabitIds] = useState(new Set());
  const [newHabits, setNewHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [memberOrder, setMemberOrder] = useState([]);
  const saveHandlerRef = useRef(null);
  const submitInProgressRef = useRef(false);
  const handleAlertSave = useCallback(
    action => saveHandlerRef.current?.({ backAction: action }) ?? false,
    []
  );

  const eligibleHabitIds = useMemo(() => {
    const assignedIds = new Set(collections.flatMap(collection => (
      collection.members.map(member => member.habit_id)
    )));
    return new Set(habits.filter(habit => !assignedIds.has(habit.id)).map(habit => habit.id));
  }, [habits, collections]);

  const baseline = useMemo(() => createEmptyHabitCollectionSnapshot(), []);
  const snapshot = useMemo(() => ({
    name: collectionName,
    days: Array.from(selectedDays),
    selectedHabitIds: Array.from(selectedHabitIds),
    newHabits,
    memberOrder,
    newHabitName,
  }), [
    collectionName,
    selectedDays,
    selectedHabitIds,
    newHabits,
    memberOrder,
    newHabitName,
  ]);
  const applyDraftSnapshot = useCallback((draft) => {
    setCollectionName(draft.name);
    setSelectedDays(new Set(draft.days));
    setAllDays(draft.days.length === 7);
    setSelectedHabitIds(new Set(draft.selectedHabitIds));
    setNewHabits(draft.newHabits);
    setMemberOrder(draft.memberOrder);
    setNewHabitName(draft.newHabitName);
  }, []);
  const {
    beginMutation,
    completeMutation,
    isHydrated: draftHydrated,
    isHydrating: draftHydrating,
    hydrationFailed: draftHydrationFailed,
    retryHydration,
  } = useHabitCollectionDraft({
    userId: ownerUserId,
    mode: 'create',
    baseline,
    snapshot,
    applySnapshot: applyDraftSnapshot,
    eligibleHabitIds,
    hydrationReady: Boolean(
      ownerUserId
      && !habitsLoading
      && !collectionsLoading
    ),
    onSave: handleAlertSave,
  });

  const showLoading = useDelayedLoading(
    habitsLoading
    || collectionsLoading
    || Boolean(ownerUserId && draftHydrating)
  );

  useFocusEffect(
    useCallback(() => {
      setCollectionError(null);
    }, [setCollectionError])
  );

  const availableHabits = useMemo(
    () => habits.filter(habit => (
      eligibleHabitIds.has(habit.id) && !selectedHabitIds.has(habit.id)
    )),
    [habits, eligibleHabitIds, selectedHabitIds]
  );

  const canAddNewHabit = newHabitName.trim().length > 0;

  const toggleDay = useCallback((dayIndex) => {
    setSelectedDays(prev => {
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
    setSelectedDays(next ? new Set(getAllDayIndexes()) : new Set());
  }, [allDays]);

  const toggleHabit = useCallback((habitId) => {
    setSelectedHabitIds(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) next.delete(habitId);
      else next.add(habitId);
      return next;
    });
  }, []);

  const addNewHabitDraft = useCallback(() => {
    const safeName = newHabitName.trim();
    if (!safeName || safeName.length > 60) return;

    const newDraft = {
      tempId: `new_${Date.now()}_${Math.random()}`,
      name: safeName,
    };

    setNewHabits(prev => [...prev, newDraft]);
    setMemberOrder(prev => [...prev, newDraft.tempId]);
    setNewHabitName('');
    setError(null);
  }, [newHabitName]);

  const removeNewHabit = useCallback((tempId) => {
    setNewHabits(prev => prev.filter(h => h.tempId !== tempId));
    setMemberOrder(prev => prev.filter(id => id !== tempId));
  }, []);

  const removeSelectedHabit = useCallback((habitId) => {
    setSelectedHabitIds(prev => {
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });
    setMemberOrder(prev => prev.filter(id => id !== habitId));
  }, []);

  const handleMoveUp = useCallback((item) => {
    setMemberOrder(prev => {
      const idx = prev.indexOf(item);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((item) => {
    setMemberOrder(prev => {
      const idx = prev.indexOf(item);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleCreate = useCallback(async ({ backAction = null } = {}) => {
    if (submitInProgressRef.current) return false;

    const safeName = collectionName.trim();
    if (!safeName || safeName.length > 60) {
      setError('Name muss zwischen 1 und 60 Zeichen lang sein.');
      return false;
    }
    if (selectedDays.size === 0) {
      setError('Mindestens ein Wochentag ist erforderlich.');
      return false;
    }

    const selectedCount = selectedHabitIds.size + newHabits.length;
    if (selectedCount === 0) {
      setError('Mindestens eine Gewohnheit ist erforderlich.');
      return false;
    }

    submitInProgressRef.current = true;
    setError(null);
    setSaving(true);

    try {
      const members = [];
      for (const habitId of memberOrder) {
        if (selectedHabitIds.has(habitId)) {
          members.push({ type: 'existing', habit_id: habitId });
        } else if (newHabits.some(nh => nh.tempId === habitId)) {
          const newHabit = newHabits.find(nh => nh.tempId === habitId);
          members.push({
            type: 'new',
            name: newHabit.name,
          });
        }
      }

      const mutationTicket = beginMutation();
      const created = await addCollection(safeName, Array.from(selectedDays), members);
      if (!created) throw new Error('Sammlung konnte nicht erstellt werden.');
      return completeMutation(
        mutationTicket,
        backAction?.type
          ? { type: 'back-save', action: backAction }
          : {
            type: 'bottom-save',
            navigate: () => dismissHabitCollectionsToOverview(router),
          }
      );
    } catch (_error) {
      setError('Sammlung konnte nicht erstellt werden.');
      return false;
    } finally {
      submitInProgressRef.current = false;
      setSaving(false);
    }
  }, [
    collectionName,
    selectedDays,
    selectedHabitIds,
    newHabits,
    memberOrder,
    addCollection,
    beginMutation,
    completeMutation,
  ]);
  saveHandlerRef.current = handleCreate;

  const canCreate =
    draftHydrated &&
    collectionName.trim().length > 0 &&
    collectionName.trim().length <= 60 &&
    selectedDays.size > 0 &&
    (selectedHabitIds.size > 0 || newHabits.length > 0);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // Build effective member order to display
  const effectiveMembers = memberOrder.map(id => {
    if (selectedHabitIds.has(id)) {
      return habits.find(h => h.id === id) || { id, name: '...' };
    }
    return newHabits.find(nh => nh.tempId === id);
  }).filter(Boolean);

  return (
    <ImageBackground
      source={HABITS_PAGE_BG}
      style={habitStyles.screen}
      imageStyle={habitStyles.backgroundImage}
      resizeMode="cover"
    >
      <View style={habitStyles.pageOverlay} pointerEvents="none" />

      <View style={habitStyles.topBar}>
        <Pressable onPress={handleBack} style={habitStyles.backButton}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={habitStyles.backText}>Sammlungen</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={habitStyles.content} showsVerticalScrollIndicator={false}>
          <View style={habitStyles.header}>
            <Text style={habitStyles.title}>NEUE SAMMLUNG</Text>
          </View>

          {collectionError && (
            <View style={habitStyles.errorCard}>
              <Ionicons name="alert-circle-outline" size={s(20)} color={habitStyles.errorIcon.color} />
              <Text style={habitStyles.errorText}>{collectionError}</Text>
            </View>
          )}

          {error && (
            <View style={habitStyles.errorCard}>
              <Ionicons name="alert-circle-outline" size={s(20)} color={habitStyles.errorIcon.color} />
              <Text style={habitStyles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={createStyles.sectionTitle}>Name</Text>
          <TextInput
            style={createStyles.input}
            placeholder="z.B. Morgenroutine"
            placeholderTextColor={COLORS.textDim}
            value={collectionName}
            onChangeText={setCollectionName}
            editable={!saving}
            maxLength={60}
          />

          <Text style={createStyles.sectionTitle}>Wochentage</Text>
          <View style={createStyles.daysContainer}>
            <Pressable
              style={createStyles.allDaysButton}
              onPress={toggleAllDays}
              disabled={saving}
            >
              <Text style={[createStyles.allDaysText, allDays && createStyles.allDaysTextActive]}>
                Alle Tage
              </Text>
            </Pressable>
          </View>

          <View style={createStyles.dayGrid}>
            {DAYS.map((day, idx) => (
              <Pressable
                key={day}
                style={[
                  createStyles.dayButton,
                  selectedDays.has(idx) && createStyles.dayButtonActive,
                ]}
                onPress={() => toggleDay(idx)}
                disabled={saving}
              >
                <Text
                  style={[
                    createStyles.dayButtonText,
                    selectedDays.has(idx) && createStyles.dayButtonTextActive,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={createStyles.sectionTitle}>Gewohnheiten hinzufügen</Text>

          {showLoading ? (
            <View style={createStyles.center}>
              <ActivityIndicator size="small" color={COLORS.gold} />
            </View>
          ) : draftHydrationFailed ? (
            <ToolStateCard
              icon="alert-circle-outline"
              title="Entwurf konnte nicht geladen werden"
              subtitle="Bitte versuche es erneut."
              actionLabel="Erneut versuchen"
              onAction={retryHydration}
              tone="error"
            />
          ) : (
            <>
              {availableHabits.length > 0 && (
                <ScrollView
                  style={createStyles.habitsList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {availableHabits.map(habit => (
                    <Pressable
                      key={habit.id}
                      style={[
                        createStyles.habitOption,
                        selectedHabitIds.has(habit.id) && createStyles.habitOptionSelected,
                      ]}
                      onPress={() => {
                        toggleHabit(habit.id);
                        if (!memberOrder.includes(habit.id)) {
                          setMemberOrder(prev => [...prev, habit.id]);
                        }
                      }}
                      disabled={saving}
                    >
                      <View
                        style={[
                          createStyles.habitCheckbox,
                          selectedHabitIds.has(habit.id) && createStyles.habitCheckboxChecked,
                        ]}
                      >
                        {selectedHabitIds.has(habit.id) && (
                          <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
                        )}
                      </View>
                      <Text style={createStyles.habitName}>{habit.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={createStyles.sectionSubtitle}>Neue Gewohnheit hinzufügen</Text>
              <View style={createStyles.newHabitInput}>
                <TextInput
                  style={createStyles.input}
                  placeholder="Name eingeben"
                  placeholderTextColor={COLORS.textDim}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  editable={!saving}
                  maxLength={60}
                />
                <Pressable
                  style={[createStyles.addButton, !canAddNewHabit && createStyles.addButtonDisabled]}
                  onPress={addNewHabitDraft}
                  disabled={!canAddNewHabit || saving}
                >
                  <Ionicons name="add" size={s(20)} color={canAddNewHabit ? COLORS.gold : COLORS.textDim} />
                </Pressable>
              </View>

              {(selectedHabitIds.size > 0 || newHabits.length > 0) && (
                <>
                  <Text style={createStyles.sectionSubtitle}>Reihenfolge</Text>
                  <View style={createStyles.membersList}>
                    {effectiveMembers.map((item, idx) => (
                      <View key={item.id || item.tempId} style={createStyles.memberItem}>
                        <View style={createStyles.memberInfo}>
                          <Text style={createStyles.memberPosition}>{idx + 1}</Text>
                          <Text style={createStyles.memberName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <View style={createStyles.memberActions}>
                          <Pressable
                            onPress={() => handleMoveUp(item.id || item.tempId)}
                            disabled={idx === 0 || saving}
                            hitSlop={s(8)}
                          >
                            <Ionicons
                              name="chevron-up"
                              size={s(20)}
                              color={idx === 0 ? COLORS.textDim : COLORS.gold}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleMoveDown(item.id || item.tempId)}
                            disabled={idx >= effectiveMembers.length - 1 || saving}
                            hitSlop={s(8)}
                          >
                            <Ionicons
                              name="chevron-down"
                              size={s(20)}
                              color={idx >= effectiveMembers.length - 1 ? COLORS.textDim : COLORS.gold}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              if (selectedHabitIds.has(item.id)) {
                                removeSelectedHabit(item.id);
                              } else {
                                removeNewHabit(item.tempId);
                              }
                            }}
                            disabled={saving}
                            hitSlop={s(8)}
                          >
                            <Ionicons name="close" size={s(20)} color={COLORS.gold} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          <Pressable
            style={[createStyles.createButton, !canCreate && createStyles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!canCreate || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={createStyles.createButtonText}>Sammlung erstellen</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const createStyles = {
  sectionTitle: {
    fontSize: sf(14),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: sv(20),
    marginBottom: sv(12),
    marginLeft: s(20),
  },
  sectionSubtitle: {
    fontSize: sf(12),
    fontWeight: '600',
    color: COLORS.textDim,
    marginTop: sv(16),
    marginBottom: sv(10),
    marginLeft: s(20),
  },
  input: {
    marginHorizontal: s(20),
    paddingHorizontal: s(12),
    paddingVertical: sv(10),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: COLORS.textPrimary,
    fontSize: sf(15),
  },
  daysContainer: {
    flexDirection: 'row',
    paddingHorizontal: s(20),
    marginBottom: sv(10),
  },
  allDaysButton: {
    paddingHorizontal: s(12),
    paddingVertical: sv(8),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  allDaysText: {
    fontSize: sf(12),
    fontWeight: '600',
    color: COLORS.textDim,
  },
  allDaysTextActive: {
    color: COLORS.gold,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    paddingHorizontal: s(20),
  },
  dayButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: sv(8),
    paddingHorizontal: s(8),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  dayButtonText: {
    fontSize: sf(11),
    fontWeight: '600',
    color: COLORS.textDim,
  },
  dayButtonTextActive: {
    color: COLORS.black,
  },
  habitsList: {
    maxHeight: sv(200),
    marginHorizontal: s(20),
    marginBottom: sv(12),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  habitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: sv(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  habitOptionSelected: {
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  habitCheckbox: {
    width: s(20),
    height: s(20),
    borderRadius: s(4),
    borderWidth: 2,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(8),
  },
  habitCheckboxChecked: {
    backgroundColor: COLORS.gold,
  },
  habitName: {
    fontSize: sf(14),
    color: COLORS.textPrimary,
    flex: 1,
  },
  newHabitInput: {
    flexDirection: 'row',
    paddingHorizontal: s(20),
    marginBottom: sv(12),
    gap: s(8),
    alignItems: 'center',
  },
  addButton: {
    width: s(44),
    height: s(44),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  membersList: {
    marginHorizontal: s(20),
    marginBottom: sv(16),
    borderRadius: s(8),
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingVertical: sv(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberPosition: {
    fontSize: sf(12),
    fontWeight: '600',
    color: COLORS.gold,
    marginRight: s(8),
    minWidth: s(16),
  },
  memberName: {
    fontSize: sf(14),
    color: COLORS.textPrimary,
    flex: 1,
  },
  memberActions: {
    flexDirection: 'row',
    gap: s(4),
  },
  createButton: {
    marginHorizontal: s(20),
    marginBottom: sv(40),
    paddingVertical: sv(14),
    borderRadius: s(10),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: sf(16),
    fontWeight: '700',
    color: COLORS.black,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    height: sv(100),
  },
};
