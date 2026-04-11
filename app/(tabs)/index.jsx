// app/(tabs)/index.jsx

import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
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

function FeedItem({ item, isActive }) {
  const [isPaused, setIsPaused] = useState(false);

  const player = useVideoPlayer(item.source, (player) => {
    player.loop = true;
  });

  const handlePress = () => {
    if (!isActive) return;

    if (isPaused) {
      player.play();
      setIsPaused(false);
    } else {
      player.pause();
      setIsPaused(true);
    }
  };

  if (isActive && !isPaused) {
    player.play();
  } else {
    player.pause();
  }

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.page}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        <View style={styles.overlayDark} />
        <VideoOverlay />
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function FeedScreen() {
  const [activeVideoId, setActiveVideoId] = useState(feedData[0].id);

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
      <FeedItem item={item} isActive={item.id === activeVideoId} />
    ),
    [activeVideoId]
  );

  return (
    <FlatList
      data={feedData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
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