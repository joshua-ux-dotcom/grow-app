import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../constants/colors';
import { s } from '../../../../constants/layout';
import { formatTime } from '../utils/deepWorkUtils';
import { styles } from '../styles/deepWorkStyles';

export default function DeepWorkSessionView({
  router,
  phase,
  taskName,
  category,
  remaining,
  progress,
  pulseAnim,
  togglePause,
  endSession,
}) {
  return (
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
          <Text style={styles.categoryBadgeText}>
            {category.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.controlArea}>
        <Animated.View
          style={[
            styles.pauseRingOuter,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
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
  );
}