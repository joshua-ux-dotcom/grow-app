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
  Alert,
  ImageBackground,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';
import { DAYS, getTodayIndex, getAllDayIndexes } from '../utils/habitUtils';
import { useHabitCollection } from '../hooks/useHabitCollection';
import { useHabits } from '../hooks/useHabits';
import { useHabitCollections } from '../hooks/useHabitCollections';
import ToolStateCard from '../../../../components/ui/ToolStateCard';
import { useDelayedLoading } from '../../../../hooks/useDelayedLoading';
import { styles as habitStyles } from '../styles/habitStyles';
import { HABITS_PAGE_BG } from '../../../../constants/toolAssets';
import { useHabitCollectionDraft } from '../hooks/useHabitCollectionDraft';
import {
  createHabitCollectionBaseline,
  dismissHabitCollectionEditToDetail,
  dismissHabitCollectionsToOverview,
} from '../services/habitCollectionDrafts';

export default function HabitCollectionEditScreen() {
  const { collectionId } = useLocalSearchParams();
  const navigation = useNavigation();
  const {
    collection,
    loading: collectionLoading,
    loadError,
    loadCollection,
  } = useHabitCollection(collectionId);

  const {
    habits,
    loading: habitsLoading,
  } = useHabits(getTodayIndex());

  const {
    ownerUserId,
    collections,
    loading: collectionsLoading,
    update: updateCollection,
    remove: removeCollection,
    actionError: collectionError,
    setActionError: setCollectionError,
  } = useHabitCollections();

  const [collectionName, setCollectionName] = useState('');
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [allDays, setAllDays] = useState(false);
  const [selectedHabitIds, setSelectedHabitIds] = useState(new Set());
  const [newHabits, setNewHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [memberOrder, setMemberOrder] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveHandlerRef = useRef(null);
  const submitInProgressRef = useRef(false);
  const handleAlertSave = useCallback(
    action => saveHandlerRef.current?.({ backAction: action }) ?? false,
    []
  );

  const eligibleHabitIds = useMemo(() => {
    const safeCollections = Array.isArray(collections) ? collections : [];
    const safeHabits = Array.isArray(habits) ? habits : [];
    const assignedElsewhere = new Set(safeCollections
      .filter(item => item.id !== collection?.id)
      .flatMap(item => (Array.isArray(item?.members) ? item.members : [])
        .map(member => member.habit_id)));
    return new Set(
      safeHabits
        .filter(habit => !assignedElsewhere.has(habit.id))
        .map(habit => habit.id)
    );
  }, [habits, collections, collection?.id]);

  const baseline = useMemo(() => {
    if (!collection) return null;
    const collectionDays = Array.isArray(collection.days) ? collection.days : [];
    const collectionMembers = Array.isArray(collection.members) ? collection.members : [];
    return createHabitCollectionBaseline({
      ...collection,
      days: collectionDays,
      members: collectionMembers,
    });
  }, [collection?.id, collection?.version]);
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
    mode: 'edit',
    collectionId: typeof collectionId === 'string' ? collectionId : null,
    baseline,
    snapshot,
    applySnapshot: applyDraftSnapshot,
    eligibleHabitIds,
    hydrationReady: Boolean(
      ownerUserId
      && collection
      && !collectionLoading
      && !habitsLoading
      && !collectionsLoading
    ),
    onSave: handleAlertSave,
  });

  const showCollectionLoading = useDelayedLoading(
    collectionLoading || Boolean(collection && draftHydrating)
  );
  const showHabitsLoading = useDelayedLoading(habitsLoading || collectionsLoading);

  useFocusEffect(
    useCallback(() => {
      setCollectionError(null);
    }, [setCollectionError])
  );

  const availableHabits = useMemo(() => {
    const safeHabits = Array.isArray(habits) ? habits : [];
    return safeHabits.filter(habit => (
      eligibleHabitIds.has(habit.id) && !selectedHabitIds.has(habit.id)
    ));
  }, [habits, eligibleHabitIds, selectedHabitIds]);

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
      if (next.has(habitId)) {
        next.delete(habitId);
        setMemberOrder(o => o.filter(id => id !== habitId));
      } else {
        next.add(habitId);
        if (!memberOrder.includes(habitId)) {
          setMemberOrder(o => [...o, habitId]);
        }
      }
      return next;
    });
  }, [memberOrder]);

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

  const handleUpdate = useCallback(async ({ backAction = null } = {}) => {
    if (submitInProgressRef.current) return false;
    if (!collection) return false;

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
          members.push({ type: 'new', name: newHabit.name });
        }
      }

      const mutationTicket = beginMutation();
      const updated = await updateCollection(
        collection.id,
        safeName,
        Array.from(selectedDays),
        members,
        collection.version
      );
      if (!updated) throw new Error('Sammlung konnte nicht aktualisiert werden.');

      return completeMutation(
        mutationTicket,
        backAction?.type
          ? { type: 'back-save', action: backAction }
          : {
            type: 'bottom-save',
            navigate: () => {
              dismissHabitCollectionEditToDetail({
                router,
                navigationState: navigation.getState(),
                collectionId: collection.id,
              });
            },
          }
      );
    } catch (e) {
      if (e.code === 'HABIT_COLLECTION_CONFLICT') {
        setError('Diese Sammlung wurde zwischenzeitlich geändert. Bitte lade die Seite neu.');
        await loadCollection();
      } else {
        setError('Sammlung konnte nicht aktualisiert werden.');
      }
      return false;
    } finally {
      submitInProgressRef.current = false;
      setSaving(false);
    }
  }, [
    collection,
    collectionName,
    selectedDays,
    selectedHabitIds,
    newHabits,
    memberOrder,
    updateCollection,
    loadCollection,
    navigation,
    beginMutation,
    completeMutation,
  ]);
  saveHandlerRef.current = handleUpdate;

  const handleDelete = useCallback(() => {
    if (!collection) return;
    Alert.alert(
      'Sammlung löschen?',
      `"${collection.name}" wird gelöscht. Die enthaltenen Gewohnheiten bleiben erhalten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const mutationTicket = beginMutation();
              const removed = await removeCollection(collection.id, collection.version);
              if (removed !== true) {
                throw new Error('Sammlung konnte nicht gelöscht werden.');
              }
              completeMutation(
                mutationTicket,
                {
                  type: 'bottom-save',
                  navigate: () => dismissHabitCollectionsToOverview(router),
                }
              );
            } catch (_error) {
              setError('Sammlung konnte nicht gelöscht werden.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [collection, removeCollection, beginMutation, completeMutation]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const effectiveMembers = memberOrder
    .map(id => {
      if (selectedHabitIds.has(id)) {
        return habits.find(h => h.id === id) || { id, name: '...' };
      }
      return newHabits.find(nh => nh.tempId === id);
    })
    .filter(Boolean);

  const canUpdate =
    draftHydrated &&
    collection &&
    collectionName.trim().length > 0 &&
    collectionName.trim().length <= 60 &&
    selectedDays.size > 0 &&
    (selectedHabitIds.size > 0 || newHabits.length > 0);

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
          <Text style={habitStyles.backText}>Sammlung</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={habitStyles.content} showsVerticalScrollIndicator={false}>
          <View style={habitStyles.header}>
            <Text style={habitStyles.title}>BEARBEITEN</Text>
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

          {showCollectionLoading || showHabitsLoading ? (
            <View style={editStyles.center}>
              <ActivityIndicator size="small" color={COLORS.gold} />
            </View>
          ) : loadError ? (
            <ToolStateCard
              icon="alert-circle-outline"
              title="Sammlung nicht verfügbar"
              subtitle={loadError}
            />
          ) : draftHydrationFailed ? (
            <ToolStateCard
              icon="alert-circle-outline"
              title="Entwurf konnte nicht geladen werden"
              subtitle="Bitte versuche es erneut."
              actionLabel="Erneut versuchen"
              onAction={retryHydration}
              tone="error"
            />
          ) : collection ? (
            <>
              <Text style={editStyles.sectionTitle}>Name</Text>
              <TextInput
                style={editStyles.input}
                placeholder="Sammlung Name"
                placeholderTextColor={COLORS.textDim}
                value={collectionName}
                onChangeText={setCollectionName}
                editable={!saving && !deleting}
                maxLength={60}
              />

              <Text style={editStyles.sectionTitle}>Wochentage</Text>
              <View style={editStyles.daysContainer}>
                <Pressable
                  style={editStyles.allDaysButton}
                  onPress={toggleAllDays}
                  disabled={saving || deleting}
                >
                  <Text style={[editStyles.allDaysText, allDays && editStyles.allDaysTextActive]}>
                    Alle Tage
                  </Text>
                </Pressable>
              </View>

              <View style={editStyles.dayGrid}>
                {DAYS.map((day, idx) => (
                  <Pressable
                    key={day}
                    style={[
                      editStyles.dayButton,
                      selectedDays.has(idx) && editStyles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(idx)}
                    disabled={saving || deleting}
                  >
                    <Text
                      style={[
                        editStyles.dayButtonText,
                        selectedDays.has(idx) && editStyles.dayButtonTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={editStyles.sectionTitle}>Gewohnheiten hinzufügen</Text>

              {availableHabits.length > 0 && (
                <ScrollView
                  style={editStyles.habitsList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {availableHabits.map(habit => (
                    <Pressable
                      key={habit.id}
                      style={[
                        editStyles.habitOption,
                        selectedHabitIds.has(habit.id) && editStyles.habitOptionSelected,
                      ]}
                      onPress={() => toggleHabit(habit.id)}
                      disabled={saving || deleting}
                    >
                      <View
                        style={[
                          editStyles.habitCheckbox,
                          selectedHabitIds.has(habit.id) && editStyles.habitCheckboxChecked,
                        ]}
                      >
                        {selectedHabitIds.has(habit.id) && (
                          <Ionicons name="checkmark" size={s(13)} color={COLORS.black} />
                        )}
                      </View>
                      <Text style={editStyles.habitName}>{habit.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={editStyles.sectionSubtitle}>Neue Gewohnheit hinzufügen</Text>
              <View style={editStyles.newHabitInput}>
                <TextInput
                  style={editStyles.input}
                  placeholder="Name eingeben"
                  placeholderTextColor={COLORS.textDim}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  editable={!saving && !deleting}
                  maxLength={60}
                />
                <Pressable
                  style={[editStyles.addButton, !canAddNewHabit && editStyles.addButtonDisabled]}
                  onPress={addNewHabitDraft}
                  disabled={!canAddNewHabit || saving || deleting}
                >
                  <Ionicons name="add" size={s(20)} color={canAddNewHabit ? COLORS.gold : COLORS.textDim} />
                </Pressable>
              </View>

              {effectiveMembers.length > 0 && (
                <>
                  <Text style={editStyles.sectionSubtitle}>Reihenfolge</Text>
                  <View style={editStyles.membersList}>
                    {effectiveMembers.map((item, idx) => (
                      <View key={item.id || item.tempId} style={editStyles.memberItem}>
                        <View style={editStyles.memberInfo}>
                          <Text style={editStyles.memberPosition}>{idx + 1}</Text>
                          <Text style={editStyles.memberName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <View style={editStyles.memberActions}>
                          <Pressable
                            onPress={() => handleMoveUp(item.id || item.tempId)}
                            disabled={idx === 0 || saving || deleting}
                            hitSlop={s(8)}
                          >
                            <Ionicons
                              name="chevron-up"
                              size={s(20)}
                              color={idx === 0 || saving || deleting ? COLORS.textDim : COLORS.gold}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleMoveDown(item.id || item.tempId)}
                            disabled={idx >= effectiveMembers.length - 1 || saving || deleting}
                            hitSlop={s(8)}
                          >
                            <Ionicons
                              name="chevron-down"
                              size={s(20)}
                              color={idx >= effectiveMembers.length - 1 || saving || deleting ? COLORS.textDim : COLORS.gold}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setSelectedHabitIds(prev => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                              setMemberOrder(prev => prev.filter(id => id !== (item.id || item.tempId)));
                              if (item.tempId) {
                                removeNewHabit(item.tempId);
                              }
                            }}
                            disabled={saving || deleting}
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

              <Pressable
                style={[editStyles.updateButton, !canUpdate && editStyles.updateButtonDisabled]}
                onPress={handleUpdate}
                disabled={!canUpdate || saving || deleting}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.black} />
                ) : (
                  <Text style={editStyles.updateButtonText}>Speichern</Text>
                )}
              </Pressable>

              <Pressable
                style={editStyles.deleteButton}
                onPress={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="red" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={s(16)} color="red" />
                    <Text style={editStyles.deleteButtonText}>Sammlung löschen</Text>
                  </>
                )}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const editStyles = {
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
  updateButton: {
    marginHorizontal: s(20),
    marginTop: sv(24),
    marginBottom: sv(12),
    paddingVertical: sv(14),
    borderRadius: s(10),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    fontSize: sf(16),
    fontWeight: '700',
    color: COLORS.black,
  },
  deleteButton: {
    marginHorizontal: s(20),
    marginBottom: sv(40),
    paddingVertical: sv(14),
    paddingHorizontal: s(16),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
  },
  deleteButtonText: {
    fontSize: sf(14),
    fontWeight: '700',
    color: 'red',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    height: sv(100),
  },
};
