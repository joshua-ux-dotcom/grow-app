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
  StyleSheet,
  Image,
  Text,
  Pressable,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import FeedItem from '../../features/feed/components/FeedItem';
import { getActiveVideos } from '../../features/feed/services/videos'

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const [feedData, setFeedData] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [hasNoVideos, setHasNoVideos] = useState(false);

  const isFocused = useIsFocused();

  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const dragStartOffsetY = useRef(0);

  const FLICK_THRESHOLD = 28;

  const loadVideos = useCallback(async () => {
    try {
      setFeedError(null);
      setHasNoVideos(false);
      setIsInitialLoading(true);
      
      const videos = await getActiveVideos();

      if (!videos || videos.length === 0) {
        setFeedData([])
        setActiveVideoId(null);
        setHasNoVideos(true);
        setIsInitialLoading(false);
        return;
      }

      setFeedData(videos);
      setActiveVideoId(videos[0].id);  
    } catch (error) {
      console.log('Fehler beim Laden der Videos:', error);
      setFeedData([])
      setActiveVideoId(null);
      setFeedError('Videos konnten nicht geladen werden.');
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleInitialVideoReady = useCallback(() => {
    setIsInitialLoading(false);
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

      if (feedData[targetIndex]) {
        setActiveVideoId(feedData[targetIndex].id);
      }
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
    ({ item, index }) => (
      <FeedItem
        item={item}
        isActive={item.id === activeVideoId}
        isFeedFocused={isFocused}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onToggleSaved={() => handleToggleSaved(item.id)}
        onVideoReady={
          index === 0 ? handleInitialVideoReady : undefined
        }
      />
    ),
    [
      activeVideoId,
      isFocused,
      isMuted,
      handleToggleSaved,
      handleInitialVideoReady,
    ]
  );

  if (feedError) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Fehler</Text>
        <Text style={styles.stateText}>{feedError}</Text>

        <Pressable style={styles.stateButton} onPress={loadVideos}>
          <Text style={styles.stateButtonText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  if (hasNoVideos) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Noch keine Videos</Text>
        <Text style={styles.stateText}>
          Aktuell sind keine aktiven Videos verfügbar.
        </Text>

        <Pressable style={styles.stateButton} onPress={loadVideos}>
          <Text style={styles.stateButtonText}>Neu laden</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {feedData.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={feedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={feedData}
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
      )}

      {isInitialLoading && (
        <View style={styles.loadingOverlay}>
          <Image
            source={require('../../assets/images/grow-loading.jpeg')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loadingLogo: {
    width: 180,
    height: 180,
  },

  stateContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  stateTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },

  stateText: {
    color: '#9c8f78',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  stateButton: {
    marginTop: 22,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  stateButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});