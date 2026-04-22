import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  View,
  Pressable,
  PanResponder,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import VideoOverlay from '../ui/VideoOverlay';
import { COLORS } from '../../constants/colors';
import { awardVideoPoints } from '../../features/gamification/services/growPoints';

const { width, height } = Dimensions.get('window');

const PROGRESS_UPDATE_INTERVAL = 150;
const LONG_PRESS_DELAY = 120;
const PROGRESS_AREA_SIDE = 18;
const PROGRESS_AREA_BOTTOM = 65;
const THUMB_SIZE = 10;
const TEST_USER_ID = '06274c6b-c4a4-42c3-871a-c3571aa74865';
const WATCH_THRESHOLD = 0.8;

export default function FeedItem({
  item,
  isActive,
  isFeedFocused,
  isMuted,
  setIsMuted,
  onToggleSaved,
  onVideoReady,
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [showPointReward, setShowPointReward] = useState(false);

  const hasReportedReady = useRef(false);
  const hasAwardedPointsRef = useRef(false);
  const isAwardingPointsRef = useRef(false);

  const player = useVideoPlayer(item.source, (playerInstance) => {
    playerInstance.loop = true;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    const shouldPlay =
      isActive &&
      isFeedFocused &&
      !isHolding &&
      !isScrubbing &&
      !isPausedByUser;

    if (!isActive) {
      player.pause();
      player.currentTime = 0;
      setProgress(0);
      setIsPausedByUser(false);
      return;
    }

    if (!isFeedFocused) {
      player.pause();
      return;
    }

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [
    isActive,
    isFeedFocused,
    isHolding,
    isScrubbing,
    isPausedByUser,
    player,
  ]);
  
  useEffect(() => {
    if (!isActive) {
      hasAwardedPointsRef.current = false;
      isAwardingPointsRef.current = false;
      setShowPointReward(false);
    }
  }, [isActive, item.id]);

  useEffect(() => {
    let intervalId;

    if (isActive && isFeedFocused && !isScrubbing) {
      intervalId = setInterval(() => {
        const current = player.currentTime ?? 0;
        const total = player.duration ?? 0;

        setDuration(total);

        if (total > 0) {
          const nextProgress = current / total;
          setProgress(Math.max(0, Math.min(nextProgress, 1)));
        } else {
          setProgress(0);
        }
      }, PROGRESS_UPDATE_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, isFeedFocused, isScrubbing, player]);

  const awardVideoPointIfNeeded = useCallback(async () => {
    if (hasAwardedPointsRef.current) return;
    if (isAwardingPointsRef.current) return;

    isAwardingPointsRef.current = true;

    try {
      const userId = TEST_USER_ID;
      const videoId = item.id;

      const result = await awardVideoPoints(userId, videoId);

      if (result?.reason === 'already_awarded') {
        hasAwardedPointsRef.current = true;
        return;
      }

      if (result?.awarded) {
        hasAwardedPointsRef.current = true;
        setShowPointReward(true);

        setTimeout(() => {
          setShowPointReward(false);
        }, 2200);
      }
    } catch (error) {
      console.log('Fehler bei Video-Grow-Points:', error);
    } finally {
      isAwardingPointsRef.current = false;
    }
  }, [item.id]);

  useEffect(() => {
    if (!isActive) return;
    if (duration <= 0) return;
    if (hasAwardedPointsRef.current) return;

    if (progress >= WATCH_THRESHOLD) {
      awardVideoPointIfNeeded();
    }
  }, [progress, duration, isActive, awardVideoPointIfNeeded]);

  const canScrub = duration > 0 && trackWidth > 0;

  const updateSeekFromX = useCallback(
    (x) => {
      if (!canScrub) return;

      const clampedX = Math.max(0, Math.min(x, trackWidth));
      const ratio = clampedX / trackWidth;
      const newTime = ratio * duration;

      player.currentTime = newTime;
      setProgress(ratio);
    },
    [canScrub, duration, trackWidth, player]
  );

  const progressPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canScrub,
        onMoveShouldSetPanResponder: () => canScrub,

        onPanResponderGrant: (event) => {
          setIsScrubbing(true);
          updateSeekFromX(event.nativeEvent.locationX);
        },

        onPanResponderMove: (event) => {
          updateSeekFromX(event.nativeEvent.locationX);
        },

        onPanResponderRelease: (event) => {
          updateSeekFromX(event.nativeEvent.locationX);
          setIsScrubbing(false);
        },

        onPanResponderTerminate: () => {
          setIsScrubbing(false);
        },
      }),
    [canScrub, updateSeekFromX]
  );

  const safeProgress = Math.max(0, Math.min(progress, 1));

  const thumbLeft = Math.max(
    0,
    Math.min(
      safeProgress * trackWidth - THUMB_SIZE / 2,
      Math.max(trackWidth - THUMB_SIZE, 0)
    )
  );

  return (
    <View style={styles.page}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
        onFirstFrameRender={() => {
          if (!hasReportedReady.current) {
            hasReportedReady.current = true;
            onVideoReady?.();
          }
        }}
      />

      <Pressable
        style={styles.touchLayer}
        onPress={() => {
          setIsPausedByUser((prev) => !prev);
        }}
        onLongPress={() => {
          setIsHolding(true);
        }}
        delayLongPress={LONG_PRESS_DELAY}
        onPressOut={() => {
          setIsHolding(false);
        }}
      />

      <View style={styles.overlayDark} pointerEvents="none" />

      <View style={styles.overlayContent} pointerEvents="box-none">
        <VideoOverlay
          saved={item.saved}
          onToggleSaved={onToggleSaved}
          isPaused={isPausedByUser}
          isMuted={isMuted}
          showPointReward={showPointReward}
          onResume={() => {
            setIsPausedByUser(false);
          }}
          onMuteAndResume={() => {
            setIsMuted((prev) => !prev);
            setIsPausedByUser(false);
          }}
        />
      </View>

      <View style={styles.progressArea}>
        <View
          style={styles.progressTouchZone}
          onLayout={(event) => {
            setTrackWidth(event.nativeEvent.layout.width);
          }}
          {...progressPanResponder.panHandlers}
        >
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${safeProgress * 100}%` },
              ]}
            />
          </View>

          {canScrub && (
            <View
              style={[
                styles.progressThumb,
                { left: thumbLeft },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width,
    height,
    backgroundColor: COLORS.background,
  },

  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  touchLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },

  overlayDark: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.overlayDark,
    zIndex: 1,
  },

  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },

  progressArea: {
    position: 'absolute',
    left: PROGRESS_AREA_SIDE,
    right: PROGRESS_AREA_SIDE,
    bottom: PROGRESS_AREA_BOTTOM,
    zIndex: 5,
  },

  progressTouchZone: {
    justifyContent: 'center',
    height: 24,
  },

  progressTrack: {
    width: '100%',
    height: 2.5,
    borderRadius: 999,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.gold,
  },

  progressThumb: {
    position: 'absolute',
    top: 7,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.black,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
});