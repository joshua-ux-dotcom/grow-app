import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { s, sv, sf, SCREEN } from '../../constants/layout';

const compact = SCREEN.height < 900;
const veryCompact = SCREEN.height < 700;
 
export default function ToolCard({ icon, title, description, onPress, disabled = false, badgeText }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        disabled && styles.cardDisabled,
        disabled && styles.cardDisabledHeight,
        pressed && !disabled && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {badgeText ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
 
      <View style={[styles.iconWrapper, disabled && styles.iconWrapperDisabled, disabled && styles.iconWrapperSmall]}>
        {typeof icon === 'string' ? (
          <Text style={[styles.icon, disabled && styles.iconDisabled]}>{icon}</Text>
        ) : (
          icon
        )}
      </View>
 
      <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={2}>
        {title}
      </Text>
      {!!description && (
        <Text style={[styles.description, disabled && styles.descriptionDisabled]} numberOfLines={2}>
          {description}
        </Text>
      )}
    </Pressable>
  );
}
 
const styles = StyleSheet.create({
  card: {
    width: '31.5%',
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: s(16),
    paddingVertical: sv(8),
    paddingHorizontal: s(6),
    marginBottom: sv(8),
    minHeight: sv(118),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardDisabledHeight: {
    minHeight: veryCompact ? sv(48) : compact ? sv(58) : sv(68),
    paddingVertical: veryCompact ? sv(4) : compact ? sv(5) : sv(6),
  },
  cardDisabled: {
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.darkCard,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: sv(8),
    right: s(8),
    paddingHorizontal: s(7),
    paddingVertical: sv(3),
    borderRadius: 999,
    backgroundColor: COLORS.darkCard3,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  badgeText: {
    color: COLORS.softGold,
    fontSize: sf(9.5),
    fontWeight: '700',
  },
  iconWrapper: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sv(7),
    backgroundColor: COLORS.darkCard2,
  },
  iconWrapperDisabled: {
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.darkCard3,
  },
  iconWrapperSmall: {
    width: veryCompact ? s(24) : compact ? s(28) : s(32),
    height: veryCompact ? s(24) : compact ? s(28) : s(32),
    borderRadius: veryCompact ? s(12) : compact ? s(14) : s(16),
    marginBottom: veryCompact ? sv(3) : compact ? sv(4) : sv(5),
  },
  icon: { fontSize: sf(17) },
  iconDisabled: { opacity: 0.8 },
  title: {
    color: COLORS.paleGold,
    fontSize: sf(11.5),
    fontWeight: '700',
    marginBottom: sv(3),
    textAlign: 'center',
  },
  titleDisabled: { color: COLORS.textSecondary },
  description: {
    color: COLORS.textMuted,
    fontSize: sf(8.8),
    lineHeight: sf(11),
    textAlign: 'center',
  },
  descriptionDisabled: { color: COLORS.textDim },
});