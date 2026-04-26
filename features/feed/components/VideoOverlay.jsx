import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf, SCREEN } from '../../../constants/layout';
import { RATINGS } from '../hooks/useVideoRating';
 
const { height } = Dimensions.get('window');
 
export default function VideoOverlay({
  saved = false,
  onToggleSaved = () => {},
  isPaused = false,
  onResume = () => {},
  onMuteAndResume = () => {},
  isMuted = false,
  showPointReward = false,
  activeRating = null,
  onRate = () => {},
}) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.logo}>GROW</Text>
 
      <View style={styles.rightSide} pointerEvents="box-none">
        {RATINGS.map(({ key, emoji }) => {
          const isActive = activeRating === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.circle, isActive && styles.circleActive]}
              activeOpacity={0.75}
              onPress={() => onRate(key)}
            >
              <Text style={[styles.emoji, isActive && styles.emojiActive]}>
                {emoji}
              </Text>
            </TouchableOpacity>
          );
        })}
 
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onToggleSaved}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {saved ? (
            <Ionicons name="bookmark" size={s(31)} color={COLORS.gold} />
          ) : (
            <Feather name="bookmark" size={s(31)} color={COLORS.gold} />
          )}
        </TouchableOpacity>
 
        {showPointReward && (
          <View style={styles.pointBubble} pointerEvents="none">
            <Text style={styles.pointBubbleText}>+1</Text>
          </View>
        )}
      </View>
 
      {isPaused && (
        <View style={styles.pauseOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.muteResumeButton}
            onPress={onMuteAndResume}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={s(18)}
              color={COLORS.white}
            />
          </TouchableOpacity>
 
          <TouchableOpacity
            style={styles.playButton}
            onPress={onResume}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={s(34)} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    position: 'absolute',
    top: sv(58),
    alignSelf: 'center',
    color: COLORS.gold,
    fontSize: sf(17),
    letterSpacing: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(212,175,55,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  rightSide: {
    position: 'absolute',
    right: s(10),
    top: SCREEN.height * 0.38,
    alignItems: 'center',
  },
  circle: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: sv(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  circleActive: {
    backgroundColor: 'rgba(212,175,55,0.25)',
    borderColor: COLORS.softGold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: s(8),
    elevation: 6,
  },
  emoji: {
    fontSize: sf(14),
    opacity: 0.6,
  },
  emojiActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  saveButton: {
    marginTop: sv(20),
    width: s(42),
    height: s(42),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -sv(72) }],
  },
  muteResumeButton: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    marginBottom: sv(14),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playButton: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingLeft: s(4),
  },
  pointBubble: {
    marginTop: sv(8),
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.22,
    shadowRadius: s(6),
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pointBubbleText: {
    color: COLORS.nearBlack,
    fontSize: sf(11),
    fontWeight: '800',
  },
});