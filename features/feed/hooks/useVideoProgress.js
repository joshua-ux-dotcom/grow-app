import { useCallback, useEffect, useMemo, useState } from 'react';
import { PanResponder } from 'react-native';

const PROGRESS_UPDATE_INTERVAL = 150;
const THUMB_SIZE = 10;

export function useVideoProgress({
  player,
  isActive,
  isFeedFocused,
  isScrubbing,
  setIsScrubbing,
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

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
    [canScrub, updateSeekFromX, setIsScrubbing]
  );

  const safeProgress = Math.max(0, Math.min(progress, 1));

  const thumbLeft = Math.max(
    0,
    Math.min(
      safeProgress * trackWidth - THUMB_SIZE / 2,
      Math.max(trackWidth - THUMB_SIZE, 0)
    )
  );

  return {
    progress,
    duration,
    canScrub,
    safeProgress,
    thumbLeft,
    setTrackWidth,
    panHandlers: progressPanResponder.panHandlers,
    setProgress,
  };
}