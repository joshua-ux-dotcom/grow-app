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

const { height, width } = Dimensions.get('window');

const feedData = [
  {
    id: '1',
    source: require('../../assets/videos/Id1.mp4'),
  },
  {
    id: '2',
    source: require('../../assets/videos/Id2.mp4'),
  },
  {
    id: '3',
    source: require('../../assets/videos/Id3.mp4'),
  },
  {
    id: '4',
    source: require('../../assets/videos/Id4.mp4'),
  },
];

function FeedItem({ item, isActive, isFeedFocused, isMuted, setIsMuted }) {
  const [isHolding, setIsHolding] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const player = useVideoPlayer(item.source, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    const shouldPlay =
      isActive && isFeedFocused && !isHolding && !isScrubbing;

    if (!isActive) {
      player.pause();
      player.currentTime = 0;
      setProgress(0);
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
  }, [isActive, isFeedFocused, isHolding, isScrubbing, player]);

  useEffect(() => {
    let intervalId;

    if (isActive && isFeedFocused && !isScrubbing) {
      intervalId = setInterval(() => {
        const current = player.currentTime ?? 0;
        const total = player.duration ?? 0;

        setDuration(total);

        if (total > 0) {
          setProgress(current / total);
        } else {
          setProgress(0);
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, isFeedFocused, isScrubbing, player]);

  const updateSeekFromX = useCallback(
    (x) => {
      if (!duration || !trackWidth) return;

      const clampedX = Math.max(0, Math.min(x, trackWidth));
      const ratio = clampedX / trackWidth;
      const newTime = ratio * duration;

      player.currentTime = newTime;
      setProgress(ratio);
    },
    [duration, trackWidth, player]
  );

  const progressPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

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
    [updateSeekFromX]
  );

  const thumbLeft = Math.max(0, progress * trackWidth - 7);

  return (
    <View style={styles.page}>
      <VideoView
        key={item.id}
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      <Pressable
        style={styles.touchLayer}
        onPress={() => {
          setIsMuted((prev) => !prev);
        }}
        onLongPress={() => {
          setIsHolding(true);
        }}
        delayLongPress={180}
        onPressOut={() => {
          if (isHolding) {
            setIsHolding(false);
          }
        }}
      />

      <View style={styles.overlayDark} />
      <VideoOverlay />

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
                { width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>

          <View
            style={[
              styles.progressThumb,
              { left: thumbLeft },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [activeVideoId, setActiveVideoId] = useState(feedData[0].id);
  const [isMuted, setIsMuted] = useState(false);
  const isFocused = useIsFocused();

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoId(viewableItems[0].item.id);
    }
  }).current;

  const renderItem = useCallback(
    ({ item }) => (
      <FeedItem
        item={item}
        isActive={item.id === activeVideoId}
        isFeedFocused={isFocused}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />
    ),
    [activeVideoId, isFocused, isMuted]
  );

  return (
    <FlatList
      data={feedData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      extraData={{ activeVideoId, isMuted, isFocused }}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      disableIntervalMomentum
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      windowSize={3}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      removeClippedSubviews={false}
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
  },

  progressArea: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 65,
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
    width: 10,
    height: 10,
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