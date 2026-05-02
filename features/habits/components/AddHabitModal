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
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import { DAYS } from '../utils/habitUtils';

export function AddHabitModal({
  visible,
  onClose,
  inputName,
  setInputName,
  allDays,
  modalDays,
  toggleModalDay,
  toggleAllDays,
  addError,
  canAdd,
  adding,
  onAdd,
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
            <Text style={styles.sheetTitle}>Neue Gewohnheit</Text>

            <TextInput
              style={styles.input}
              placeholder="Name der Gewohnheit"
              placeholderTextColor={COLORS.textDim}
              value={inputName}
              onChangeText={setInputName}
              autoFocus
              returnKeyType="done"
            />

            <Text style={styles.dayLabel}>An welchen Tagen?</Text>

            <View style={styles.modalDayRow}>
              {DAYS.map((day, index) => {
                const active = allDays || modalDays.has(index);

                return (
                  <Pressable
                    key={day}
                    style={[styles.modalDayBtn, active && styles.modalDayBtnActive]}
                    onPress={() => toggleModalDay(index)}
                  >
                    <Text style={[styles.modalDayText, active && styles.modalDayTextActive]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.allDaysRow} onPress={toggleAllDays}>
              <View style={[styles.checkboxSmall, allDays && styles.checkboxSmallDone]}>
                {allDays && (
                  <Ionicons name="checkmark" size={s(11)} color={COLORS.black} />
                )}
              </View>
              <Text style={styles.allDaysText}>An allen Tagen</Text>
            </Pressable>

            {addError && (
              <View style={styles.modalErrorRow}>
                <Ionicons name="alert-circle-outline" size={s(15)} color="#FF6B6B" />
                <Text style={styles.modalErrorText}>{addError}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmBtn, (!canAdd || adding) && styles.confirmBtnDisabled]}
                onPress={onAdd}
                disabled={!canAdd || adding}
              >
                {adding ? (
                  <ActivityIndicator color={COLORS.black} />
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
  dayLabel: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '700',
    marginTop: sv(16),
    marginBottom: sv(9),
  },
  modalDayRow: {
    flexDirection: 'row',
    gap: s(7),
  },
  modalDayBtn: {
    flex: 1,
    minHeight: sv(38),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDayBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  modalDayText: {
    color: COLORS.textSecondary,
    fontSize: sf(12),
    fontWeight: '900',
  },
  modalDayTextActive: {
    color: COLORS.black,
  },
  allDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
    marginTop: sv(13),
  },
  checkboxSmall: {
    width: s(18),
    height: s(18),
    borderRadius: s(5),
    borderWidth: 1.3,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSmallDone: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  allDaysText: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: '700',
  },
  modalErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(7),
    marginTop: sv(12),
  },
  modalErrorText: {
    flex: 1,
    color: '#FF6B6B',
    fontSize: sf(12),
    fontWeight: '700',
  },
  modalButtons: {
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