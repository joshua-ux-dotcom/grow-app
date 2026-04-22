import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

const PROGRESS_AREA_SIDE = 18;
const PROGRESS_AREA_BOTTOM = 65;
const THUMB_SIZE = 10;

export default function FeedProgressBar({
  safeProgress,
  canScrub,
  thumbLeft,
  onTrackLayout,
  panHandlers,
}) {
  return (
    <View style={styles.progressArea}>
      <View
        style={styles.progressTouchZone}
        onLayout={onTrackLayout}
        {...panHandlers}
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
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.gold,
  },

  progressThumb: {
    position: 'absolute',
    top: 7,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.black,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
});