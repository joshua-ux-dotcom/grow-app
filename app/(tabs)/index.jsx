// app/(tabs)/index.jsx

import {
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  FlatList,
  View,
  Dimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import FeedItem from '../../components/feed/FeedItem';
import { getActiveVideos } from '../../lib/videos';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const [feedData, setFeedData] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const isFocused = useIsFocused();

  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const dragStartOffsetY = useRef(0);

  const FLICK_THRESHOLD = 28;

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const videos = await getActiveVideos();
        setFeedData(videos);

        if (videos.length > 0) {
          setActiveVideoId(videos[0].id);
        }
      } catch (error) {
        console.log('Fehler beim Laden der Videos:', error);
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
      />
    ),
    [activeVideoId, isFocused, isMuted, handleToggleSaved]
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
      extraData={[feedData]}
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
