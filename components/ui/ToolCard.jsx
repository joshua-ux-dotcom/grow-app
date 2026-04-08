import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ToolCard({ icon, title, description, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47.5%',
    backgroundColor: '#0d0913',
    borderWidth: 1,
    borderColor: '#7f6236',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 118,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#7f6236',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#120d19',
  },
  icon: {
    fontSize: 21,
  },
  title: {
    color: '#f4e7c5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center'
  },
  description: {
    color: '#a89881',
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
  },
});