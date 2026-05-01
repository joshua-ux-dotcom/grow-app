import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import { upsertSteps } from '../services/steps';

export function useSteps() {
  const [steps, setSteps] = useState(0);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSteps() {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable || !mounted) return;

        await Pedometer.requestPermissionsAsync();

        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);

        const { steps: count } = await Pedometer.getStepCountAsync(midnight, now);
        if (!mounted) return;

        setSteps(count);

        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          upsertSteps(count).catch(() => {});
        }, 3000);
      } catch {}
    }

    fetchSteps();
    const interval = setInterval(fetchSteps, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return steps;
}