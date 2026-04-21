// app/(tabs)/index.jsx

import {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  Pressable,
  PanResponder,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import VideoOverlay from '../../components/ui/VideoOverlay';
import { supabase } from '../../lib/supabase';

const { height, width } = Dimensions.get('window');

const PROGRESS_UPDATE_INTERVAL = 150;
const LONG_PRESS_DELAY = 120;
const PROGRESS_AREA_SIDE = 18;
const PROGRESS_AREA_BOTTOM = 65;
const THUMB_SIZE = 10;

function FeedItem({
  item,
  isActive,
  isFeedFocused,
  isMuted,
  setIsMuted,
  onToggleSaved,
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

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

export default function FeedScreen() {
  const [feedData, setFeedData] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const isFocused = useIsFocused();

  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const dragStartOffsetY = useRef(0);

  const FLICK_THRESHOLD = 28;

  useEffect(() => {
  const loadVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.log('Fehler beim Laden der Videos:', error);
      return;
    }

    const formattedVideos = data.map((video) => ({
      id: video.id,
      source: video.video_url,
      saved: false,
    }));

    setFeedData(formattedVideos);

    if (formattedVideos.length > 0) {
      setActiveVideoId(formattedVideos[0].id);
    }
  };

  loadVideos();
}, []);

  const handleToggleSaved = useCallback((id) => {
    setFeedData((prevData) =>
      prevData.map((video) =>
        video.id === id
          ? { ...video, saved: !video.saved }
          : video
      )
    );
  }, []);

  const handleScroll = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const nextIndex = Math.round(offsetY / height);

      if (
        nextIndex !== currentIndexRef.current &&
        nextIndex >= 0 &&
        nextIndex < feedData.length
      ) {
        currentIndexRef.current = nextIndex;
        setActiveVideoId(feedData[nextIndex].id);
      }
    },
    [feedData]
  );

  const handleScrollBeginDrag = useCallback((event) => {
    setIsScrolling(true);
    dragStartOffsetY.current = event.nativeEvent.contentOffset.y;
  }, []);

const handleScrollEndDrag = useCallback(
  (event) => {
    const endOffsetY = event.nativeEvent.contentOffset.y;
    const dragDelta = endOffsetY - dragStartOffsetY.current;
    const velocityY = event.nativeEvent.velocity?.y ?? 0;

    const isFastFlickDown = velocityY > 0.35;
    const isFastFlickUp = velocityY < -0.35;

    const currentIndex = Math.round(dragStartOffsetY.current / height);
    let targetIndex = currentIndex;

    if (dragDelta > FLICK_THRESHOLD || isFastFlickDown) {
      targetIndex = currentIndex + 1;
    } else if (dragDelta < -FLICK_THRESHOLD || isFastFlickUp) {
      targetIndex = currentIndex - 1;
    } else {
      targetIndex = Math.round(endOffsetY / height);
    }

    targetIndex = Math.max(0, Math.min(targetIndex, feedData.length - 1));

    flatListRef.current?.scrollToOffset({
      offset: targetIndex * height,
      animated: true,
    });

    currentIndexRef.current = targetIndex;
    setActiveVideoId(feedData[targetIndex].id);
  },
  [feedData]
);

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const settledIndex = Math.round(offsetY / height);

      if (feedData[settledIndex]) {
        currentIndexRef.current = settledIndex;
        setActiveVideoId(feedData[settledIndex].id);
      }

      setIsScrolling(false);
    },
    [feedData]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <FeedItem
        item={item}
        isActive={item.id === activeVideoId}
        isFeedFocused={isFocused}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onToggleSaved={() => handleToggleSaved(item.id)}
        isScrolling={isScrolling}
      />
    ),
    [activeVideoId, isFocused, isMuted, handleToggleSaved, isScrolling]
  );
  if (feedData.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#050505' }} />;
  }

  return (
    <FlatList
      ref={flatListRef}
      data={feedData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      extraData={`${activeVideoId}-${isMuted}-${isFocused}-${isScrolling}-${feedData
        .map((item) => item.saved)
        .join('-')}`}
      decelerationRate="fast"
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      windowSize={5}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      removeClippedSubviews={false}
      getItemLayout={(_, index) => ({
        length: height,
        offset: height * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    width,
    height,
    backgroundColor: '#050505',
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
    backgroundColor: 'rgba(0,0,0,0.22)',
    zIndex: 1,
    pointerEvents: 'none',
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
    backgroundColor: 'rgba(255,255,255,0.20)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#D4AF37',
  },

  progressThumb: {
    position: 'absolute',
    top: 7,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: '#D4AF37',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
});