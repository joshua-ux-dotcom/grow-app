import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function ImportanceButton({
  value,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && styles.buttonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.text,
          active && styles.textActive,
        ]}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard3,
  },
  buttonActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    color: COLORS.textDim,
    fontSize: 16,
    fontWeight: '700',
  },
  textActive: {
    color: COLORS.lightGold,
  },
});