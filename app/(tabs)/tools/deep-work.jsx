import {
  View, Text, StyleSheet, Pressable, Modal,
  TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform,
  BackHandler,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { s, sv, sf } from '../../../constants/layout';
import {
  HOURS,
  MINUTES,
  EXAMPLE_CATEGORIES,
  DEFAULT_SESSION_MINUTES,
  formatTime,
} from '../../../features/deep-work/utils/deepWorkUtils';
import { PickerColumn } from '../../../features/deep-work/components/PickerColumn';
import { DeepWorkDoneModal } from '../../../features/deep-work/components/DeepWorkDoneModal';
import { useDeepWorkSession } from '../../../features/deep-work/hooks/useDeepWorkSession';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

export default function DeepWorkScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
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
  } = useDeepWorkSession();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (phase === 'running') {
          return true; // blockiert zurück
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [phase])
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();

      if (!parent) return;

      const unsubscribe = parent.addListener('tabPress', (e) => {
        if (phase === 'running') {
          e.preventDefault();
        }
      });

      return unsubscribe;
    }, [navigation, phase])
  );

  // ─── Idle-Ansicht ──────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: true }} />
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <Pressable 
              onPress={() => {
                if (phase !== 'running') {
                  router.back();
                }
              }} 
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
              <Text style={styles.backText}>Tools</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.idleContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="hourglass-outline" size={s(36)} color={COLORS.gold} />
              </View>
              <Text style={styles.title}>DEEP WORK</Text>
              <Text style={styles.subtitle}>Disziplin. Fokus. Keine Ablenkung.</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={s(18)} color={COLORS.gold} />
              <Text style={styles.infoText}>
                Starte eine fokussierte Arbeitseinheit ohne Unterbrechungen.
              </Text>
            </View>

            <Pressable style={styles.startButton} onPress={openSetup}>
              <Ionicons name="play" size={s(20)} color={COLORS.black} />
              <Text style={styles.startButtonText}>Session starten</Text>
            </Pressable>
          </ScrollView>

          {/* ── Setup-Modal ───────────────────────────────────────────────── */}
          <Modal
            visible={setupVisible}
            transparent
            animationType="slide"
            onRequestClose={closeSetup}
          >
            <KeyboardAvoidingView
              style={styles.modalRoot}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSetup} />

              <View style={styles.sheet}>
                <ScrollView
                  contentContainerStyle={styles.sheetScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >    
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle}>Neue Session</Text>

                  {/* Aufgabe */}
                  <Text style={styles.label}>AUFGABE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Was willst du erreichen?"
                    placeholderTextColor={COLORS.textDim}
                    value={inputTask}
                    onChangeText={setInputTask}
                    returnKeyType="done"
                  />

                  {/* Dauer — Drum-Roll Picker */}
                  <Text style={styles.label}>DAUER</Text>
                  <View style={styles.pickerContainer}>
                    <PickerColumn
                      data={HOURS}
                      initialIndex={0}
                      onChange={setSelHours}
                    />
                    <Text style={styles.pickerSeparator}>h</Text>
                    <PickerColumn
                      data={MINUTES}
                      initialIndex={DEFAULT_SESSION_MINUTES}
                      onChange={setSelMinutes}
                    />
                    <Text style={styles.pickerSeparator}>min</Text>
                  </View>

                  {/* Kategorie */}
                  <Text style={styles.label}>KATEGORIE</Text>
                  <View style={styles.chipRow}>
                    {EXAMPLE_CATEGORIES.map(cat => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.chip,
                          selCategory === cat && !customCategory && styles.chipActive,
                        ]}
                        onPress={() => {
                          setSelCategory(cat);
                          setCustomCategory('');
                        }}
                      >
                        <Text style={[
                          styles.chipText,
                          selCategory === cat && !customCategory && styles.chipTextActive,
                        ]}>
                          {cat.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Eigene Kategorie (optional)"
                    placeholderTextColor={COLORS.textDim}
                    value={customCategory}
                    onChangeText={text => {
                      setCustomCategory(text);
                      if (text) setSelCategory('');
                    }}
                    returnKeyType="done"
                  />

                  {/* Buttons */}
                  <View style={styles.modalButtons}>
                    <Pressable style={styles.cancelBtn} onPress={closeSetup}>
                      <Text style={styles.cancelBtnText}>Abbrechen</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.confirmBtn, !canStart && styles.confirmBtnDisabled]}
                      onPress={startSession}
                      disabled={!canStart}
                    >
                      <Text style={styles.confirmBtnText}>Starten</Text>
                    </Pressable>
                  </View>
                </ScrollView>  
              </View>
            </KeyboardAvoidingView>            
          </Modal>

          {/* ── Fertig-Modal ───────────────────────────────────────────────── */}
          <DeepWorkDoneModal
            visible={doneVisible}
            onClose={closeDone}
            totalMinutes={totalMinutes}
          />
        </View>
      </>  
    );
  }

  // ─── Aktive Session ────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: phase !== 'running' }} />
      <View style={styles.screen}>
        <Pressable
          onPress={() => {
            if (phase !== 'running') {
              router.back();
            }
          }}
          style={[
            styles.sessionBackButton,
            phase === 'running' && styles.sessionBackButtonHidden,
          ]}
          disabled={phase === 'running'}
        >  
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
        <View style={styles.sessionHeader}>
          <Ionicons name="hourglass" size={s(42)} color={COLORS.gold} />
          <Text style={styles.title}>DEEP WORK</Text>
          <Text style={styles.subtitle}>Disziplin. Fokus. Keine Ablenkung.</Text>
        </View>

        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          <Text style={styles.taskName}>{taskName}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.controlArea}>
          <Animated.View style={[styles.pauseRingOuter, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable style={styles.pauseButton} onPress={togglePause}>
              <Ionicons
                name={phase === 'running' ? 'pause' : 'play'}
                size={s(38)}
                color={COLORS.gold}
              />
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.bottomArea}>
          <Pressable style={styles.endButton} onPress={endSession}>
            <Text style={styles.endButtonText}>Session beenden</Text>
          </Pressable>
        </View>
      </View>
    </>  
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Idle ──────────────────────────────────────────────────────────────────
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
  idleContent: {
    paddingTop: sv(110),
    paddingHorizontal: s(20),
    paddingBottom: sv(100),
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: sv(32),
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
    fontSize: sf(32),
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    textAlign: 'center',
    marginTop: sv(8),
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(10),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: s(14),
    padding: s(14),
    marginBottom: sv(32),
    width: '100%',
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: sf(13),
    lineHeight: sf(20),
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(10),
    backgroundColor: COLORS.gold,
    borderRadius: s(14),
    height: sv(54),
    width: '100%',
  },
  startButtonText: {
    color: COLORS.black,
    fontSize: sf(16),
    fontWeight: '700',
  },

  // ── Setup-Modal ──────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheetScrollContent: {
    paddingBottom: sv(10),
  },
  sheet: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: s(20),
    paddingTop: sv(12),
    paddingBottom: sv(10),
    borderTopWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  sheetHandle: {
    width: s(40),
    height: sv(4),
    borderRadius: 999,
    backgroundColor: COLORS.textDim,
    alignSelf: 'center',
    marginBottom: sv(20),
  },
  sheetTitle: {
    color: COLORS.paleGold,
    fontSize: sf(20),
    fontWeight: '700',
    marginBottom: sv(16),
  },
  label: {
    color: COLORS.textMuted,
    fontSize: sf(11),
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: sv(8),
    marginTop: sv(4),
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: sv(12),
    color: COLORS.white,
    fontSize: sf(15),
    marginBottom: sv(14),
  },

  // Drum-Roll Picker
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: s(12),
    marginBottom: sv(16),
    overflow: 'hidden',
  },
  pickerSeparator: {
    color: COLORS.textMuted,
    fontSize: sf(16),
    fontWeight: '600',
    marginHorizontal: s(6),
  },

  // Kategorie
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: sv(10),
  },
  chip: {
    paddingHorizontal: s(12),
    paddingVertical: sv(7),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  chipText: {
    color: COLORS.textDim,
    fontSize: sf(12),
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.gold,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: sv(8),
  },
  cancelBtn: {
    flex: 1,
    height: sv(50),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: sf(15),
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: sv(50),
    borderRadius: s(12),
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: COLORS.black,
    fontSize: sf(15),
    fontWeight: '700',
  },

  // ── Aktive Session ───────────────────────────────────────────────────────
  sessionHeader: {
    alignItems: 'center',
    paddingTop: sv(80),
    gap: sv(8),
    paddingBottom: sv(8),
  },
  sessionBackButton: {
    position: 'absolute',
    top: sv(54),
    left: s(16),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  sessionBackButtonHidden: {
    opacity: 0,
  },
  timerBlock: {
    alignItems: 'center',
    paddingTop: sv(32),
    gap: sv(12),
  },
  timerText: {
    color: COLORS.gold,
    fontSize: sf(72),
    fontWeight: '300',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  taskName: {
    color: COLORS.textSecondary,
    fontSize: sf(20),
    fontWeight: '500',
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: s(6),
    paddingHorizontal: s(10),
    paddingVertical: sv(4),
  },
  categoryBadgeText: {
    color: COLORS.dimGold,
    fontSize: sf(11),
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  progressTrack: {
    height: sv(3),
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: s(32),
    borderRadius: 999,
    marginTop: sv(32),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 999,
  },
  controlArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseRingOuter: {
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: s(18),
    elevation: 12,
  },
  pauseButton: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    paddingHorizontal: s(20),
    paddingBottom: sv(88),
  },
  endButton: {
    height: sv(54),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: COLORS.textSecondary,
    fontSize: sf(16),
    fontWeight: '600',
  },
});