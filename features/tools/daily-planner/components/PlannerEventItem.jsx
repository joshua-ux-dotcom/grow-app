import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout'
import { SLOT_HEIGHT } from '../utils/plannerUtils';

export function PlannerEventItem({ event, onPress }) {
  const [startHour, startMinute] = event.start_time.split(':').map(Number);
  const [endHour, endMinute] = event.end_time.split(':').map(Number);

  const startSlot = startHour * 2 + (startMinute >= 30 ? 1 : 0);
  const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  const heightPx = Math.max((durationMinutes / 30) * SLOT_HEIGHT - 3, SLOT_HEIGHT - 3);

  return (
    <Pressable
      style={[
        styles.eventBlock,
        {
          top: startSlot * SLOT_HEIGHT + 1,
          height: heightPx,
        },
      ]}
      onPress={() => onPress(event)}
    >
      <Text style={styles.eventTitle} numberOfLines={2}>
        {event.title}
      </Text>

      <Text style={styles.eventTime}>
        {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eventBlock: {
    position: 'absolute',
    left: s(62),
    right: s(12),
    borderRadius: s(12),
    backgroundColor: COLORS.gold,
    paddingHorizontal: s(10),
    paddingVertical: sv(6),
    justifyContent: 'center',
  },
  eventTitle: {
    color: COLORS.black,
    fontSize: sf(13),
    fontWeight: '900',
  },
  eventTime: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: sf(11),
    fontWeight: '700',
    marginTop: sv(2),
  },
});