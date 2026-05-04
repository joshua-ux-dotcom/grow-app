import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

import { COLORS } from '../../../../constants/colors';
import { s, sv, sf } from '../../../../constants/layout';

const ITEM_H = sv(48);
const VISIBLE = 5;

export function PickerColumn({ data, initialIndex, onChange }) {
  const ref = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: initialIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const onScrollEnd = useCallback((e) => {
    const idx = Math.max(
      0,
      Math.min(
        data.length - 1,
        Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
      )
    );

    setActiveIndex(idx);
    onChange(idx);
  }, [data.length, onChange]);

  const centerOffset = Math.floor(VISIBLE / 2) * ITEM_H;

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={[styles.line, { top: centerOffset }]} />
      <View pointerEvents="none" style={[styles.line, { top: centerOffset + ITEM_H }]} />

      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: centerOffset }}
        style={styles.scroll}
      >
        {data.map((val, i) => {
          const isActive = i === activeIndex;

          return (
            <View key={i} style={styles.item}>
              <Text style={[
                styles.text,
                isActive && styles.textActive,
              ]}>
                {val}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View pointerEvents="none" style={styles.fadeTop} />
      <View pointerEvents="none" style={styles.fadeBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  scroll: {
    height: ITEM_H * VISIBLE,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: sf(16),
    fontWeight: '700',
  },
  textActive: {
    color: COLORS.white,
    fontSize: sf(18),
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.goldBorder,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});