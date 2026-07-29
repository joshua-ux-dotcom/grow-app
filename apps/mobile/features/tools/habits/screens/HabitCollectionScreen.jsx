import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ImageBackground,
  LayoutAnimation,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';
import { DAYS, getTodayIndex, partitionHabitsByCompletion } from '../utils/habitUtils';
import { useHabitCollection } from '../hooks/useHabitCollection';
import { useHabits } from '../hooks/useHabits';
import { HabitItem } from '../components/HabitItem';
import ToolStateCard from '../../../../components/ui/ToolStateCard';
import { useDelayedLoading } from '../../../../hooks/useDelayedLoading';
import { styles as habitStyles } from '../styles/habitStyles';
import { HABITS_PAGE_BG } from '../../../../constants/toolAssets';

export default function HabitCollectionScreen() {
  const { collectionId } = useLocalSearchParams();
  const {
    collection,
    completedIds,
    loading: collectionLoading,
    loadError,
    loadCollection,
    reloadCompletions,
  } = useHabitCollection(collectionId);

  const selectedDay = getTodayIndex();
  const {
    habits,
    completedIds: allCompletedIds,
    toggle,
  } = useHabits(selectedDay);

  const showLoading = useDelayedLoading(collectionLoading);

  useFocusEffect(
    useCallback(() => {
      void loadCollection();
      void reloadCompletions();
    }, [loadCollection, reloadCompletions])
  );

  const memberHabits = useMemo(() => {
    if (!collection?.members) return [];
    return collection.members
      .map(m => habits.find(h => h.id === m.habit_id))
      .filter(Boolean);
  }, [collection, habits]);

  const orderedMemberHabits = useMemo(
    () => partitionHabitsByCompletion(memberHabits, allCompletedIds),
    [memberHabits, allCompletedIds]
  );

  const progress = useMemo(() => {
    const total = memberHabits.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = memberHabits.filter(h => allCompletedIds.has(h.id)).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }, [memberHabits, allCompletedIds]);

  const daysLabel = useMemo(() => {
    if (!collection?.days) return '';
    return collection.days.map(d => DAYS[d]?.substring(0, 2)).join(', ');
  }, [collection]);

  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/tools/habits-collection-edit',
      params: { collectionId: collection.id },
    });
  }, [collection?.id]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleToggleMember = useCallback((habitId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggle(habitId);
  }, [toggle]);

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

      <ScrollView contentContainerStyle={habitStyles.content} showsVerticalScrollIndicator={false}>
        {showLoading ? (
          <ToolStateCard loading title="Sammlung wird geladen" subtitle="..." />
        ) : loadError ? (
          <ToolStateCard
            icon="alert-circle-outline"
            title="Fehler beim Laden"
            subtitle={loadError}
          />
        ) : collection ? (
          <>
            <View style={detailStyles.header}>
              <View style={detailStyles.headerLeft}>
                <Text style={detailStyles.headerTitle}>{collection.name}</Text>
                <Text style={detailStyles.headerDays}>{daysLabel}</Text>
              </View>
              <Pressable style={detailStyles.editButton} onPress={handleEdit}>
                <Ionicons name="pencil" size={s(20)} color={COLORS.gold} />
              </Pressable>
            </View>

            <View style={detailStyles.progressContainer}>
              <View style={detailStyles.progressRow}>
                <Text style={detailStyles.progressLabel}>FORTSCHRITT</Text>
                <Text style={detailStyles.progressValue}>
                  {progress.completed}/{progress.total}
                </Text>
              </View>
              <View style={detailStyles.progressTrack}>
                <View
                  style={[
                    detailStyles.progressFill,
                    { width: `${progress.percentage}%` },
                  ]}
                />
              </View>
            </View>

            {memberHabits.length === 0 ? (
              <ToolStateCard
                icon="checkmark-outline"
                title="Keine Gewohnheiten"
                subtitle="Diese Sammlung hat noch keine Gewohnheiten."
              />
            ) : (
              <FlatList
                scrollEnabled={false}
                data={orderedMemberHabits}
                contentContainerStyle={habitStyles.list}
                keyExtractor={h => h.id}
                renderItem={({ item: habit }) => (
                  <HabitItem
                    habit={habit}
                    selectedDay={selectedDay}
                    done={allCompletedIds.has(habit.id)}
                    onToggle={handleToggleMember}
                    showActions={false}
                    onOpenLinkedTool={() => {
                      if (habit.linked_tool_route) {
                        router.push(habit.linked_tool_route);
                      }
                    }}
                  />
                )}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const detailStyles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sv(24),
    paddingHorizontal: s(20),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: sf(24),
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: sv(4),
  },
  headerDays: {
    fontSize: sf(12),
    color: COLORS.textDim,
  },
  editButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(8),
    backgroundColor: 'rgba(212,175,55,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginHorizontal: s(20),
    marginBottom: sv(24),
    paddingHorizontal: s(12),
    paddingVertical: sv(12),
    borderRadius: s(10),
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sv(10),
  },
  progressLabel: {
    fontSize: sf(12),
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: sf(14),
    fontWeight: '700',
    color: COLORS.gold,
  },
  progressTrack: {
    height: s(4),
    borderRadius: s(2),
    backgroundColor: 'rgba(212,175,55,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: s(2),
  },
};
