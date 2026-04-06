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
    width: '48%',
    backgroundColor: '#0f0b16',
    borderWidth: 1,
    borderColor: '#2f2238',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 14,
    marginBottom: 14,
    minHeight: 155,
    justifyContent: 'flex-start',
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
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#b7a98b',
    fontSize: 13,
    lineHeight: 19,
  },
});