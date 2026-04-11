// app/(tabs)/index.jsx

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  Pressable,
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

function FeedItem({ item, isActive, isFeedFocused }) {
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const holdTimeout = useRef(null);

  const player = useVideoPlayer(item.source, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    const shouldPlay = isActive && isFeedFocused && !isHolding;

    player.muted = isMuted;

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isFeedFocused, isHolding, isMuted, player]);

  return (
    <Pressable
      style={styles.page}
      onPressIn={() => {
        holdTimeout.current = setTimeout(() => {
          setIsHolding(true);
        }, 180);
      }}
      onPressOut={() => {
        clearTimeout(holdTimeout.current);

        if (isHolding) {
          setIsHolding(false);
        } else {
          setIsMuted((prev) => !prev);
        }
      }}
    >
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlayDark} />
      <VideoOverlay />
    </Pressable>
  );
}

export default function FeedScreen() {
  const [activeVideoId, setActiveVideoId] = useState(feedData[0].id);
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
      />
    ),
    [activeVideoId, isFocused]
  );

  return (
    <FlatList
      data={feedData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
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
      removeClippedSubviews
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

  overlayDark: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
});