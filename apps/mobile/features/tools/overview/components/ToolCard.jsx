import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf, SCREEN } from '../../../../constants/layout';
import PressableScale from '../../../../components/ui/PressableScale';

const compact = SCREEN.height < 900;
const veryCompact = SCREEN.height < 760;

export default function ToolCard({
  icon,
  image,
  title,
  description,
  onPress,
  onLongPress,
  disabled = false,
  badgeText,
  cardStyle,
  size = 'normal',
  placeholder = false,
  selected = false,
  editing = false,
}) {
  const isSmall = size === 'small';

  if (placeholder) {
    return (
      <PressableScale
        activeScale={0.985}
        activeOpacity={0.9}
        style={[
          styles.card,
          isSmall && styles.smallCard,
          image && styles.imageCard,
          !image && styles.placeholderCard,
          cardStyle,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        delayLongPress={350}
        haptic="light"
      >
        {image ? (
          <ImageBackground
            source={image}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
            resizeMode="cover"
          >
            <View style={[styles.imageTextBox, isSmall && styles.smallImageTextBox]}>
              <Text
                style={[styles.imageTitle, isSmall && styles.smallImageTitle]}
                numberOfLines={1}
              >
                In Bearbeitung
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <>
            <View style={[styles.iconWrapper, isSmall && styles.smallIconWrapper]}>
              <Ionicons
                name="construct-outline"
                size={isSmall ? s(17) : s(21)}
                color="rgba(255,241,210,0.42)"
              />
            </View>

            <Text style={[styles.title, isSmall && styles.smallTitle]} numberOfLines={1}>
              In Bearbeitung
            </Text>
          </>
        )}
      </PressableScale>
    );
  }

  return (
    <PressableScale
      activeScale={0.985}
      activeOpacity={0.9}
      style={[
        styles.card,
        isSmall && styles.smallCard,
        image && styles.imageCard,
        disabled && styles.cardDisabled,
        selected && editing && styles.cardSelected,
        cardStyle,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      delayLongPress={350}
      haptic="light"
    >
      {editing && selected ? (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={s(12)} color={COLORS.black} />
        </View>
      ) : null}

      {image ? (
        <ImageBackground
          source={image}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          {badgeText ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          ) : null}

          <View style={[styles.imageTextBox, isSmall && styles.smallImageTextBox]}>
            <Text
              style={[
                styles.imageTitle,
                isSmall && styles.smallImageTitle,
                disabled && styles.titleDisabled,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {!!description && !isSmall && (
              <Text style={styles.imageDescription} numberOfLines={2}>
                {description}
              </Text>
            )}
          </View>
        </ImageBackground>
      ) : (
        <>
          {badgeText ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.iconWrapper,
              isSmall && styles.smallIconWrapper,
              disabled && styles.iconWrapperDisabled,
            ]}
          >
            {typeof icon === 'string' ? (
              <Text style={[styles.icon, disabled && styles.iconDisabled]}>{icon}</Text>
            ) : (
              icon
            )}
          </View>

          <Text
            style={[
              styles.title,
              isSmall && styles.smallTitle,
              disabled && styles.titleDisabled,
              disabled && styles.disabledTitle,
            ]}
            numberOfLines={isSmall ? 1 : disabled ? 1 : 2}
          >
            {title}
          </Text>

          {!!description && !isSmall && (
            <Text
              style={[
                styles.description,
                disabled && styles.descriptionDisabled,
                disabled && styles.disabledDescription,
              ]}
              numberOfLines={disabled ? 1 : 2}
            >
              {description}
            </Text>
          )}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#08060B',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(51, 51, 51, 0.99)',
    borderRadius: s(8),
    paddingVertical: compact ? sv(6) : sv(8),
    paddingHorizontal: s(6),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  smallCard: {
    paddingVertical: veryCompact ? sv(4) : sv(5),
    paddingHorizontal: s(4),
  },

  imageCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },

  placeholderCard: {
    borderColor: 'rgba(255,255,255,0.075)',
    backgroundColor: '#07050A',
    opacity: 0.82,
  },

  cardDisabled: {
    borderColor: 'rgb(39, 39, 39)',
    backgroundColor: '#07050A',
    opacity: 0.78,
    paddingVertical: veryCompact ? sv(3) : compact ? sv(4) : sv(6),
  },

  cardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },


  selectedBadge: {
    position: 'absolute',
    top: sv(6),
    right: s(6),
    zIndex: 5,
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  imageStyle: {
    borderRadius: s(8),
  },

  imageTextBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '54%',
    paddingHorizontal: s(6),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  smallImageTextBox: {
    top: '58%',
    paddingHorizontal: s(4),
  },

  imageTitle: {
    color: COLORS.toolsGold,
    fontSize: veryCompact ? sf(8.6) : compact ? sf(9.6) : sf(10.6),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    backgroundColor: 'transparent',

    textShadowColor: 'rgba(231,201,138,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1.5,
  },

  smallImageTitle: {
    fontSize: veryCompact ? sf(6.8) : compact ? sf(7.4) : sf(8),
  },

  imageDescription: {
    marginTop: sv(3),
    color: COLORS.softGold ?? COLORS.toolsGold,
    fontSize: veryCompact ? sf(6) : compact ? sf(6.6) : sf(7.2),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: veryCompact ? sf(7.8) : compact ? sf(8.5) : sf(9.2),
    backgroundColor: 'transparent',

    textShadowColor: 'rgba(231,201,138,0.18)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },

  badge: {
    position: 'absolute',
    top: sv(8),
    right: s(8),
    paddingHorizontal: s(7),
    paddingVertical: sv(3),
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  badgeText: {
    color: 'rgba(255,241,210,0.68)',
    fontSize: sf(8.8),
    fontWeight: '400',
  },

  iconWrapper: {
    width: compact ? s(34) : s(38),
    height: compact ? s(34) : s(38),
    borderRadius: compact ? s(17) : s(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: compact ? sv(4) : sv(6),
    backgroundColor: 'transparent',
    shadowColor: COLORS.toolsGold,
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },

  smallIconWrapper: {
    width: veryCompact ? s(24) : s(28),
    height: veryCompact ? s(24) : s(28),
    borderRadius: veryCompact ? s(12) : s(14),
    marginBottom: veryCompact ? sv(2) : sv(3),
  },

  iconWrapperDisabled: {
    width: veryCompact ? s(25) : compact ? s(28) : s(32),
    height: veryCompact ? s(25) : compact ? s(28) : s(32),
    borderRadius: veryCompact ? s(12.5) : compact ? s(14) : s(16),
    marginBottom: veryCompact ? sv(1) : compact ? sv(2) : sv(4),
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  icon: {
    color: COLORS.toolsGold,
    fontSize: compact ? sf(17) : sf(18),
    textShadowColor: 'rgba(231,201,138,0.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  iconDisabled: {
    opacity: 0.42,
  },

  title: {
    color: COLORS.toolsGold,
    fontSize: compact ? sf(10.2) : sf(10.8),
    fontWeight: '700',
    marginBottom: compact ? sv(2) : sv(3),
    textAlign: 'center',
    letterSpacing: 0.2,
    backgroundColor: 'transparent',

    textShadowColor: 'rgba(231,201,138,0.22)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1.5,
  },

  smallTitle: {
    fontSize: veryCompact ? sf(7.6) : compact ? sf(8.2) : sf(8.8),
    marginBottom: 0,
  },

  disabledTitle: {
    fontSize: veryCompact ? sf(8.8) : compact ? sf(9.4) : sf(10),
    marginBottom: veryCompact ? sv(1) : sv(2),
  },

  titleDisabled: {
    color: 'rgba(216,209,227,0.62)',
    fontWeight: '500',
  },

  description: {
    color: COLORS.softGold ?? COLORS.toolsGold,
    fontSize: compact ? sf(7.8) : sf(8.4),
    fontWeight: '400',
    lineHeight: compact ? sf(10) : sf(11),
    textAlign: 'center',
    backgroundColor: 'transparent',

    textShadowColor: 'rgba(231,201,138,0.14)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },

  disabledDescription: {
    fontSize: veryCompact ? sf(6.8) : compact ? sf(7.2) : sf(7.8),
    lineHeight: veryCompact ? sf(8.2) : compact ? sf(9) : sf(10),
  },

  descriptionDisabled: {
    color: 'rgba(216,209,227,0.38)',
  },
});