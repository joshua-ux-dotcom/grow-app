import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
  { label: '90 min', seconds: 90 * 60 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DeepWorkScreen() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const total = PRESETS[selectedPreset].seconds;
  const progress = 1 - timeLeft / total;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handlePreset = useCallback((index) => {
    if (running) return;
    setSelectedPreset(index);
    setTimeLeft(PRESETS[index].seconds);
    setFinished(false);
    setError(null);
  }, [running]);

  const handleStartPause = useCallback(() => {
    if (finished) return;
    try {
      setError(null);
      setRunning(prev => !prev);
    } catch (e) {
      setError('Timer konnte nicht gestartet werden.');
    }
  }, [finished]);

  const handleReset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setTimeLeft(PRESETS[selectedPreset].seconds);
    setError(null);
  }, [selectedPreset]);

  return (
    <View style={styles.screen}>

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="timer-outline" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>DEEP WORK</Text>
          <Text style={styles.subtitle}>Focus deeply. Achieve more.</Text>
        </View>

        {/* Fehlerzustand */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={s(18)} color={styles.errorIcon.color} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setError(null)} hitSlop={s(8)}>
              <Ionicons name="close" size={s(16)} color={COLORS.textDim} />
            </Pressable>
          </View>
        )}

        {/* Preset-Auswahl */}
        <View style={styles.presetRow}>
          {PRESETS.map((p, index) => (
            <Pressable
              key={p.label}
              style={[
                styles.presetBtn,
                selectedPreset === index && styles.presetBtnActive,
                running && styles.presetBtnDisabled,
              ]}
              onPress={() => handlePreset(index)}
              disabled={running}
            >
              <Text style={[styles.presetText, selectedPreset === index && styles.presetTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerCard}>
          {/* Ring-Fortschritt (einfacher Balken als Arc-Ersatz) */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <Text style={[styles.timerDisplay, finished && styles.timerDisplayDone]}>
            {formatTime(timeLeft)}
          </Text>

          {finished && (
            <View style={styles.finishedRow}>
              <Ionicons name="checkmark-circle" size={s(20)} color="#2ECC71" />
              <Text style={styles.finishedText}>Session abgeschlossen!</Text>
            </View>
          )}
        </View>

        {/* Steuerung */}
        <View style={styles.controls}>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={s(22)} color={COLORS.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.startBtn, finished && styles.startBtnDisabled]}
            onPress={handleStartPause}
            disabled={finished}
          >
            <Ionicons
              name={running ? 'pause' : 'play'}
              size={s(28)}
              color={COLORS.black}
            />
          </Pressable>

          {/* Platzhalter für symmetrisches Layout */}
          <View style={styles.resetBtn} />
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    position: 'absolute',
    top: sv(54),
    left: s(16),
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  backText: {
    color: COLORS.softGold,
    fontSize: sf(16),
    fontWeight: '600',
  },
  content: {
    paddingTop: sv(110),
    paddingHorizontal: s(20),
    paddingBottom: sv(120),
  },
  header: {
    alignItems: 'center',
    marginBottom: sv(28),
  },
  iconCircle: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sv(16),
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  title: {
    color: COLORS.paleGold,
    fontSize: sf(28),
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    backgroundColor: 'rgba(180,30,30,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.35)',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: sv(12),
    marginBottom: sv(16),
  },
  errorIcon: {
    color: '#E05555',
  },
  errorText: {
    color: '#E05555',
    fontSize: sf(13),
    fontWeight: '500',
    flex: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: sv(28),
  },
  presetBtn: {
    flex: 1,
    height: sv(38),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard,
  },
  presetBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  presetBtnDisabled: {
    opacity: 0.4,
  },
  presetText: {
    color: COLORS.textDim,
    fontSize: sf(11),
    fontWeight: '700',
  },
  presetTextActive: {
    color: COLORS.black,
  },
  timerCard: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    borderRadius: s(20),
    paddingHorizontal: s(24),
    paddingTop: sv(20),
    paddingBottom: sv(28),
    alignItems: 'center',
    marginBottom: sv(32),
    gap: sv(16),
  },
  progressTrack: {
    width: '100%',
    height: sv(6),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 999,
  },
  timerDisplay: {
    color: COLORS.paleGold,
    fontSize: sf(72),
    fontWeight: '800',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  timerDisplayDone: {
    color: '#2ECC71',
  },
  finishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  finishedText: {
    color: '#2ECC71',
    fontSize: sf(15),
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(32),
  },
  resetBtn: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnDisabled: {
    opacity: 0.35,
  },
});