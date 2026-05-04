import { StyleSheet } from 'react-native';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout'
import {
  SLOT_HEIGHT,
  TIME_LABEL_WIDTH,
} from '../utils/plannerUtils'

export const styles = StyleSheet.create({
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