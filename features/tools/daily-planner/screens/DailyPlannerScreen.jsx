import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv } from '../../../../constants/layout';

import {
  SLOT_HEIGHT,
  TOTAL_SLOTS,
  toDateStr,
  slotToTime,
  formatDayHeader,
} from '../utils/plannerUtils'

import { useDailyPlannerEvents } from '../hooks/useDailyPlannerEvents';
import { PlannerEventItem } from '../components/PlannerEventItem'
import { AddEventModal } from '../components/AddEventModal';
import { DeleteEventModal } from '../components/DeleteEventModal';
import { PlannerCalendar } from '../components/PlannerCalendar';
import { styles } from '../styles/dailyPlannerStyles';

export default function DailyPlannerScreen() {
  const today = useRef(new Date()).current;
  const todayStr = toDateStr(today);

  const [view, setView] = useState('calendar');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const {
    monthEventDates,
    events,
    dayLoading,
    dayError,
    loadDayEvents,
    clearEvents,
    saveEvent,
    removeEvent,
  } = useDailyPlannerEvents(currentYear, currentMonth, selectedDate);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSlot, setModalSlot] = useState(16);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDuration, setModalDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [modalFromPlus, setModalFromPlus] = useState(false);
  const [modalPickerDate, setModalPickerDate] = useState(new Date());
  const [modalShowPicker, setModalShowPicker] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const dayScrollRef = useRef(null);

  // ─── Day view ──────────────────────────────────────────────────────────────

  const openDay = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setView('day');
    loadDayEvents(dateStr);
    const now = new Date();
    const scrollSlot = dateStr === toDateStr(now)
      ? Math.max(0, now.getHours() * 2 - 2)
      : 14; // 07:00
    setTimeout(() => {
      dayScrollRef.current?.scrollTo({ y: scrollSlot * SLOT_HEIGHT, animated: false });
    }, 200);
  }, [loadDayEvents]);

  const backToCalendar = useCallback(() => {
    setView('calendar');
    setSelectedDate(null);
    clearEvents();
  }, []);

  // ─── Month navigation ─────────────────────────────────────────────────────

  const prevMonth = useCallback(() => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }, [currentMonth]);

  // ─── Add event ────────────────────────────────────────────────────────────

  const openAddModal = useCallback((slot) => {
    setModalSlot(slot);
    setModalFromPlus(false);
    setModalTitle('');
    setModalDuration(60);
    setModalShowPicker(false);
    setModalVisible(true);
  }, []);

  const openAddModalFromPlus = useCallback(() => {
    setModalSlot(null);
    setModalFromPlus(true);
    setModalTitle('');
    setModalDuration(60);
    setModalPickerDate(new Date());
    setModalShowPicker(false);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!modalTitle.trim() || modalSlot === null) return;

    setSaving(true);

    try {
      await saveEvent({
        modalTitle,
        modalSlot,
        modalDuration,
      });

      setModalVisible(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [modalTitle, modalSlot, modalDuration, saveEvent]);

  // ─── Delete event ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id) => {
    setDeleteTarget(null);
    await removeEvent(id);
  }, [removeEvent]);
  // ─── Render: Calendar ─────────────────────────────────────────────────────

  if (view === 'calendar') {
    return (
      <PlannerCalendar
        currentYear={currentYear}
        currentMonth={currentMonth}
        todayStr={todayStr}
        monthEventDates={monthEventDates}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onOpenDay={openDay}
      />
    );
  }

  // ─── Render: Day view ─────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={backToCalendar} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Kalender</Text>
        </Pressable>
      </View>

      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayHeaderText}>{formatDayHeader(selectedDate)}</Text>
        <Pressable onPress={openAddModalFromPlus} style={styles.addPlusBtn} hitSlop={s(10)}>
          <Ionicons name="add" size={s(22)} color={COLORS.gold} />
        </Pressable>
      </View>

      {dayLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : dayError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{dayError}</Text>
          <Pressable onPress={() => loadDayEvents(selectedDate)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={dayScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: sv(60) }}
        >
          <View style={styles.timeline}>
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

            {events.map((event) => (
              <PlannerEventItem
                key={event.id}
                event={event}
                onPress={setDeleteTarget}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Modal */}
      <AddEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        modalFromPlus={modalFromPlus}
        modalSlot={modalSlot}
        setModalSlot={setModalSlot}
        modalShowPicker={modalShowPicker}
        setModalShowPicker={setModalShowPicker}
        modalPickerDate={modalPickerDate}
        setModalPickerDate={setModalPickerDate}
        modalTitle={modalTitle}
        setModalTitle={setModalTitle}
        modalDuration={modalDuration}
        setModalDuration={setModalDuration}
        saving={saving}
        onSave={handleSave}
      />

      <DeleteEventModal
        event={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
      />
    </View>
  );
}