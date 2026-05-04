import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import {
  SCREEN_WIDTH,
  SLOT_HEIGHT,
  TIME_LABEL_WIDTH,
  TOTAL_SLOTS,
  DURATIONS,
  toDateStr,
  slotToTime,
  minutesToTime,
  formatDayHeader,
} from '../../../features/daily-planner/utils/plannerUtils';
import { useDailyPlannerEvents } from '../../../features/daily-planner/hooks/useDailyPlannerEvents';
import { PlannerEventItem } from '../../../features/daily-planner/components/PlannerEventItem';
import { AddEventModal } from '../../../features/daily-planner/components/AddEventModal';
import { DeleteEventModal } from '../../../features/daily-planner/components/DeleteEventModal';
import { PlannerCalendar } from '../../../features/daily-planner/components/PlannerCalendar';
import { ActivityIndicator } from 'react-native';

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const CELL_SIZE = (SCREEN_WIDTH - s(40)) / 7;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Day view ──────────────────────────────────────────────────────────────
  dayHeaderRow: {
    paddingTop: sv(100),
    paddingHorizontal: s(20),
    paddingBottom: sv(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,98,54,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPlusBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  dayHeaderText: {
    color: COLORS.paleGold,
    fontSize: sf(16),
    fontWeight: '700',
  },
  timeline: {
    position: 'relative',
  },
  slotRow: {
    height: SLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeLabelWrap: {
    width: TIME_LABEL_WIDTH,
    justifyContent: 'flex-start',
    paddingTop: sv(4),
    paddingLeft: s(14),
  },
  timeLabel: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '500',
  },
  slotHour: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  slotHalf: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },

  // ─── States ─────────────────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(20),
  },
  errorText: {
    color: COLORS.white,
    fontSize: sf(16),
    textAlign: 'center',
    marginBottom: sv(12),
  },
  retryBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: s(16),
    paddingVertical: sv(10),
    borderRadius: s(10),
  },
  retryBtnText: {
    color: COLORS.black,
    fontWeight: '600',
  },
});