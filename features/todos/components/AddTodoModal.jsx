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

export function AddTodoModal({
  visible,
  onClose,
  inputTitle,
  setInputTitle,
  selectedDate,
  setSelectedDate,
  showDatePicker,
  setShowDatePicker,
  androidStep,
  setAndroidStep,
  datePickerLabel,
  adding,
  onAdd,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Neue Aufgabe</Text>

            <TextInput
              style={styles.input}
              placeholder="Was willst du erledigen?"
              placeholderTextColor={COLORS.textDim}
              value={inputTitle}
              onChangeText={setInputTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onAdd}
            />

            <Pressable
              style={[styles.dateToggle, showDatePicker && styles.dateToggleActive]}
              onPress={() => {
                if (!showDatePicker) {
                  setSelectedDate(new Date(Date.now() + 60 * 60 * 1000));
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(false);
                  setSelectedDate(null);
                }
              }}
            >
              <Ionicons
                name={showDatePicker ? 'time' : 'time-outline'}
                size={s(17)}
                color={showDatePicker ? COLORS.gold : COLORS.textSecondary}
              />
              <Text style={[styles.dateToggleText, showDatePicker && styles.dateToggleTextActive]}>
                {datePickerLabel}
              </Text>
              {showDatePicker && (
                <Ionicons name="close-circle" size={s(16)} color={COLORS.textDim} />
              )}
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode={Platform.OS === 'android' ? androidStep : 'datetime'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                themeVariant="dark"
                accentColor={COLORS.gold}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                      setAndroidStep('date');
                    } else if (androidStep === 'date') {
                      setSelectedDate(date);
                      setAndroidStep('time');
                    } else {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                      setAndroidStep('date');
                    }
                  } else if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={styles.datePicker}
              />
            )}

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmBtn, (!inputTitle.trim() || adding) && styles.confirmBtnDisabled]}
                onPress={onAdd}
                disabled={!inputTitle.trim() || adding}
              >
                {adding ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Hinzufügen</Text>
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
    marginBottom: sv(16),
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
  },
  dateToggle: {
    minHeight: sv(48),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    marginTop: sv(12),
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
  },
  dateToggleActive: {
    borderColor: COLORS.goldBorder,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  dateToggleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '700',
  },
  dateToggleTextActive: {
    color: COLORS.gold,
  },
  datePicker: {
    marginTop: sv(8),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(16),
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