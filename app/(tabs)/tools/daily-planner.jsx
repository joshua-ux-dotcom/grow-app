import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, ActivityIndicator, Platform,
  KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import {
  getEventsForDate,
  getEventsForMonth,
  addEvent,
  deleteEvent,
} from '../../../features/daily-planner/services/planner';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_HEIGHT = sv(48);
const TIME_LABEL_WIDTH = s(58);
const TOTAL_SLOTS = 48; // 24h × 2

const DURATIONS = [
  { label: '30 Min', minutes: 30 },
  { label: '1 Std', minutes: 60 },
  { label: '1,5 Std', minutes: 90 },
  { label: '2 Std', minutes: 120 },
  { label: '3 Std', minutes: 180 },
];

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAY_NAMES_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function slotToTime(slot) {
  const h = Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToTime(totalMins) {
  const capped = Math.min(totalMins, 24 * 60 - 1);
  return `${String(Math.floor(capped / 60)).padStart(2, '0')}:${String(capped % 60).padStart(2, '0')}`;
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DailyPlannerScreen() {
  const today = useRef(new Date()).current;
  const todayStr = toDateStr(today);

  const [view, setView] = useState('calendar');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [monthEventDates, setMonthEventDates] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState(null);

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

  // ─── Month event dots ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventsForMonth(currentYear, currentMonth + 1);
        if (!cancelled) setMonthEventDates(new Set(data.map(e => e.date)));
      } catch { /* dots silently fail */ }
    })();
    return () => { cancelled = true; };
  }, [currentYear, currentMonth]);

  // ─── Day view ──────────────────────────────────────────────────────────────

  const loadDayEvents = useCallback(async (dateStr) => {
    setDayLoading(true);
    setDayError(null);
    try {
      const data = await getEventsForDate(dateStr);
      setEvents(data);
    } catch {
      setDayError('Termine konnten nicht geladen werden.');
    } finally {
      setDayLoading(false);
    }
  }, []);

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
    setEvents([]);
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
      const startTime = slotToTime(modalSlot);
      const endTime = minutesToTime(modalSlot * 30 + modalDuration);
      const newEvent = await addEvent({
        date: selectedDate,
        startTime,
        endTime,
        title: modalTitle.trim(),
      });
      setEvents(prev =>
        [...prev, newEvent].sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
      setMonthEventDates(prev => new Set([...prev, selectedDate]));
      setModalVisible(false);
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  }, [modalTitle, modalSlot, modalDuration, selectedDate]);

  // ─── Delete event ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeleteTarget(null);
    try {
      await deleteEvent(id);
    } catch {
      loadDayEvents(selectedDate);
    }
  }, [selectedDate, loadDayEvents]);

  // ─── Calendar grid ────────────────────────────────────────────────────────

  function buildCells() {
    const first = new Date(currentYear, currentMonth, 1);
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    let startDow = first.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) cells.push(d);
    return cells;
  }

  // ─── Render: Calendar ─────────────────────────────────────────────────────

  if (view === 'calendar') {
    const cells = buildCells();
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
            <Text style={styles.backText}>Tools</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.calContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={s(36)} color={COLORS.gold} />
            </View>
            <Text style={styles.title}>DAILY PLANNER</Text>
            <Text style={styles.subtitle}>Plane deinen Tag. Gestalte dein Leben.</Text>
          </View>

          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} style={styles.monthArrow} hitSlop={s(12)}>
              <Ionicons name="chevron-back" size={s(22)} color={COLORS.softGold} />
            </Pressable>
            <Text style={styles.monthLabel}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
            <Pressable onPress={nextMonth} style={styles.monthArrow} hitSlop={s(12)}>
              <Ionicons name="chevron-forward" size={s(22)} color={COLORS.softGold} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {DAY_NAMES_SHORT.map(d => (
              <View key={d} style={styles.weekCell}>
                <Text style={styles.weekLabel}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={styles.calCell} />;
              const mm = String(currentMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${currentYear}-${mm}-${dd}`;
              const isToday = dateStr === todayStr;
              const hasEvent = monthEventDates.has(dateStr);
              return (
                <Pressable
                  key={dateStr}
                  style={[styles.calCell, isToday && styles.calCellToday]}
                  onPress={() => openDay(dateStr)}
                >
                  <Text style={[styles.calDayNum, isToday && styles.calDayNumToday]}>{day}</Text>
                  {hasEvent && <View style={[styles.dot, isToday && styles.dotToday]} />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
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

            {events.map(event => {
              const [sh, sm] = event.start_time.split(':').map(Number);
              const [eh, em] = event.end_time.split(':').map(Number);
              const startSlot = sh * 2 + (sm >= 30 ? 1 : 0);
              const durationMins = (eh * 60 + em) - (sh * 60 + sm);
              const heightPx = Math.max((durationMins / 30) * SLOT_HEIGHT - 3, SLOT_HEIGHT - 3);
              return (
                <Pressable
                  key={event.id}
                  style={[styles.eventBlock, { top: startSlot * SLOT_HEIGHT + 1, height: heightPx }]}
                  onPress={() => setDeleteTarget(event)}
                >
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Neuer Termin</Text>
              {!modalFromPlus && (
                <Text style={styles.sheetSub}>ab {slotToTime(modalSlot)} Uhr</Text>
              )}

              {modalFromPlus && (
                <>
                  <Pressable
                    style={[styles.timeToggle, modalSlot !== null && styles.timeToggleActive]}
                    onPress={() => setModalShowPicker(v => !v)}
                  >
                    <Ionicons
                      name={modalSlot !== null ? 'time' : 'time-outline'}
                      size={s(17)}
                      color={modalSlot !== null ? COLORS.gold : COLORS.textSecondary}
                    />
                    <Text style={[styles.timeToggleText, modalSlot !== null && styles.timeToggleTextActive]}>
                      {modalSlot !== null ? `${slotToTime(modalSlot)} Uhr` : 'Uhrzeit wählen'}
                    </Text>
                    <Ionicons
                      name={modalShowPicker ? 'chevron-up' : 'chevron-down'}
                      size={s(14)}
                      color={COLORS.textDim}
                    />
                  </Pressable>
                  {modalShowPicker && (
                    <DateTimePicker
                      value={modalPickerDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="dark"
                      accentColor={COLORS.gold}
                      minuteInterval={30}
                      onChange={(event, date) => {
                        if (Platform.OS === 'android') {
                          if (event.type !== 'dismissed' && date) {
                            const slot = date.getHours() * 2 + (date.getMinutes() >= 30 ? 1 : 0);
                            setModalSlot(slot);
                            setModalPickerDate(date);
                          }
                          setModalShowPicker(false);
                        } else {
                          if (date) {
                            const slot = date.getHours() * 2 + (date.getMinutes() >= 30 ? 1 : 0);
                            setModalSlot(slot);
                            setModalPickerDate(date);
                          }
                        }
                      }}
                      style={styles.datePicker}
                    />
                  )}
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="Titel"
                placeholderTextColor={COLORS.textDim}
                value={modalTitle}
                onChangeText={setModalTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              <Text style={styles.durationLabel}>DAUER</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(d => (
                  <Pressable
                    key={d.minutes}
                    style={[styles.chip, modalDuration === d.minutes && styles.chipActive]}
                    onPress={() => setModalDuration(d.minutes)}
                  >
                    <Text style={[styles.chipText, modalDuration === d.minutes && styles.chipTextActive]}>
                      {d.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmBtn, (!modalTitle.trim() || modalSlot === null || saving) && styles.confirmBtnDisabled]}
                  onPress={handleSave}
                  disabled={!modalTitle.trim() || modalSlot === null || saving}
                >
                  {saving
                    ? <ActivityIndicator color={COLORS.black} size="small" />
                    : <Text style={styles.confirmBtnText}>Speichern</Text>
                  }
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setDeleteTarget(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{deleteTarget?.title}</Text>
            <Text style={styles.sheetSub}>
              {deleteTarget?.start_time?.slice(0, 5)} – {deleteTarget?.end_time?.slice(0, 5)} Uhr
            </Text>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(deleteTarget.id)}
            >
              <Ionicons name="trash-outline" size={s(18)} color={COLORS.white} />
              <Text style={styles.deleteBtnText}>Termin löschen</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setDeleteTarget(null)}>
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  topBar: {
    position: 'absolute',
    top: sv(54),
    left: s(16),
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  backText: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '600',
  },

  // ─── Calendar ──────────────────────────────────────────────────────────────
  calContent: {
    paddingTop: sv(110),
    paddingHorizontal: s(20),
    paddingBottom: sv(120),
  },
  header: {
    alignItems: 'center',
    marginBottom: sv(32),
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
    fontSize: sf(32),
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
    lineHeight: sf(20),
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sv(16),
    paddingHorizontal: s(4),
  },
  monthArrow: {
    padding: s(8),
  },
  monthLabel: {
    color: COLORS.paleGold,
    fontSize: sf(20),
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: sv(6),
  },
  weekCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: sv(4),
  },
  weekLabel: {
    color: COLORS.textDim,
    fontSize: sf(12),
    fontWeight: '600',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: s(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(127,98,54,0.3)',
    backgroundColor: COLORS.darkCard,
  },
  calCell: {
    width: CELL_SIZE,
    height: sv(52),
    alignItems: 'center',
    justifyContent: 'center',
    gap: sv(3),
    borderWidth: 0.5,
    borderColor: 'rgba(127,98,54,0.15)',
  },
  calCellToday: {
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  calDayNum: {
    color: COLORS.textSecondary,
    fontSize: sf(15),
    fontWeight: '500',
  },
  calDayNumToday: {
    color: COLORS.gold,
    fontWeight: '800',
    fontSize: sf(16),
  },
  dot: {
    width: s(5),
    height: s(5),
    borderRadius: 999,
    backgroundColor: COLORS.gold,
    opacity: 0.7,
  },
  dotToday: {
    opacity: 1,
    backgroundColor: COLORS.paleGold,
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
  timeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(14),
    paddingVertical: sv(11),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.darkCard2,
    marginBottom: sv(12),
  },
  timeToggleActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.07)',
  },
  timeToggleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: sf(14),
  },
  timeToggleTextActive: {
    color: COLORS.softGold,
  },
  datePicker: {
    marginBottom: sv(12),
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
  eventBlock: {
    position: 'absolute',
    left: TIME_LABEL_WIDTH + s(4),
    right: s(12),
    borderRadius: s(8),
    backgroundColor: 'rgba(212,175,55,0.88)',
    paddingHorizontal: s(10),
    paddingVertical: sv(5),
    overflow: 'hidden',
  },
  eventTitle: {
    color: COLORS.black,
    fontSize: sf(13),
    fontWeight: '700',
    flex: 1,
  },
  eventTime: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: sf(10),
    marginTop: sv(2),
  },

  // ─── Modal ─────────────────────────────────────────────────────────────────
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
    borderColor: 'rgba(127,98,54,0.3)',
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
    marginBottom: sv(4),
  },
  sheetSub: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
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
    marginBottom: sv(16),
  },
  durationLabel: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: sv(10),
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: sv(24),
  },
  chip: {
    paddingHorizontal: s(14),
    paddingVertical: sv(8),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: 'rgba(127,98,54,0.4)',
    backgroundColor: COLORS.darkCard2,
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  chipText: {
    color: COLORS.textDim,
    fontSize: sf(13),
  },
  chipTextActive: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: s(10),
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
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: COLORS.black,
    fontSize: sf(15),
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    height: sv(50),
    borderRadius: s(12),
    backgroundColor: 'rgba(210,55,55,0.75)',
    marginBottom: sv(10),
  },
  deleteBtnText: {
    color: COLORS.white,
    fontSize: sf(15),
    fontWeight: '700',
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