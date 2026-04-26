import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
 
import VideoOverlay from './VideoOverlay';
import FeedProgressBar from './FeedProgressBar';
import { useWatchReward } from '../hooks/useWatchReward';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { useVideoRating } from '../hooks/useVideoRating';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf, SCREEN } from '../../../constants/layout';
import { supabase } from '../../../services/supabaseClient';
 
const { width, height } = Dimensions.get('window');
 
const LONG_PRESS_DELAY = 120;
 
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
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [userId, setUserId] = useState(null);
 
  const hasReportedReady = useRef(false);
 
  const player = useVideoPlayer(item.source, (playerInstance) => {
    playerInstance.loop = true;
  });
 
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);
 
  const {
    progress,
    duration,
    canScrub,
    safeProgress,
    thumbLeft,
    setTrackWidth,
    panHandlers,
    setProgress,
  } = useVideoProgress({
    player,
    isActive,
    isFeedFocused,
    isScrubbing,
    setIsScrubbing,
  });
 
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
  }, [isActive, isFeedFocused, isHolding, isScrubbing, isPausedByUser, player, setProgress]);
 
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    }
    loadUser();
  }, []);
 
  const { showPointReward } = useWatchReward({
    isActive,
    progress,
    duration,
    userId,
    videoId: item.id,
  });
 
  const { activeRating, rate } = useVideoRating({
    userId,
    videoId: item.id,
    isActive,
  });
 
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
        onPress={() => setIsPausedByUser((prev) => !prev)}
        onLongPress={() => setIsHolding(true)}
        delayLongPress={LONG_PRESS_DELAY}
        onPressOut={() => setIsHolding(false)}
      />
 
      <View style={styles.overlayDark} pointerEvents="none" />
 
      <View style={styles.overlayContent} pointerEvents="box-none">
        <VideoOverlay
          saved={item.saved}
          onToggleSaved={onToggleSaved}
          isPaused={isPausedByUser}
          isMuted={isMuted}
          showPointReward={showPointReward}
          activeRating={activeRating}
          onRate={rate}
          onResume={() => setIsPausedByUser(false)}
          onMuteAndResume={() => {
            setIsMuted((prev) => !prev);
            setIsPausedByUser(false);
          }}
        />
      </View>
 
      <FeedProgressBar
        safeProgress={safeProgress}
        canScrub={canScrub}
        thumbLeft={thumbLeft}
        onTrackLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        panHandlers={panHandlers}
      />
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
});