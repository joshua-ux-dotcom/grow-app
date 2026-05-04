import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import {
  saveDeepWorkSession,
  clearDeepWorkSession,
  getSavedDeepWorkSession,
} from '../services/deepWorkStore';

import {
  DEFAULT_SESSION_MINUTES,
  EXAMPLE_CATEGORIES,
} from '../utils/deepWorkUtils';

export function useDeepWorkSession() {
  const [phase, setPhase] = useState('idle');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(60);
  const [remaining, setRemaining] = useState(0);

  const [setupVisible, setSetupVisible] = useState(false);
  const [inputTask, setInputTask] = useState('');
  const [selHours, setSelHours] = useState(0);
  const [selMinutes, setSelMinutes] = useState(DEFAULT_SESSION_MINUTES);
  const [selCategory, setSelCategory] = useState(EXAMPLE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');

  const [doneVisible, setDoneVisible] = useState(false);

  const intervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const restoreSession = async () => {
      const saved = await getSavedDeepWorkSession();

      if (!saved) return;

      setPhase(saved.phase || 'paused');
      setRemaining(saved.remaining || 0);
      setTotalMinutes(Math.ceil((saved.totalSeconds || saved.remaining || 0) / 60));
      setTaskName(saved.taskName || 'Deep Work');
      setCategory(saved.category || 'Fokus');
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (phase === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase, pulseAnim]);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            clearDeepWorkSession();
            setPhase('idle');
            setDoneVisible(true);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [phase]);

  const startSession = useCallback(async () => {
    const mins = selHours * 60 + selMinutes;
    const cat = customCategory.trim() || selCategory;
    const seconds = mins * 60;

    setTaskName(inputTask.trim() || 'Deep Work');
    setCategory(cat);
    setTotalMinutes(mins);
    setRemaining(seconds);
    setSetupVisible(false);
    setPhase('running');

    await saveDeepWorkSession({
      phase: 'running',
      remaining: seconds,
      totalSeconds: seconds,
      taskName: inputTask.trim() || 'Deep Work',
      category: cat,
      updatedAt: Date.now(),
    });
  }, [inputTask, selHours, selMinutes, selCategory, customCategory]);

  const togglePause = useCallback(() => {
    setPhase(prev => {
      const nextPhase = prev === 'running' ? 'paused' : 'running';

      saveDeepWorkSession({
        phase: nextPhase,
        remaining,
        totalSeconds: totalMinutes * 60,
        taskName,
        category,
        updatedAt: Date.now(),
      });

      return nextPhase;
    });
  }, [remaining, totalMinutes]);

  const endSession = useCallback(async () => {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setRemaining(0);
    await clearDeepWorkSession();
  }, []);

  const openSetup = useCallback(() => {
    setInputTask('');
    setSelHours(0);
    setSelMinutes(DEFAULT_SESSION_MINUTES);
    setSelCategory(EXAMPLE_CATEGORIES[0]);
    setCustomCategory('');
    setSetupVisible(true);
  }, []);

  const closeSetup = useCallback(() => {
    setSetupVisible(false);
  }, []);

  const closeDone = useCallback(() => {
    setDoneVisible(false);
  }, []);

  const progress = totalMinutes > 0
    ? 1 - remaining / (totalMinutes * 60)
    : 0;

  const canStart = selHours > 0 || selMinutes > 0;

  return {
    phase,
    taskName,
    category,
    totalMinutes,
    remaining,
    progress,
    canStart,
    pulseAnim,

    setupVisible,
    inputTask,
    selHours,
    selMinutes,
    selCategory,
    customCategory,

    doneVisible,

    setInputTask,
    setSelHours,
    setSelMinutes,
    setSelCategory,
    setCustomCategory,

    startSession,
    togglePause,
    endSession,
    openSetup,
    closeSetup,
    closeDone,
  };
}