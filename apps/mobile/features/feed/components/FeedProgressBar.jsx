import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { SCREEN, sv } from '../../../constants/layout';

const TOUCH_ZONE_HEIGHT = 128;
const TOUCH_ZONE_BELOW_LINE = 28;
const ACTIVE_TRACK_HEIGHT = 5;

function getVisibleTabBarHeight(screenHeight) {
  return Math.round(Math.min(44, Math.max(34, screenHeight * 0.045)));
}

const ANDROID_PROGRESS_BASE_LIFT = 7.5;
const ANDROID_TALL_DEVICE_START_HEIGHT = 860;
const ANDROID_TALL_DEVICE_RANGE = 180;
const ANDROID_TALL_DEVICE_MAX_EXTRA_LIFT = 6.5;

// Kleine Extra-Korrektur für mittelhohe Android-Geräte wie Pixel 6.
// Pixel 5 bleibt darunter, Pixel 9 Pro XL liegt darüber und wird dadurch nicht verändert.
const ANDROID_MID_DEVICE_START_HEIGHT = 880;
const ANDROID_MID_DEVICE_PEAK_HEIGHT = 920;
const ANDROID_MID_DEVICE_END_HEIGHT = 960;
const ANDROID_MID_DEVICE_EXTRA_LIFT = 1;

function getAndroidMidDeviceLift(screenHeight) {
  if (screenHeight <= ANDROID_MID_DEVICE_START_HEIGHT) return 0;
  if (screenHeight >= ANDROID_MID_DEVICE_END_HEIGHT) return 0;

  if (screenHeight <= ANDROID_MID_DEVICE_PEAK_HEIGHT) {
    const progress =
      (screenHeight - ANDROID_MID_DEVICE_START_HEIGHT) /
      (ANDROID_MID_DEVICE_PEAK_HEIGHT - ANDROID_MID_DEVICE_START_HEIGHT);

    return progress * ANDROID_MID_DEVICE_EXTRA_LIFT;
  }

  const progress =
    (ANDROID_MID_DEVICE_END_HEIGHT - screenHeight) /
    (ANDROID_MID_DEVICE_END_HEIGHT - ANDROID_MID_DEVICE_PEAK_HEIGHT);

  return progress * ANDROID_MID_DEVICE_EXTRA_LIFT;
}

function getAndroidProgressLift(screenHeight) {
  if (!SCREEN.isAndroid) return 0;

  const tallDeviceProgress = Math.min(
    1,
    Math.max(
      0,
      (screenHeight - ANDROID_TALL_DEVICE_START_HEIGHT) / ANDROID_TALL_DEVICE_RANGE
    )
  );

  return (
    sv(ANDROID_PROGRESS_BASE_LIFT) +
    tallDeviceProgress * ANDROID_TALL_DEVICE_MAX_EXTRA_LIFT +
    getAndroidMidDeviceLift(screenHeight)
  );
}

export default function FeedProgressBar({
  safeProgress,
  onTrackLayout,
  panHandlers,
  isScrubbing = false,
  currentTimeText = '0:00',
  durationText = '0:00',
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const visibleTabBarHeight = getVisibleTabBarHeight(height);
  const progressLineGapAboveTab = 0;
  const androidProgressLift = getAndroidProgressLift(height);

  const progressLineBottom =
    insets.bottom +
    visibleTabBarHeight +
    progressLineGapAboveTab +
    androidProgressLift;

  const bottomOffset = progressLineBottom - TOUCH_ZONE_BELOW_LINE;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      {isScrubbing && (
        <View
          pointerEvents="none"
          style={[
            styles.timeContainer,
            { bottom: bottomOffset + TOUCH_ZONE_BELOW_LINE + ACTIVE_TRACK_HEIGHT + 50 },
          ]}
        >
          <Text style={styles.timeText}>
            {currentTimeText} / {durationText}
          </Text>
        </View>
      )}

      <View
        style={[styles.progressArea, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <View
          style={styles.progressTouchZone}
          onLayout={onTrackLayout}
          {...panHandlers}
        >
          <View
            style={[
              styles.progressTrack,
              isScrubbing && styles.progressTrackActive,
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${safeProgress * 100}%` },
                isScrubbing && styles.progressFillActive,
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
  },

  progressTouchZone: {
    height: TOUCH_ZONE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: TOUCH_ZONE_BELOW_LINE,
  },

  progressTrack: {
    width: '100%',
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },

  progressTrackActive: {
    height: ACTIVE_TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  progressFillActive: {
    backgroundColor: COLORS.white,
  },

  timeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 45,
  },

  timeText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 5,
  },
});
