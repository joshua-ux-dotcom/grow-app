import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default function InfoCard({ icon, title, text }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.darkCard3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 12,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    marginBottom: 10,
  },
  title: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  text: {
    color: COLORS.textDim,
    fontSize: 11,
    lineHeight: 15,
  },
});