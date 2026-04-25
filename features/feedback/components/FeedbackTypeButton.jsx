import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function FeedbackTypeButton({
  label,
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
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderMid,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard3,
  },
  buttonActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  textActive: {
    color: COLORS.lightGold,
  },
});