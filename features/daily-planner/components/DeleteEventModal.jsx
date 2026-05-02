import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';

export function DeleteEventModal({ event, onClose, onDelete }) {
  return (
    <Modal
      visible={!!event}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>{event?.title}</Text>

          <Text style={styles.sheetSub}>
            {event?.start_time?.slice(0, 5)} – {event?.end_time?.slice(0, 5)} Uhr
          </Text>

          <Pressable
            style={styles.deleteBtn}
            onPress={() => {
              if (event?.id) onDelete(event.id);
            }}
          >
            <Ionicons name="trash-outline" size={s(18)} color={COLORS.white} />
            <Text style={styles.deleteBtnText}>Termin löschen</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
  deleteBtn: {
    minHeight: sv(48),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,70,70,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,70,70,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginBottom: sv(10),
  },
  deleteBtnText: {
    color: COLORS.white,
    fontSize: sf(14),
    fontWeight: '900',
  },
  cancelBtn: {
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
});