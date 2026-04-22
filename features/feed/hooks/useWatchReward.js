import { useCallback, useEffect, useRef, useState } from 'react';
import { awardVideoPoints } from '../services/../../gamification/services/growPoints';

const WATCH_THRESHOLD = 0.8;

export function useWatchReward({ isActive, progress, duration, userId, videoId }) {
  const [showPointReward, setShowPointReward] = useState(false);

  const hasAwardedPointsRef = useRef(false);
  const isAwardingPointsRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      hasAwardedPointsRef.current = false;
      isAwardingPointsRef.current = false;
      setShowPointReward(false);
    }
  }, [isActive, videoId]);

  const awardVideoPointIfNeeded = useCallback(async () => {
    if (!userId) return;
    if (hasAwardedPointsRef.current) return;
    if (isAwardingPointsRef.current) return;

    isAwardingPointsRef.current = true;

    try {
      const result = await awardVideoPoints(userId, videoId);

      if (result?.reason === 'already_awarded') {
        hasAwardedPointsRef.current = true;
        return;
      }

      if (result?.awarded) {
        hasAwardedPointsRef.current = true;
        setShowPointReward(true);

        setTimeout(() => {
          setShowPointReward(false);
        }, 2200);
      }
    } catch (error) {
      console.log('Fehler bei Video-Grow-Points:', error);
    } finally {
      isAwardingPointsRef.current = false;
    }
  }, [userId, videoId]);

  useEffect(() => {
    if (!isActive) return;
    if (duration <= 0) return;
    if (hasAwardedPointsRef.current) return;

    if (progress >= WATCH_THRESHOLD) {
      awardVideoPointIfNeeded();
    }
  }, [progress, duration, isActive, awardVideoPointIfNeeded]);

  return {
    showPointReward,
  };
}