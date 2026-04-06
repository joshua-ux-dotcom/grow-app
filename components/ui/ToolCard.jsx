import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ToolCard({
  icon,
  title,
  description,
  onPress,
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
  width: '47%',
  backgroundColor: '#0d0913',
  borderWidth: 1,
  borderColor: '#2d2234',
  borderRadius: 20,
  paddingVertical: 18,
  paddingHorizontal: 16,
  marginBottom: 14,
  minHeight: 135,
},
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#6d5330',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#15101d',
  },
  icon: {
    fontSize: 24,
  },
  title: {
  color: '#f4e7c5',
  fontSize: 17,
  fontWeight: '700',
  marginBottom: 6,
},
description: {
  color: '#a89982',
  fontSize: 12.5,
  lineHeight: 18,
},
});