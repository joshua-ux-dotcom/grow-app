import {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import FeedItem from '../../features/feed/components/FeedItem';
import {
  getSavedVideos,
  toggleVideoBookmark,
} from '../../features/feed/services/videos';
import { COLORS } from '../../constants/colors';

const { height } = Dimensions.get('window');

export default function SavedFeedScreen() {
  const params = useLocalSearchParams();
  const initialIndex = Number(params.initialIndex ?? 0);

  const [feedData, setFeedData] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [hasNoVideos, setHasNoVideos] = useState(false);

  const isFocused = useIsFocused();

  const flatListRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const dragStartOffsetY = useRef(0);

  const FLICK_THRESHOLD = 28;

  const loadVideos = useCallback(async () => {
    try {
      setFeedError(null);
      setHasNoVideos(false);
      setIsInitialLoading(true);

      const videos = await getSavedVideos();

      if (!videos || videos.length === 0) {
        setFeedData([]);
        setActiveVideoId(null);
        setHasNoVideos(true);
        setIsInitialLoading(false);
        return;
      }

      const safeInitialIndex = Math.max(
        0,
        Math.min(initialIndex, videos.length - 1)
      );

      setFeedData(videos);
      setActiveVideoId(videos[safeInitialIndex].id);
      currentIndexRef.current = safeInitialIndex;

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: safeInitialIndex * height,
          animated: false,
        });
      });
    } catch (error) {
      console.log('Fehler beim Laden gespeicherter Videos:', error);
      setFeedData([]);
      setActiveVideoId(null);
      setFeedError('Gespeicherte Videos konnten nicht geladen werden.');
      setIsInitialLoading(false);
    }
  }, [initialIndex]);

  useFocusEffect(
        useCallback(() => {
            loadVideos();
        }, [loadVideos])
    );

  const handleInitialVideoReady = useCallback(() => {
    setIsInitialLoading(false);
  }, []);

  const handleToggleSaved = useCallback(async (id) => {
    const video = feedData.find((item) => item.id === id);

    if (!video) {
      return;
    }

    try {
      const newSavedState = await toggleVideoBookmark(id, video.saved);

      if (!newSavedState) {
        setFeedData((prevData) => {
          const nextData = prevData.filter((item) => item.id !== id);

          if (nextData.length === 0) {
            setHasNoVideos(true);
            setActiveVideoId(null);
            return [];
          }

          const nextIndex = Math.min(
            currentIndexRef.current,
            nextData.length - 1
          );

          currentIndexRef.current = nextIndex;
          setActiveVideoId(nextData[nextIndex].id);

          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({
              offset: nextIndex * height,
              animated: true,
            });
          });

          return nextData;
        });

        return;
      }

      setFeedData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, saved: newSavedState }
            : item
        )
      );
    } catch (error) {
      console.log('Fehler beim Entfernen des gespeicherten Videos:', error);
    }
  }, [feedData]);

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
          index === currentIndexRef.current
            ? handleInitialVideoReady
            : undefined
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
        <Text style={styles.stateTitle}>Keine gespeicherten Videos</Text>
        <Text style={styles.stateText}>
          Du hast aktuell keine Videos in deiner Sammlung.
        </Text>

        <Pressable style={styles.stateButton} onPress={() => router.back()}>
          <Text style={styles.stateButtonText}>Zurück</Text>
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

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Feather name="chevron-left" size={26} color={COLORS.softGold} />
      </Pressable>

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
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.mutedGold,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  stateButton: {
    marginTop: 22,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stateButtonText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '700',
  },
});