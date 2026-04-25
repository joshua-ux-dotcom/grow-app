import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function ToolCard({
  icon,
  title,
  description,
  onPress,
  disabled = false,
  badgeText,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        disabled && styles.cardDisabled,
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

      <View style={[styles.iconWrapper, disabled && styles.iconWrapperDisabled]}>
        {typeof icon === 'string' ? (
          <Text style={[styles.icon, disabled && styles.iconDisabled]}>{icon}</Text>
        ) : (
          icon
        )}
      </View>

      <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={2}>
        {title}
      </Text>

      <Text
        style={[styles.description, disabled && styles.descriptionDisabled]}
        numberOfLines={2}
      >
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31.5%',
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    minHeight: 118,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardDisabled: {
    borderColor: COLORS.borderStrong,
    backgroundColor: '#0a0a0d',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#1a1320',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  badgeText: {
    color: COLORS.softGold,
    fontSize: 9.5,
    fontWeight: '700',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    backgroundColor: COLORS.darkCard2,
  },
  iconWrapperDisabled: {
    borderColor: COLORS.borderStrong,
    backgroundColor: '#111116',
  },
  icon: {
    fontSize: 17,
  },
  iconDisabled: {
    opacity: 0.8,
  },
  title: {
    color: COLORS.paleGold,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  titleDisabled: {
    color: COLORS.textSecondary,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 8.8,
    lineHeight: 11,
    textAlign: 'center',
  },
  descriptionDisabled: {
    color: '#8a8591',
  },
});