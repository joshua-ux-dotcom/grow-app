import { logger } from '../../../../lib/logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { DAILY_PLANNER_PAGE_BG } from '../../../../constants/toolAssets';
import { s, sv } from '../../../../constants/layout';

import {
  SLOT_HEIGHT,
  TOTAL_SLOTS,
  toDateStr,
  slotToTime,
  slotToMinutes,
  formatDayHeader,
  dayMinutesToDate,
  dateToDayMinutes,
  applyEventOverlapLayout,
  EVENT_COLORS,
  timeToMinutes,
} from '../utils/plannerUtils';

import { useDailyPlannerEvents } from '../hooks/useDailyPlannerEvents';
import { PlannerEventItem } from '../components/PlannerEventItem';
import { AddEventModal } from '../components/AddEventModal';
import { DeleteEventModal } from '../components/DeleteEventModal';
import { styles } from '../styles/dailyPlannerStyles';
import { useDelayedLoading } from '../../../../hooks/useDelayedLoading';

function isValidDateString(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function getDateParts(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);

  return {
    year,
    monthIndex: Math.max(0, Math.min((month || 1) - 1, 11)),
  };
}

export default function DailyPlannerDayScreen() {
  const params = useLocalSearchParams();
  const today = useRef(new Date()).current;
  const fallbackDate = toDateStr(today);
  const selectedDate = isValidDateString(params?.dateStr) ? params.dateStr : fallbackDate;
  const { year: currentYear, monthIndex: currentMonth } = getDateParts(selectedDate);

  const [timelineWidth, setTimelineWidth] = useState(0);
  const [editingEventId, setEditingEventId] = useState(null);

  const {
    events,
    dayLoading,
    dayError,
    loadDayEvents,
    saveEvent,
    removeEvent,
  } = useDailyPlannerEvents(currentYear, currentMonth, selectedDate);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalStartMinutes, setModalStartMinutes] = useState(16 * 60);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDuration, setModalDuration] = useState(60);
  const [modalColor, setModalColor] = useState(EVENT_COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [modalFromPlus, setModalFromPlus] = useState(false);
  const [modalPickerDate, setModalPickerDate] = useState(dayMinutesToDate(16 * 60));
  const [modalShowPicker, setModalShowPicker] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const dayScrollRef = useRef(null);
  const showDayLoading = useDelayedLoading(dayLoading);

  const eventsWithLayout = useMemo(() => {
    return applyEventOverlapLayout(events);
  }, [events]);

  useEffect(() => {
    const now = new Date();
    const scrollSlot = selectedDate === toDateStr(now)
      ? Math.max(0, now.getHours() * 2 - 2)
      : 14; // 07:00

    const timeoutId = setTimeout(() => {
      dayScrollRef.current?.scrollTo({ y: scrollSlot * SLOT_HEIGHT, animated: false });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [selectedDate]);

  const backToCalendar = useCallback(() => {
    router.back();
  }, []);

  const resetModalBaseState = useCallback(() => {
    setModalTitle('');
    setModalDuration(60);
    setModalColor(EVENT_COLORS[0].value);
    setModalShowPicker(false);
  }, []);

  const openAddModal = useCallback((slot) => {
    const startMinutes = slotToMinutes(slot);

    setEditingEventId(null);
    setModalStartMinutes(startMinutes);
    setModalPickerDate(dayMinutesToDate(startMinutes));
    setModalFromPlus(false);
    resetModalBaseState();
    setModalVisible(true);
  }, [resetModalBaseState]);

  const openEditModal = useCallback((event) => {
    const startMinutes = timeToMinutes(event.start_time);
    const endMinutes = timeToMinutes(event.end_time);
    const durationMinutes = Math.max(1, endMinutes - startMinutes);

    setDeleteTarget(null);

    setEditingEventId(event.id);
    setModalFromPlus(true);
    setModalStartMinutes(startMinutes);
    setModalPickerDate(dayMinutesToDate(startMinutes));
    setModalTitle(event.title || '');
    setModalDuration(durationMinutes);
    setModalColor(event.color || EVENT_COLORS[0].value);
    setModalShowPicker(false);

    setModalVisible(true);
  }, []);

  const openAddModalFromPlus = useCallback(() => {
    const now = new Date();
    const currentMinutes = dateToDayMinutes(now);

    setEditingEventId(null);
    setModalStartMinutes(currentMinutes);
    setModalFromPlus(true);
    resetModalBaseState();
    setModalPickerDate(dayMinutesToDate(currentMinutes));
    setModalVisible(true);
  }, [resetModalBaseState]);

  const handleSave = useCallback(async () => {
    if (!modalTitle.trim() || modalStartMinutes === null) return;

    setSaving(true);

    try {
      const savedEvent = await saveEvent({
        editingEventId,
        modalTitle,
        modalStartMinutes,
        modalDuration,
        modalColor,
      });

      if (!savedEvent) {
        logger.debug('[DailyPlanner] Kein Termin gespeichert.');
        return;
      }

      setModalVisible(false);
      setEditingEventId(null);
      setModalTitle('');
      setModalDuration(60);
      setModalColor(EVENT_COLORS[0].value);
      setModalShowPicker(false);
    } catch (error) {
      logger.debug('[DailyPlanner] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [
    editingEventId,
    modalTitle,
    modalStartMinutes,
    modalDuration,
    modalColor,
    saveEvent,
  ]);

  const handleDelete = useCallback(async (id) => {
    setDeleteTarget(null);
    await removeEvent(id);
  }, [removeEvent]);

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
        }}
      />
      <ImageBackground
        source={DAILY_PLANNER_PAGE_BG}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <Pressable
              onPress={backToCalendar}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedSoft]}
              hitSlop={s(8)}
            >
              <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
              <Text style={styles.backText}>Kalender</Text>
            </Pressable>
          </View>

          <View style={styles.dayHeaderRow}>
            <Text style={styles.dayHeaderText}>{formatDayHeader(selectedDate)}</Text>
            <Pressable
              onPress={openAddModalFromPlus}
              style={({ pressed }) => [styles.addPlusBtn, pressed && styles.pressedCircle]}
              hitSlop={s(10)}
            >
              <Ionicons name="add" size={s(22)} color={COLORS.gold} />
            </Pressable>
          </View>

          {showDayLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.gold} />
            </View>
          ) : !dayLoading && dayError ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{dayError}</Text>
              <Pressable
                onPress={() => loadDayEvents(selectedDate)}
                style={({ pressed }) => [styles.retryBtn, pressed && styles.pressedButton]}
              >
                <Text style={styles.retryBtnText}>Erneut versuchen</Text>
              </Pressable>
            </View>
          ) : !dayLoading ? (
            <ScrollView
              ref={dayScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: sv(60) }}
            >
              <View
                style={styles.timeline}
                onLayout={(event) => setTimelineWidth(event.nativeEvent.layout.width)}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                  <Pressable key={slot} style={styles.slotRow} onPress={() => openAddModal(slot)}>
                    <View style={styles.timeLabelWrap}>
                      {slot % 2 === 0 && (
                        <Text style={styles.timeLabel}>{slotToTime(slot)}</Text>
                      )}
                    </View>
                    <View style={slot % 2 === 0 ? styles.slotHour : styles.slotHalf} />
                  </Pressable>
                ))}

                {eventsWithLayout.map((event) => (
                  <PlannerEventItem
                    key={event.id}
                    event={event}
                    timelineWidth={timelineWidth}
                    onPress={setDeleteTarget}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}

          <AddEventModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setEditingEventId(null);
            }}
            sheetTitle={editingEventId ? 'Termin bearbeiten' : 'Neuer Termin'}
            modalFromPlus={modalFromPlus}
            modalStartMinutes={modalStartMinutes}
            setModalStartMinutes={setModalStartMinutes}
            modalShowPicker={modalShowPicker}
            setModalShowPicker={setModalShowPicker}
            modalPickerDate={modalPickerDate}
            setModalPickerDate={setModalPickerDate}
            modalTitle={modalTitle}
            setModalTitle={setModalTitle}
            modalDuration={modalDuration}
            setModalDuration={setModalDuration}
            modalColor={modalColor}
            setModalColor={setModalColor}
            saving={saving}
            onSave={handleSave}
          />
          <DeleteEventModal
            event={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
        </View>
      </ImageBackground>
    </>
  );
}
