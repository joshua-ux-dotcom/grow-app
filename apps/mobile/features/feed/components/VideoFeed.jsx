import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { s, sv, sf } from "../../../constants/layout";
import FeedItem from "./FeedItem";
import { getSavedVideoIds, toggleVideoBookmark } from "../services/videos";
import { getCurrentUserId } from "../../../services/authUser";
import { logger } from "../../../lib/logger";

const GROW_LOGO_HEADER = require("../../../assets/images/grow_banner_lossless.webp");
const { height } = Dimensions.get("window");
const VIDEO_READY_TIMEOUT_MS = 6500;

export default function VideoFeed({
  loadVideos,
  initialIndex = 0,
  emptyTitle = "Noch keine Videos",
  emptyText = "Aktuell sind keine Videos verfügbar.",
  errorMessage = "Videos konnten nicht geladen werden.",
  reloadButtonText = "Erneut versuchen",
  showBackButton = false,
  backRoute = null,
  reloadOnFocus = false,
  syncSavedStateOnFocus = false,
  removeUnsavedVideos = false,
  isDisabled = false,
}) {
  const [feedData, setFeedData] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [listInitialIndex, setListInitialIndex] = useState(initialIndex);
  const [feedInstanceKey, setFeedInstanceKey] = useState(0);
  const [feedError, setFeedError] = useState(null);
  const [hasNoVideos, setHasNoVideos] = useState(false);
  const [isFeedScrollEnabled, setIsFeedScrollEnabled] = useState(true);

  const isFocused = useIsFocused();
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const isFeedScrollEnabledRef = useRef(true);
  const isFirstFocus = useRef(true);
  const videoReadyFallbackTimerRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const bookmarkRequestRef = useRef(new Set());
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 60,
  });
  const [isAppActive, setIsAppActive] = useState(true);

  const clearVideoReadyFallbackTimer = useCallback(() => {
    if (videoReadyFallbackTimerRef.current) {
      clearTimeout(videoReadyFallbackTimerRef.current);
      videoReadyFallbackTimerRef.current = null;
    }
  }, []);

  const clearScrollFrame = useCallback(() => {
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const setFeedScrollEnabledSafely = useCallback((nextValue) => {
    isFeedScrollEnabledRef.current = nextValue;
    setIsFeedScrollEnabled(nextValue);
  }, []);

  const disableFeedScroll = useCallback(() => {
    setFeedScrollEnabledSafely(false);
  }, [setFeedScrollEnabledSafely]);

  const enableFeedScroll = useCallback(() => {
    setFeedScrollEnabledSafely(true);
  }, [setFeedScrollEnabledSafely]);

  const scrollToIndex = useCallback(
    (index, animated = false) => {
      clearScrollFrame();

      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;

        if (!isMountedRef.current) {
          return;
        }

        flatListRef.current?.scrollToOffset({
          offset: index * height,
          animated,
        });
      });
    },
    [clearScrollFrame],
  );

  const startVideoReadyFallbackTimer = useCallback(() => {
    clearVideoReadyFallbackTimer();

    videoReadyFallbackTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      setIsInitialLoading(false);
      videoReadyFallbackTimerRef.current = null;
    }, VIDEO_READY_TIMEOUT_MS);
  }, [clearVideoReadyFallbackTimer]);

  useEffect(() => {
    isMountedRef.current = true;

    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsAppActive(nextState === "active");
    });

    return () => {
      isMountedRef.current = false;
      loadRequestIdRef.current += 1;
      clearVideoReadyFallbackTimer();
      clearScrollFrame();
      subscription.remove();
    };
  }, [clearScrollFrame, clearVideoReadyFallbackTimer]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedUserId() {
      try {
        const nextUserId = await getCurrentUserId();

        if (!cancelled && isMountedRef.current) {
          setUserId(nextUserId);
        }
      } catch (error) {
        logger.warn("Fehler beim Laden des Feed-Users:", error);

        if (!cancelled && isMountedRef.current) {
          setUserId(null);
        }
      }
    }

    loadFeedUserId();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadFeedVideos = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    const isCurrentRequest = () =>
      isMountedRef.current && loadRequestIdRef.current === requestId;

    try {
      clearVideoReadyFallbackTimer();
      clearScrollFrame();

      setFeedError(null);
      setHasNoVideos(false);
      setIsInitialLoading(true);

      const videos = await loadVideos();

      if (!isCurrentRequest()) {
        return;
      }

      const validVideos = Array.isArray(videos)
        ? videos.filter((video) => video?.id && video?.source)
        : [];

      if (validVideos.length === 0) {
        setFeedData([]);
        setActiveVideoId(null);
        setListInitialIndex(0);
        setHasNoVideos(true);
        setIsInitialLoading(false);
        return;
      }

      const safeInitialIndex = Math.max(
        0,
        Math.min(initialIndex, validVideos.length - 1),
      );

      setFeedData(validVideos);
      setListInitialIndex(safeInitialIndex);
      setFeedInstanceKey((currentKey) => currentKey + 1);
      setActiveVideoId(validVideos[safeInitialIndex].id);
      currentIndexRef.current = safeInitialIndex;

      startVideoReadyFallbackTimer();

      scrollToIndex(safeInitialIndex, false);
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }

      logger.error("Fehler beim Laden des Feeds:", error);
      clearVideoReadyFallbackTimer();
      setFeedData([]);
      setActiveVideoId(null);
      setListInitialIndex(0);
      setFeedError(errorMessage);
      setIsInitialLoading(false);
    }
  }, [
    errorMessage,
    initialIndex,
    loadVideos,
    clearVideoReadyFallbackTimer,
    clearScrollFrame,
    scrollToIndex,
    startVideoReadyFallbackTimer,
  ]);

  useEffect(() => {
    if (!reloadOnFocus) {
      loadFeedVideos();
    }
  }, [loadFeedVideos, reloadOnFocus]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;

        if (reloadOnFocus) {
          loadFeedVideos();
        }

        return;
      }

      if (reloadOnFocus) {
        loadFeedVideos();
        return;
      }

      if (!syncSavedStateOnFocus) {
        return;
      }

      let isActive = true;

      async function syncSavedState() {
        try {
          const savedIds = await getSavedVideoIds();

          if (!isActive || !isMountedRef.current) {
            return;
          }

          setFeedData((prevData) =>
            prevData.map((video) => ({
              ...video,
              saved: savedIds.includes(video.id),
            })),
          );
        } catch (error) {
          logger.warn("Fehler beim Sync der Bookmarks:", error);
        }
      }

      syncSavedState();

      return () => {
        isActive = false;
      };
    }, [loadFeedVideos, reloadOnFocus, syncSavedStateOnFocus]),
  );

  const handleInitialVideoReady = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    clearVideoReadyFallbackTimer();
    setIsInitialLoading(false);
  }, [clearVideoReadyFallbackTimer]);

  const handleBackPress = useCallback(() => {
    setActiveVideoId(null);
    setIsInitialLoading(false);

    if (backRoute) {
      router.replace({ pathname: backRoute });
      return;
    }

    router.back();
  }, [backRoute]);

  const handleToggleSaved = useCallback(
    async (id) => {
      if (bookmarkRequestRef.current.has(id)) {
        return;
      }

      const video = feedData.find((item) => item.id === id);

      if (!video) {
        return;
      }

      const previousSavedState = video.saved;
      const optimisticSavedState = !previousSavedState;

      bookmarkRequestRef.current.add(id);

      // Sofortiges visuelles Feedback: Das Bookmark wird direkt umgeschaltet,
      // während die Supabase-Anfrage im Hintergrund läuft.
      setFeedData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, saved: optimisticSavedState } : item,
        ),
      );

      try {
        const newSavedState = await toggleVideoBookmark(id, previousSavedState);

        if (!isMountedRef.current) {
          return;
        }

        if (removeUnsavedVideos && !newSavedState) {
          setFeedData((prevData) => {
            const nextData = prevData.filter((item) => item.id !== id);

            if (nextData.length === 0) {
              setHasNoVideos(true);
              setActiveVideoId(null);
              return [];
            }

            const nextIndex = Math.min(
              currentIndexRef.current,
              nextData.length - 1,
            );

            currentIndexRef.current = nextIndex;
            setActiveVideoId(nextData[nextIndex].id);

            scrollToIndex(nextIndex, true);

            return nextData;
          });

          return;
        }

        setFeedData((prevData) =>
          prevData.map((item) =>
            item.id === id ? { ...item, saved: newSavedState } : item,
          ),
        );
      } catch (error) {
        logger.error("Fehler beim Speichern des Videos:", error);

        if (isMountedRef.current) {
          setFeedData((prevData) =>
            prevData.map((item) =>
              item.id === id ? { ...item, saved: previousSavedState } : item,
            ),
          );
        }
      } finally {
        bookmarkRequestRef.current.delete(id);
      }
    },
    [feedData, removeUnsavedVideos, scrollToIndex],
  );

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!isMountedRef.current || !Array.isArray(viewableItems)) {
      return;
    }

    const nextViewableItem = viewableItems.find(
      (viewableItem) =>
        viewableItem?.isViewable &&
        viewableItem?.item?.id &&
        Number.isInteger(viewableItem.index),
    );

    if (!nextViewableItem || nextViewableItem.index === currentIndexRef.current) {
      return;
    }

    currentIndexRef.current = nextViewableItem.index;
    setActiveVideoId(nextViewableItem.item.id);
  }).current;

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const settledIndex = Math.max(
        0,
        Math.min(Math.round(offsetY / height), feedData.length - 1),
      );
      const settledVideo = feedData[settledIndex];

      if (!settledVideo || settledIndex === currentIndexRef.current) {
        return;
      }

      currentIndexRef.current = settledIndex;
      setActiveVideoId(settledVideo.id);
    },
    [feedData],
  );

  const handleScrollToIndexFailed = useCallback((info) => {
    const safeIndex = Math.max(0, Math.min(info.index ?? 0, feedData.length - 1));

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: safeIndex * height,
        animated: false,
      });
    });
  }, [feedData.length]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <FeedItem
        item={item}
        userId={userId}
        isActive={item.id === activeVideoId}
        isFeedFocused={isFocused && isAppActive && !isDisabled}
        isInteractionDisabled={isDisabled}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onToggleSaved={() => handleToggleSaved(item.id)}
        onScrubStart={disableFeedScroll}
        onScrubEnd={enableFeedScroll}
        onRatingDragStart={disableFeedScroll}
        onRatingDragEnd={enableFeedScroll}
        onVideoReady={
          index === currentIndexRef.current
            ? handleInitialVideoReady
            : undefined
        }
      />
    ),
    [
      activeVideoId,
      disableFeedScroll,
      enableFeedScroll,
      handleInitialVideoReady,
      handleToggleSaved,
      isAppActive,
      isDisabled,
      isFocused,
      isMuted,
      userId,
    ],
  );

  const feedExtraData = useMemo(
    () => ({
      activeVideoId,
      isAppActive,
      isDisabled,
      isFeedScrollEnabled,
      isFocused,
      isMuted,
      listInitialIndex,
      feedInstanceKey,
      userId,
    }),
    [
      activeVideoId,
      isAppActive,
      isDisabled,
      isFeedScrollEnabled,
      isFocused,
      isMuted,
      listInitialIndex,
      feedInstanceKey,
      userId,
    ],
  );

  if (feedError) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Fehler</Text>
        <Text style={styles.stateText}>{feedError}</Text>

        <Pressable style={styles.stateButton} onPress={loadFeedVideos}>
          <Text style={styles.stateButtonText}>{reloadButtonText}</Text>
        </Pressable>
      </View>
    );
  }

  if (hasNoVideos) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>{emptyTitle}</Text>
        <Text style={styles.stateText}>{emptyText}</Text>

        <Pressable
          style={styles.stateButton}
          onPress={showBackButton ? handleBackPress : loadFeedVideos}
        >
          <Text style={styles.stateButtonText}>
            {showBackButton ? "Zurück" : "Neu laden"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {feedData.length > 0 && (
        <FlatList
          key={`feed-${feedInstanceKey}-${listInitialIndex}`}
          ref={flatListRef}
          data={feedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={feedExtraData}
          scrollEnabled={!isDisabled && isFeedScrollEnabled}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfigRef.current}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialScrollIndex={listInitialIndex}
          scrollEventThrottle={16}
          windowSize={5}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={20}
          removeClippedSubviews={false}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
        />
      )}

      <Image
        source={GROW_LOGO_HEADER}
        style={styles.logoImage}
        resizeMode="contain"
        pointerEvents="none"
      />

      {showBackButton && (
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Feather name="chevron-left" size={26} color={COLORS.softGold} />
        </Pressable>
      )}

      {isInitialLoading && (
        <View style={styles.loadingOverlay}>
          <Image
            source={require("../../../assets/images/grow-loading.png")}
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
  logoImage: {
    position: "absolute",
    top: sv(61),
    alignSelf: "center",
    width: s(185),
    height: sv(42),
    zIndex: 10,
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingLogo: {
    width: 180,
    height: 180,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: sf(24),
    fontWeight: "700",
    marginBottom: sv(12),
    textAlign: "center",
  },
  stateText: {
    color: COLORS.mutedGold,
    fontSize: sf(15),
    textAlign: "center",
    lineHeight: 22,
  },
  stateButton: {
    marginTop: 22,
    backgroundColor: COLORS.gold,
    paddingHorizontal: s(20),
    paddingVertical: sv(12),
    borderRadius: s(12),
  },
  stateButtonText: {
    color: COLORS.black,
    fontSize: sf(15),
    fontWeight: "700",
  },
});
