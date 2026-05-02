import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import { DURATIONS, slotToTime } from '../utils/plannerUtils';

export function AddEventModal({
  visible,
  onClose,
  modalFromPlus,
  modalSlot,
  setModalSlot,
  modalShowPicker,
  setModalShowPicker,
  modalPickerDate,
  setModalPickerDate,
  modalTitle,
  setModalTitle,
  modalDuration,
  setModalDuration,
  saving,
  onSave,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
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
                  onPress={() => setModalShowPicker(value => !value)}
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
                      } else if (date) {
                        const slot = date.getHours() * 2 + (date.getMinutes() >= 30 ? 1 : 0);
                        setModalSlot(slot);
                        setModalPickerDate(date);
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
              onSubmitEditing={onSave}
            />

            <Text style={styles.durationLabel}>DAUER</Text>

            <View style={styles.durationRow}>
              {DURATIONS.map(duration => (
                <Pressable
                  key={duration.minutes}
                  style={[styles.chip, modalDuration === duration.minutes && styles.chipActive]}
                  onPress={() => setModalDuration(duration.minutes)}
                >
                  <Text style={[styles.chipText, modalDuration === duration.minutes && styles.chipTextActive]}>
                    {duration.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmBtn,
                  (!modalTitle.trim() || modalSlot === null || saving) && styles.confirmBtnDisabled,
                ]}
                onPress={onSave}
                disabled={!modalTitle.trim() || modalSlot === null || saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Speichern</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: s(26),
    borderTopRightRadius: s(26),
    paddingHorizontal: s(20),
    paddingTop: sv(12),
    paddingBottom: sv(26),
    borderTopWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  sheetHandle: {
    width: s(42),
    height: sv(4),
    borderRadius: s(999),
    backgroundColor: COLORS.goldBorder,
    alignSelf: 'center',
    marginBottom: sv(16),
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: sf(21),
    fontWeight: '800',
    marginBottom: sv(6),
  },
  sheetSub: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '700',
    marginBottom: sv(14),
  },
  timeToggle: {
    minHeight: sv(48),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    marginBottom: sv(12),
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
  },
  timeToggleActive: {
    borderColor: COLORS.goldBorder,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  timeToggleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '700',
  },
  timeToggleTextActive: {
    color: COLORS.gold,
  },
  datePicker: {
    marginBottom: sv(8),
  },
  input: {
    minHeight: sv(52),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    color: COLORS.white,
    paddingHorizontal: s(14),
    fontSize: sf(15),
    fontWeight: '600',
    marginBottom: sv(14),
  },
  durationLabel: {
    color: COLORS.textSecondary,
    fontSize: sf(12),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: sv(10),
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    paddingHorizontal: s(12),
    paddingVertical: sv(8),
    borderRadius: s(999),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
  },
  chipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: sf(12),
    fontWeight: '800',
  },
  chipTextActive: {
    color: COLORS.black,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(18),
  },
  cancelBtn: {
    flex: 1,
    minHeight: sv(48),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1,
    minHeight: sv(48),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: COLORS.black,
    fontSize: sf(14),
    fontWeight: '900',
  },
});