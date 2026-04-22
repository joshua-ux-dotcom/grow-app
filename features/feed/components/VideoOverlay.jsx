// components/ui/VideoOverlay.jsx

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function VideoOverlay({
  saved = false,
  onToggleSaved = () => {},
  isPaused = false,
  onResume = () => {},
  onMuteAndResume = () => {},
  isMuted = false,
  showPointReward = false,
}) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.logo}>GROW</Text>

      <View style={styles.rightSide} pointerEvents="box-none">
        {[1, 2, 3, 4].map((item) => (
          <TouchableOpacity key={item} style={styles.circle} activeOpacity={0.8}>
            <View style={styles.innerCircle} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onToggleSaved}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {saved ? (
            <Ionicons name="bookmark" size={31} color="#D4AF37" />
          ) : (
            <Feather name="bookmark" size={31} color="#D4AF37" />
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
              size={18}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={onResume}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={34} color="#fff" />
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
    top: 58,
    alignSelf: 'center',
    color: '#D4AF37',
    fontSize: 17,
    letterSpacing: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(212,175,55,0.35)',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 8,
  },

  rightSide: {
    position: 'absolute',
    right: 22,
    top: height * 0.38,
    alignItems: 'center',
  },

  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.7,
    borderColor: '#D4AF37',
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },

  saveButton: {
    marginTop: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -72 }],
  },

  muteResumeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingLeft: 4,
  },
  pointBubble: {
    marginTop: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 4,
  },

  pointBubbleText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '800',
  },
});