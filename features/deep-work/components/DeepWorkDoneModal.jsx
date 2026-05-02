import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';

export function DeepWorkDoneModal({ visible, onClose, totalMinutes }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, styles.doneSheet]} onPress={() => {}}>
          <View style={styles.iconCircle}>
            <Ionicons name="trophy-outline" size={s(36)} color={COLORS.gold} />
          </View>

          <Text style={styles.doneTitle}>Session abgeschlossen!</Text>

          <Text style={styles.doneSub}>
            {totalMinutes} Min. fokussierte Arbeit. Starke Leistung.
          </Text>

          <Pressable style={[styles.confirmBtn, { marginTop: sv(8) }]} onPress={onClose}>
            <Text style={styles.confirmBtnText}>Weiter</Text>
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
  doneSheet: {
    alignItems: 'center',
    paddingTop: sv(28),
  },
  iconCircle: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.09)',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginBottom: sv(16),
  },
  doneTitle: {
    color: COLORS.white,
    fontSize: sf(22),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: sv(8),
  },
  doneSub: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    textAlign: 'center',
    lineHeight: sf(20),
    marginBottom: sv(14),
  },
  confirmBtn: {
    minHeight: sv(48),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: s(22),
  },
  confirmBtnText: {
    color: COLORS.black,
    fontSize: sf(14),
    fontWeight: '900',
  },
});