import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
    borderColor: '#342C40',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#130F19',
  },
  buttonActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212,175,55,0.12)',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    color: '#AAA3B5',
    fontSize: 16,
    fontWeight: '700',
  },
  textActive: {
    color: '#F2D37A',
  },
});