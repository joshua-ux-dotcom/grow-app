import { StyleSheet } from 'react-native';
import { COLORS } from '../../../../constants/colors';
import { s, sv, sf, SCREEN } from '../../../../constants/layout';

const veryCompact = SCREEN.height < 760;
const compact = SCREEN.height < 820;

export const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: COLORS.black 
  },
  content: {
    flex: 1,
    paddingTop: sv(66),
    paddingHorizontal: s(14),
    paddingBottom: sv(72),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: veryCompact ? sv(2) : compact ? sv(6) : sv(16),
    paddingHorizontal: s(2)
  },
  leftHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  avatar: { 
    width: s(56), 
    height: s(56), 
    borderRadius: s(28), 
    borderWidth: 1.5, 
    borderColor: COLORS.goldBorderLight, 
    backgroundColor: COLORS.darkCard3, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(12) 
  },
  avatarText: { 
    fontSize: sf(20) 
  },
  headerTextBox: { 
    flex: 1 
  },
  topLabel: { 
    color: COLORS.dimGold, 
    fontSize: sf(10), 
    letterSpacing: 2, 
    marginBottom: sv(2) 
  },
  accountName: { 
    color: COLORS.softGold, 
    fontSize: sf(20), 
    fontWeight: '700' 
  },
  rightHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  pointsBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(12), 
  },
  pointsRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: sv(2),
  },
  coinPlaceholder: { 
    width: s(24), 
    height: s(24), 
    borderRadius: s(12), 
    borderWidth: 1.5, 
    borderColor: COLORS.goldBorderLight, 
    backgroundColor: COLORS.darkCard2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(6), 
    shadowColor: COLORS.dimGold, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 6 
  },
  coinStar: { 
    color: COLORS.softGold, 
    fontSize: sf(11), 
    fontWeight: '700', 
  },
  pointsValue: { 
    color: COLORS.softGold, 
    fontSize: sf(18), 
    fontWeight: '700' 
  },
  pointsLabel: { 
    color: COLORS.mutedGold, 
    fontSize: sf(9),
    textAlign: 'center',
  },
  menuButton: { 
    marginLeft: s(10), 
    padding: s(4) 
  },
  dropdown: { 
    position: 'absolute', 
    top: sv(46), 
    right: 0, 
    width: s(190), 
    backgroundColor: COLORS.darkCard, 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    borderRadius: s(14), 
    paddingVertical: sv(10), 
    paddingHorizontal: s(14), 
    zIndex: 999 
  },
  menuItem: { 
    color: COLORS.softGold, 
    fontSize: sf(14), 
    paddingVertical: 8 
  },
  logoutItem: { 
    color: COLORS.error, 
    fontSize: sf(14), 
    paddingVertical: 8 
  },
  line: { 
    height: 1, 
    backgroundColor: COLORS.goldBorder, 
    marginVertical: 6 
  },
  sectionHeader: {
    marginBottom: veryCompact ? sv(2) : compact ? sv(4) : sv(12),
    paddingHorizontal: s(2)
  },
  sectionTitle: { 
    color: COLORS.paleGold, 
    fontSize: sf(22), 
    fontWeight: '700', 
    marginBottom: sv(4), 
    letterSpacing: 1 
  },
  sectionSubtitle: { 
    color: COLORS.mutedGold, 
    fontSize: sf(12.5), 
    lineHeight: sf(18) 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  mentorCard: {
    marginTop: compact ? 0 : sv(4),
    marginBottom: veryCompact ? sv(2) : compact ? sv(4) : sv(10),
    borderRadius: s(16), 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    backgroundColor: COLORS.darkCard, 
    paddingVertical: sv(8), 
    paddingHorizontal: s(12), 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    minHeight: sv(82) 
  },
  mentorLeft: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  mentorIconWrap: { 
    width: s(42), 
    height: s(42), 
    borderRadius: s(12), 
    borderWidth: 1, 
    borderColor: COLORS.goldBorder, 
    backgroundColor: COLORS.darkCard2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: s(10) 
  },
  mentorTextBox: { 
    flex: 1 
  },
  mentorTitle: { 
    color: COLORS.paleGold, 
    fontSize: sf(13.5), 
    fontWeight: '700', 
    marginBottom: sv(2) 
  },
  mentorDescription: { 
    color: COLORS.textMuted, 
    fontSize: sf(9), 
    lineHeight: 12 
  },
  mentorButton: { 
    borderWidth: 1,
    borderColor: COLORS.goldBorder, 
    borderRadius: 999, 
    paddingVertical: sv(6), 
    paddingHorizontal: s(10), 
    backgroundColor: COLORS.darkCard2 
  },
  mentorButtonText: { 
    color: COLORS.softGold, 
    fontSize: sf(9.5), 
    fontWeight: '700' 
  },
  trackerSection: {
    flex: 1,
    marginTop: sv(4),
    paddingHorizontal: s(2),
  },
  trackerTitle: {
    color: COLORS.paleGold,
    fontSize: sf(15),
    fontWeight: '700',
    marginBottom: sv(2),
    letterSpacing: 1
  },
  trackerSubtitle: {
    color: COLORS.mutedGold,
    fontSize: sf(11),
    marginBottom: sv(4),
  },
  trackerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
    maxHeight: sv(110),
  },
});